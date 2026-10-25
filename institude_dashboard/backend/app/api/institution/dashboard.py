from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database.session import get_db
from app.models.institution import Institution
from app.models.application import Application
from app.models.notification import Notification
from app.models.alert import Alert
from app.services.dashboard_service import dashboard_service
from app.services.health_score_service import health_score_service
from app.schemas.dashboard import (
    ConsolidatedDashboardResponse,
    DashboardSummaryCards,
    ApplicationSummaryResponse,
    ActionRequiredItem,
    DeadlineItem,
    HealthScoreResponse
)
from app.schemas.institution import InstitutionResponse
from app.schemas.application import ApplicationRecentItem
from app.schemas.document import DocumentPassportItem
from app.schemas.compliance import ComplianceSummaryResponse
from app.schemas.evc import EVCStatusResponse
from app.schemas.notification import NotificationResponse
from app.schemas.alert import AlertResponse
from app.core.config import settings

router = APIRouter(prefix="/institution", tags=["Institution Dashboard"])

def get_current_institution_id(x_institution_id: Optional[str] = Header(None)) -> str:
    """Extracts institution_id from header or defaults to configured default"""
    return x_institution_id or settings.DEFAULT_INSTITUTION_ID

@router.get("/dashboard", response_model=ConsolidatedDashboardResponse)
def get_consolidated_dashboard(
    institution_id: str = Depends(get_current_institution_id),
    db: Session = Depends(get_db)
):
    """
    Returns full dashboard data package in one request to optimize initial page load.
    All data is computed dynamically from database tables.
    """
    inst = db.query(Institution).filter(Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")

    # 1. Summary Cards
    summary_data = dashboard_service.get_summary_cards(db, institution_id)

    # 2. Application Chart Summary
    app_summary_data = dashboard_service.get_application_summary(db, institution_id)

    # 3. Recent Applications
    recent_apps = db.query(Application).filter(
        Application.institution_id == institution_id
    ).order_by(Application.submitted_at.desc().nullslast()).limit(5).all()

    recent_apps_list = []
    for a in recent_apps:
        recent_apps_list.append(ApplicationRecentItem(
            id=a.id,
            application_number=a.application_number,
            application_type=a.application_type,
            submitted_date=a.submitted_at.strftime("%d %b %Y") if a.submitted_at else "Draft",
            current_stage=a.current_stage,
            status=a.status
        ))

    # 4. Action Required Section
    action_required_data = dashboard_service.get_action_required(db, institution_id)

    # 5. Upcoming Deadlines
    deadlines_data = dashboard_service.get_upcoming_deadlines(db, institution_id)

    # 6. Smart Document Passport
    passport_data = dashboard_service.get_document_passport(db, institution_id)

    # 7. Compliance Overview
    compliance_data = dashboard_service.get_compliance_summary(db, institution_id)

    # 8. EVC Status
    evc_data = dashboard_service.get_evc_status(db, institution_id)

    # 9. Notifications (unread first)
    notifs = db.query(Notification).filter(
        Notification.institution_id == institution_id
    ).order_by(Notification.created_at.desc()).limit(10).all()

    # 10. Alerts (Smart Alert Center)
    alerts = db.query(Alert).filter(
        Alert.institution_id == institution_id,
        Alert.is_dismissed == False
    ).order_by(Alert.id.asc()).all()

    # 11. Health Score
    health_data = health_score_service.calculate_institution_health_score(db, institution_id)

    return {
        "institution": inst,
        "summary": summary_data,
        "application_summary": app_summary_data,
        "recent_applications": recent_apps_list,
        "action_required": action_required_data,
        "deadlines": deadlines_data,
        "document_passport": passport_data,
        "compliance": compliance_data,
        "evc": evc_data,
        "notifications": notifs,
        "alerts": alerts,
        "health_score": health_data
    }

@router.get("/dashboard/summary", response_model=DashboardSummaryCards)
def get_dashboard_summary(
    institution_id: str = Depends(get_current_institution_id),
    db: Session = Depends(get_db)
):
    """Card 1-6 summary counters computed dynamically from database"""
    return dashboard_service.get_summary_cards(db, institution_id)

@router.get("/dashboard/application-summary", response_model=ApplicationSummaryResponse)
def get_dashboard_application_summary(
    institution_id: str = Depends(get_current_institution_id),
    db: Session = Depends(get_db)
):
    """Donut/pie chart distribution breakdown of applications"""
    return dashboard_service.get_application_summary(db, institution_id)

@router.get("/dashboard/action-required", response_model=List[ActionRequiredItem])
def get_dashboard_action_required(
    institution_id: str = Depends(get_current_institution_id),
    db: Session = Depends(get_db)
):
    """Prominent dynamic actions that require institution attention"""
    return dashboard_service.get_action_required(db, institution_id)

@router.get("/dashboard/deadlines", response_model=List[DeadlineItem])
def get_dashboard_deadlines(
    institution_id: str = Depends(get_current_institution_id),
    db: Session = Depends(get_db)
):
    """Timeline of upcoming institutional deadlines with remaining days"""
    return dashboard_service.get_upcoming_deadlines(db, institution_id)
