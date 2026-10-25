from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.dashboard import HealthScoreResponse
from app.services.health_score_service import health_score_service
from app.api.institution.dashboard import get_current_institution_id

router = APIRouter(prefix="/institution/health-score", tags=["Health Score"])

@router.get("", response_model=HealthScoreResponse)
def get_institution_health_score(
    institution_id: str = Depends(get_current_institution_id),
    db: Session = Depends(get_db)
):
    """
    Calculates dynamic AICTE SmartAssist institutional health score from live database records:
    Application Compliance, Document Validity, Undertaking Compliance, and Pending Actions.
    Includes the official disclaimer.
    """
    return health_score_service.calculate_institution_health_score(db, institution_id)
