from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database.session import get_db
from app.models.compliance import ComplianceRequirement
from app.schemas.compliance import ComplianceRequirementResponse, ComplianceSummaryResponse
from app.services.compliance_service import compliance_service
from app.services.dashboard_service import dashboard_service
from app.api.institution.dashboard import get_current_institution_id

router = APIRouter(prefix="/institution/compliance", tags=["Compliance"])

@router.get("/summary", response_model=ComplianceSummaryResponse)
def get_compliance_summary(
    institution_id: str = Depends(get_current_institution_id),
    db: Session = Depends(get_db)
):
    """Compliance progress summary: 8 / 10 completed, 80%, completed/pending/overdue"""
    return dashboard_service.get_compliance_summary(db, institution_id)

@router.get("", response_model=List[ComplianceRequirementResponse])
def get_compliance_requirements(
    category: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    institution_id: str = Depends(get_current_institution_id),
    db: Session = Depends(get_db)
):
    """
    List all compliance requirements with dynamic overdue calculations.
    """
    query = db.query(ComplianceRequirement).filter(ComplianceRequirement.institution_id == institution_id)

    if category:
        query = query.filter(ComplianceRequirement.category.ilike(f"%{category}%"))

    reqs = query.order_by(ComplianceRequirement.due_date.asc()).all()
    
    enriched = [compliance_service.enrich_requirement(r) for r in reqs]

    if status_filter and status_filter.lower() != "all":
        enriched = [r for r in enriched if status_filter.lower() in r["status"].lower()]

    return enriched

@router.post("/{id}/submit", response_model=ComplianceRequirementResponse)
def submit_compliance_requirement(
    id: int,
    remarks: Optional[str] = None,
    institution_id: str = Depends(get_current_institution_id),
    db: Session = Depends(get_db)
):
    """Submit proof/undertaking for a compliance requirement"""
    req = db.query(ComplianceRequirement).filter(
        ComplianceRequirement.id == id,
        ComplianceRequirement.institution_id == institution_id
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Compliance requirement not found")

    req.status = "Submitted"
    req.submitted_at = datetime.utcnow()
    if remarks:
        req.remarks = remarks

    db.commit()
    db.refresh(req)
    return compliance_service.enrich_requirement(req)
