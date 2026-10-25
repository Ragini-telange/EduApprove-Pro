-- ============================================================================
-- EDUAPPROVE PRO — AICTE REGULATORY PLATFORM
-- Migration 002: Core Master Tables (Institutions & User Profiles)
-- Module: Shared Database (Institution Admin, Regional Officer, Senior Authority)
-- ============================================================================

-- Helper: Auto-update updated_at timestamp function (hardened with fixed search_path)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;


-- ----------------------------------------------------------------------------
-- 1. INSTITUTIONS TABLE
-- Educational institutions managed by Institution Admins (Sakshi)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aicte_permanent_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pin_code VARCHAR(10) NOT NULL,
    regional_office TEXT NOT NULL,
    institution_type TEXT NOT NULL CHECK (institution_type IN ('Govt', 'Govt-Aided', 'Private-Unaided', 'University-Dept')),
    contact_person TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    established_year INTEGER NOT NULL CHECK (established_year >= 1800 AND established_year <= 2100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_institutions_updated_at ON public.institutions;
CREATE TRIGGER set_institutions_updated_at
    BEFORE UPDATE ON public.institutions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Indexes for spatial and regional filtering
CREATE INDEX IF NOT EXISTS idx_institutions_regional_office ON public.institutions(regional_office);
CREATE INDEX IF NOT EXISTS idx_institutions_state ON public.institutions(state);
CREATE INDEX IF NOT EXISTS idx_institutions_aicte_pid ON public.institutions(aicte_permanent_id);

-- ----------------------------------------------------------------------------
-- 2. USER PROFILES TABLE
-- Extended regulatory profile linked to Supabase auth.users(id)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'institution_admin',
    designation TEXT,
    regional_office TEXT,
    jurisdiction_states TEXT[] DEFAULT '{}',
    institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
    badge_number TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Indexes on profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_institution_id ON public.profiles(institution_id);
CREATE INDEX IF NOT EXISTS idx_profiles_regional_office ON public.profiles(regional_office);

-- ----------------------------------------------------------------------------
-- 3. AUTOMATED PROFILE CREATION ON AUTH SIGNUP
-- Hardened against privilege escalation: Only assigns safe default role
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    assigned_role public.user_role;
BEGIN
    -- Read role strictly from raw_app_meta_data (set by admin/service-role)
    -- NEVER trust raw_user_meta_data for role or jurisdiction assignment
    IF NEW.raw_app_meta_data IS NOT NULL AND NEW.raw_app_meta_data ? 'role' THEN
        BEGIN
            assigned_role := (NEW.raw_app_meta_data->>'role')::public.user_role;
        EXCEPTION WHEN OTHERS THEN
            assigned_role := 'institution_admin'::public.user_role;
        END;
    ELSE
        assigned_role := 'institution_admin'::public.user_role;
    END IF;

    INSERT INTO public.profiles (
        id,
        email,
        name,
        role,
        designation,
        regional_office,
        jurisdiction_states,
        institution_id,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(
            NEW.raw_user_meta_data->>'name',
            NEW.raw_user_meta_data->>'full_name',
            split_part(COALESCE(NEW.email, 'user'), '@', 1)
        ),
        assigned_role,
        COALESCE(NEW.raw_user_meta_data->>'designation', 'Authorized Representative'),
        NULL, -- regional_office starts NULL; assigned only by HQ/Super Admin
        '{}', -- jurisdiction_states start empty; assigned only by HQ/Super Admin
        NULL, -- institution_id starts NULL; bound only through verified onboarding
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

-- Trigger to execute on Supabase auth.users signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 6. IMMUTABLE PROFILE PRIVILEGES TRIGGER (DEFENSE-IN-DEPTH)
-- Enforces engine-level protection against role, institution, or jurisdiction tampering
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_profile_privilege_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Super Admin or internal service-role can alter role, institution_id, or jurisdiction
    IF (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin' OR auth.role() = 'service_role' THEN
        RETURN NEW;
    END IF;

    -- Freeze regulatory authority attributes for all ordinary users and officers
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        RAISE EXCEPTION 'SECURITY VIOLATION: Role cannot be modified by user.';
    END IF;

    IF NEW.institution_id IS DISTINCT FROM OLD.institution_id THEN
        RAISE EXCEPTION 'SECURITY VIOLATION: Institution binding cannot be modified by user.';
    END IF;

    IF NEW.jurisdiction_states IS DISTINCT FROM OLD.jurisdiction_states THEN
        RAISE EXCEPTION 'SECURITY VIOLATION: Territorial jurisdiction cannot be modified by user.';
    END IF;

    IF NEW.regional_office IS DISTINCT FROM OLD.regional_office THEN
        RAISE EXCEPTION 'SECURITY VIOLATION: Regional office assignment cannot be modified by user.';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_privileges ON public.profiles;
CREATE TRIGGER trg_protect_profile_privileges
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_profile_privilege_immutability();

