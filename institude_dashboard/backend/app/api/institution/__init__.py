from fastapi import APIRouter
from app.api.institution.dashboard import router as dashboard_router
from app.api.institution.applications import router as applications_router
from app.api.institution.documents import router as documents_router
from app.api.institution.compliance import router as compliance_router
from app.api.institution.evc import router as evc_router
from app.api.institution.notifications import router as notifications_router
from app.api.institution.alerts import router as alerts_router
from app.api.institution.health_score import router as health_score_router
from app.api.institution.assistant import router as assistant_router

api_router = APIRouter()

api_router.include_router(dashboard_router)
api_router.include_router(applications_router)
api_router.include_router(documents_router)
api_router.include_router(compliance_router)
api_router.include_router(evc_router)
api_router.include_router(notifications_router)
api_router.include_router(alerts_router)
api_router.include_router(health_score_router)
api_router.include_router(assistant_router)
