from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.models.alert import Alert
from app.schemas.alert import AlertResponse
from app.api.institution.dashboard import get_current_institution_id

router = APIRouter(prefix="/institution/alerts", tags=["Smart Alert Center"])

@router.get("", response_model=List[AlertResponse])
def get_alerts(
    institution_id: str = Depends(get_current_institution_id),
    db: Session = Depends(get_db)
):
    """
    Returns prioritized alerts for the Smart Alert Center:
    🔴 Critical (e.g. Expired certificates)
    🟠 High Priority (e.g. Lease expires in 12 days)
    🟡 Upcoming (e.g. Compliance due in 7 days)
    """
    alerts = db.query(Alert).filter(
        Alert.institution_id == institution_id,
        Alert.is_dismissed == False
    ).order_by(
        # Order by severity priority
        Alert.id.asc()
    ).all()
    
    return alerts
