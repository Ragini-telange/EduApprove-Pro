import os
import jwt
from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from models.domain import UserRole

security_scheme = HTTPBearer(auto_error=False)

class AuthenticatedUser(BaseModel):
    user_id: str
    email: str
    role: UserRole
    jurisdiction_states: List[str] = []
    institution_id: Optional[str] = None
    is_mock: bool = False

def get_supabase_jwt_secret() -> Optional[str]:
    return os.environ.get("SUPABASE_JWT_SECRET")

def is_live_mode() -> bool:
    mode = os.environ.get("EDUAPPROVE_DATA_MODE", os.environ.get("VITE_DATA_SERVICE_MODE", "mock")).lower()
    return mode == "live"

def get_configured_algorithm() -> Optional[str]:
    """Returns explicitly configured JWT algorithm if set in environment."""
    return os.environ.get("SUPABASE_JWT_ALGORITHM")

def get_expected_audience() -> str:
    """Supabase auth tokens standardly carry 'authenticated' audience."""
    return os.environ.get("SUPABASE_JWT_AUDIENCE", "authenticated")

def get_expected_issuer() -> Optional[str]:
    """Returns configured Supabase issuer URL or derives from SUPABASE_URL if available."""
    iss = os.environ.get("SUPABASE_JWT_ISSUER")
    if iss:
        return iss.rstrip("/")
    base_url = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
    if base_url:
        return f"{base_url.rstrip('/')}/auth/v1"
    return None

def resolve_signing_key_and_alg(token: str, secret: Optional[str] = None):
    """
    Inspects token header and resolves verification key and expected algorithm
    based on server configuration and token header.
    Never accepts unsigned tokens or unexpected algorithms.
    """
    # 1. Parse and validate token header
    try:
        header = jwt.get_unverified_header(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token header: unable to parse JWT header."
        )

    token_alg = header.get("alg")
    if not token_alg or token_alg.lower() == "none":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unsigned tokens ('alg': 'none') are strictly prohibited."
        )

    # 2. Check explicitly configured algorithm
    configured_alg = get_configured_algorithm()
    if configured_alg and token_alg != configured_alg:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Unexpected token signing algorithm '{token_alg}'. Expected '{configured_alg}'."
        )

    # 3. Check symmetric secret (HS256)
    jwt_secret = secret or get_supabase_jwt_secret()

    # 4. Check asymmetric credentials (RS256 / ES256)
    jwks_url = os.environ.get("SUPABASE_JWKS_URL")
    public_key = os.environ.get("SUPABASE_PUBLIC_KEY")

    # Determine expected algorithm if not explicitly set
    if configured_alg:
        expected_alg = configured_alg
    elif jwt_secret:
        expected_alg = "HS256"
    elif jwks_url or public_key:
        expected_alg = token_alg if token_alg in ("RS256", "ES256") else "RS256"
    else:
        if is_live_mode():
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Server configuration error: No Supabase JWT verification method configured. "
                       "Please configure SUPABASE_JWT_SECRET (for HS256) or SUPABASE_JWKS_URL / SUPABASE_PUBLIC_KEY (for RS256/ES256)."
            )
        # Mock/offline fallback
        expected_alg = token_alg

    # Verify that the token's header algorithm matches the expected algorithm
    if token_alg != expected_alg:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token algorithm '{token_alg}' does not match expected algorithm '{expected_alg}'."
        )

    # Resolve verification key
    if expected_alg == "HS256":
        if not jwt_secret and is_live_mode():
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Server configuration error: SUPABASE_JWT_SECRET is missing in live mode."
            )
        return jwt_secret, expected_alg

    elif expected_alg in ("RS256", "ES256"):
        if public_key:
            return public_key, expected_alg
        elif jwks_url:
            try:
                jwk_client = jwt.PyJWKClient(jwks_url)
                signing_key = jwk_client.get_signing_key_from_jwt(token)
                return signing_key.key, expected_alg
            except Exception as err:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"JWKS key resolution failed: {str(err)}"
                )
        else:
            if is_live_mode():
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Server configuration error: Asymmetric algorithm '{expected_alg}' configured, but neither SUPABASE_PUBLIC_KEY nor SUPABASE_JWKS_URL is provided."
                )
            return None, expected_alg

    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Unsupported signing algorithm: '{expected_alg}'."
        )

def verify_token_claims(
    token: str,
    secret: Optional[str] = None,
    expected_aud: Optional[str] = None,
    expected_iss: Optional[str] = None
) -> dict:
    """
    Decodes and strictly validates a Supabase Bearer JWT token.
    Enforces signature, expiration, audience, issuer, and algorithm.
    """
    signing_key, expected_alg = resolve_signing_key_and_alg(token, secret=secret)
    aud = expected_aud if expected_aud is not None else get_expected_audience()
    iss = expected_iss if expected_iss is not None else get_expected_issuer()

    decode_kwargs = {
        "algorithms": [expected_alg],
        "options": {
            "verify_signature": bool(signing_key),
            "verify_exp": True,
            "verify_aud": bool(aud),
            "verify_iss": bool(iss),
        }
    }
    if aud:
        decode_kwargs["audience"] = aud
    if iss:
        decode_kwargs["issuer"] = iss

    try:
        if signing_key:
            payload = jwt.decode(token, signing_key, **decode_kwargs)
        else:
            payload = jwt.decode(token, **decode_kwargs)
        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired."
        )
    except jwt.InvalidAudienceError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing token audience claim."
        )
    except jwt.InvalidIssuerError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing token issuer claim."
        )
    except jwt.InvalidSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token signature."
        )
    except jwt.InvalidAlgorithmError as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token signing algorithm: {str(err)}"
        )
    except jwt.InvalidTokenError as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(err)}"
        )

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> AuthenticatedUser:
    """
    Reusable FastAPI authentication dependency.
    Validates Supabase Bearer JWT, extracting verified identity, role, and jurisdiction.
    """
    # 1. If Bearer token is provided, strictly validate it
    if credentials and credentials.scheme.lower() == "bearer" and credentials.credentials:
        token = credentials.credentials.strip()
        payload = verify_token_claims(token)
        
        user_id = payload.get("sub") or payload.get("id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token is missing authoritative subject (sub) claim."
            )
            
        email = payload.get("email", "")
        app_metadata = payload.get("app_metadata", {})
        
        # Derive role strictly from verified app_metadata claim
        raw_role = app_metadata.get("role") or payload.get("role")
        if not raw_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Token does not contain a verified regulatory role in app_metadata."
            )
            
        try:
            role = UserRole(raw_role)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Unknown or invalid regulatory role claim: '{raw_role}'"
            )
            
        jurisdiction_states = app_metadata.get("jurisdiction_states", [])
        institution_id = app_metadata.get("institution_id")
        
        return AuthenticatedUser(
            user_id=user_id,
            email=email,
            role=role,
            jurisdiction_states=jurisdiction_states,
            institution_id=institution_id,
            is_mock=False
        )

    # 2. In live mode, missing token fails closed
    if is_live_mode():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization Bearer token required in live mode."
        )

    # 3. Local Mock / Test fallback (preserves existing offline unit tests)
    return AuthenticatedUser(
        user_id="mock-user-001",
        email="regional.officer@aicte.gov.in",
        role=UserRole.REGIONAL_OFFICER,
        jurisdiction_states=["Maharashtra", "Goa"],
        institution_id=None,
        is_mock=True
    )

def require_roles(allowed_roles: List[UserRole]):
    """Enforces server-side role-based access control based on verified token."""
    def role_checker(current_user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
        if current_user.role not in allowed_roles:
            role_names = ", ".join([r.value for r in allowed_roles])
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role.value}' is not authorized. Required: {role_names}."
            )
        return current_user
    return role_checker
