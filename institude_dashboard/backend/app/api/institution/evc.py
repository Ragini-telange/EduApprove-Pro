from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.evc import EVCStatusResponse
from app.services.dashboard_service import dashboard_service
from app.api.institution.dashboard import get_current_institution_id

router = APIRouter(prefix="/institution/evc", tags=["EVC Visit"])

@router.get("/status", response_model=EVCStatusResponse)
def get_evc_status(
    institution_id: str = Depends(get_current_institution_id),
    db: Session = Depends(get_db)
):
    """
    Returns EVC visit status if scheduled for this institution.
    If no visit is required/scheduled, returns is_applicable = False.
    """
    return dashboard_service.get_evc_status(db, institution_id)
