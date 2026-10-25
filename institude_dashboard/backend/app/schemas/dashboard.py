from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import date, datetime
from app.schemas.institution import InstitutionResponse
from app.schemas.application import ApplicationRecentItem
from app.schemas.document import DocumentPassportItem
from app.schemas.compliance import ComplianceSummaryResponse
from app.schemas.evc import EVCStatusResponse
from app.schemas.notification import NotificationResponse
from app.schemas.alert import AlertResponse

class DashboardSummaryCards(BaseModel):
    total_applications: int
    under_scrutiny: int
    correction_required: int
    compliance_pending: int
    documents_expiring: int
    expired_documents: int

class ApplicationChartItem(BaseModel):
    name: str
    count: int
    color: str

class ApplicationSummaryResponse(BaseModel):
    total: int
    distribution: List[ApplicationChartItem]

class ActionRequiredItem(BaseModel):
    id: str
    type: str # "Correction Required", "Document Expiring", "Compliance Deadline"
    title: str
    description: str
    button_label: str # "Review Application", "Renew Document", "Submit Compliance"
    button_action: str
    severity: str # "critical", "high", "medium"
    entity_id: Optional[str] = None

class DeadlineItem(BaseModel):
    id: str
    date_display: str # e.g. "22 Oct"
    title: str # "Compliance Submission"
    days_remaining: int # 7
    days_text: str # "7 days remaining"
    category: str # "compliance", "document", "evc"
    severity: str # "critical", "warning", "info"

class HealthScoreBreakdown(BaseModel):
    application_compliance: float
    document_validity: float
    undertaking_compliance: float
    pending_actions: float

class HealthScoreResponse(BaseModel):
    score: int
    max_score: int = 100
    status: str # "Excellent", "Good", "Needs Attention", "Critical"
    breakdown: HealthScoreBreakdown
    disclaimer: str = "AICTE SmartAssist Institutional Health Indicator. Not an official AICTE score."

class ConsolidatedDashboardResponse(BaseModel):
    institution: InstitutionResponse
    summary: DashboardSummaryCards
    application_summary: ApplicationSummaryResponse
    recent_applications: List[ApplicationRecentItem]
    action_required: List[ActionRequiredItem]
    deadlines: List[DeadlineItem]
    document_passport: List[DocumentPassportItem]
    compliance: ComplianceSummaryResponse
    evc: EVCStatusResponse
    notifications: List[NotificationResponse]
    alerts: List[AlertResponse]
    health_score: HealthScoreResponse
