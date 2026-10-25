from datetime import date
from typing import List, Tuple
from app.models.compliance import ComplianceRequirement

class ComplianceService:
    @staticmethod
    def get_effective_status(req: ComplianceRequirement) -> Tuple[str, int]:
        """
        Determines effective status:
        If status is not 'Verified' or 'Submitted', and due_date < today -> 'Overdue'.
        Also returns days_remaining (positive if future, negative if past).
        """
        today = date.today()
        days_remaining = (req.due_date - today).days
        
        status = req.status
        if status in ("Pending", "Rejected") and days_remaining < 0:
            status = "Overdue"
            
        return status, days_remaining

    @classmethod
    def enrich_requirement(cls, req: ComplianceRequirement) -> dict:
        status, days_remaining = cls.get_effective_status(req)
        return {
            "id": req.id,
            "institution_id": req.institution_id,
            "requirement_name": req.requirement_name,
            "category": req.category,
            "description": req.description,
            "due_date": req.due_date,
            "status": status,
            "submitted_at": req.submitted_at,
            "verified_at": req.verified_at,
            "remarks": req.remarks,
            "days_remaining": days_remaining,
            "created_at": req.created_at,
            "updated_at": req.updated_at
        }

compliance_service = ComplianceService()
