from sqlalchemy.orm import Session
from datetime import date, datetime
from typing import List, Dict, Any
from app.models.application import Application
from app.models.document import Document
from app.models.compliance import ComplianceRequirement
from app.models.evc import EVCVisit
from app.models.notification import Notification
from app.models.alert import Alert
from app.models.institution import Institution
from app.services.document_service import document_service
from app.services.compliance_service import compliance_service

class DashboardService:
    @staticmethod
    def get_summary_cards(db: Session, institution_id: str) -> dict:
        total_apps = db.query(Application).filter(Application.institution_id == institution_id).count()
        under_scrutiny = db.query(Application).filter(
            Application.institution_id == institution_id,
            Application.status == "Under Scrutiny"
        ).count()
        correction_required = db.query(Application).filter(
            Application.institution_id == institution_id,
            Application.status == "Correction Required"
        ).count()
        
        # Compliance Pending (Pending or Overdue)
        all_comp = db.query(ComplianceRequirement).filter(ComplianceRequirement.institution_id == institution_id).all()
        compliance_pending = sum(
            1 for c in all_comp if compliance_service.get_effective_status(c)[0] in ("Pending", "Overdue")
        )
        
        # Documents Expiring & Expired
        all_docs = db.query(Document).filter(Document.institution_id == institution_id).all()
        documents_expiring = 0
        expired_documents = 0
        for d in all_docs:
            status, _ = document_service.calculate_expiry_status(d.expiry_date)
            if status in ("Expiring Soon", "Critical"):
                documents_expiring += 1
            elif status == "Expired":
                expired_documents += 1

        return {
            "total_applications": total_apps,
            "under_scrutiny": under_scrutiny,
            "correction_required": correction_required,
            "compliance_pending": compliance_pending,
            "documents_expiring": documents_expiring,
            "expired_documents": expired_documents,
        }

    @staticmethod
    def get_application_summary(db: Session, institution_id: str) -> dict:
        apps = db.query(Application).filter(Application.institution_id == institution_id).all()
        
        stages = {
            "Draft": {"count": 0, "color": "#94a3b8"}, # Slate
            "Submitted": {"count": 0, "color": "#38bdf8"}, # Sky
            "Under Scrutiny": {"count": 0, "color": "#4f46e5"}, # Indigo
            "Correction Required": {"count": 0, "color": "#f97316"}, # Orange
            "EVC": {"count": 0, "color": "#8b5cf6"}, # Purple
            "Completed": {"count": 0, "color": "#10b981"}, # Emerald
            "Rejected": {"count": 0, "color": "#ef4444"}, # Red
        }
        
        for a in apps:
            st = a.status
            if st in ("Under Scrutiny", "Scrutiny"):
                stages["Under Scrutiny"]["count"] += 1
            elif st in ("Correction Required", "Document Verification"):
                stages["Correction Required"]["count"] += 1
            elif st in ("EVC", "EVC Scheduled"):
                stages["EVC"]["count"] += 1
            elif st in ("Completed", "Approved"):
                stages["Completed"]["count"] += 1
            elif st == "Rejected":
                stages["Rejected"]["count"] += 1
            elif st == "Submitted":
                stages["Submitted"]["count"] += 1
            else:
                stages["Draft"]["count"] += 1

        distribution = [
            {"name": stage, "count": info["count"], "color": info["color"]}
            for stage, info in stages.items()
        ]

        return {
            "total": len(apps),
            "distribution": distribution
        }

    @staticmethod
    def get_action_required(db: Session, institution_id: str) -> List[dict]:
        actions = []
        
        # 1. Correction Required Applications
        correction_apps = db.query(Application).filter(
            Application.institution_id == institution_id,
            Application.status == "Correction Required"
        ).all()
        for app in correction_apps:
            actions.append({
                "id": f"action-app-{app.id}",
                "type": "Correction Required",
                "title": f"Application {app.application_number} requires correction",
                "description": app.remarks or f"Deficiencies reported during scrutiny. Please submit revised documents before deadline.",
                "button_label": "Review Application",
                "button_action": f"/institution/applications?id={app.id}",
                "severity": "critical",
                "entity_id": str(app.id)
            })

        # 2. Documents Expiring Soon or Critical
        docs = db.query(Document).filter(Document.institution_id == institution_id).all()
        for doc in docs:
            status, days = document_service.calculate_expiry_status(doc.expiry_date)
            if status in ("Expiring Soon", "Critical", "Expired"):
                if status == "Expired":
                    actions.append({
                        "id": f"action-doc-{doc.id}",
                        "type": "Document Expired",
                        "title": f"{doc.document_type} is expired",
                        "description": f"Document expired on {doc.expiry_date}. Upload renewed certificate immediately.",
                        "button_label": "Renew Document",
                        "button_action": f"/institution/documents?type={doc.document_type}",
                        "severity": "critical",
                        "entity_id": str(doc.id)
                    })
                else:
                    actions.append({
                        "id": f"action-doc-{doc.id}",
                        "type": "Document Expiring",
                        "title": f"{doc.document_type} expires in {days} days",
                        "description": f"Valid until {doc.expiry_date}. Ensure timely renewal to maintain approval compliance.",
                        "button_label": "Renew Document",
                        "button_action": f"/institution/documents?type={doc.document_type}",
                        "severity": "high" if status == "Critical" else "medium",
                        "entity_id": str(doc.id)
                    })

        # 3. Compliance Deadlines Pending / Overdue
        reqs = db.query(ComplianceRequirement).filter(ComplianceRequirement.institution_id == institution_id).all()
        for req in reqs:
            eff_status, days = compliance_service.get_effective_status(req)
            if eff_status == "Overdue":
                actions.append({
                    "id": f"action-comp-{req.id}",
                    "type": "Compliance Overdue",
                    "title": f"Compliance requirement '{req.requirement_name}' is overdue",
                    "description": f"Was due on {req.due_date}. Immediate submission required to prevent penalty.",
                    "button_label": "Submit Compliance",
                    "button_action": f"/institution/compliance?id={req.id}",
                    "severity": "critical",
                    "entity_id": str(req.id)
                })
            elif eff_status == "Pending" and days <= 14:
                actions.append({
                    "id": f"action-comp-{req.id}",
                    "type": "Compliance Deadline",
                    "title": f"Compliance submission due in {days} days",
                    "description": f"Mandatory compliance '{req.requirement_name}' is due on {req.due_date}.",
                    "button_label": "Submit Compliance",
                    "button_action": f"/institution/compliance?id={req.id}",
                    "severity": "high" if days <= 7 else "medium",
                    "entity_id": str(req.id)
                })

        return actions[:6] # Return top urgent items

    @staticmethod
    def get_upcoming_deadlines(db: Session, institution_id: str) -> List[dict]:
        deadlines = []
        today = date.today()

        # 1. Compliance due dates
        reqs = db.query(ComplianceRequirement).filter(
            ComplianceRequirement.institution_id == institution_id,
            ComplianceRequirement.status != "Verified"
        ).all()
        for req in reqs:
            days = (req.due_date - today).days
            if days >= 0:
                deadlines.append({
                    "id": f"dl-comp-{req.id}",
                    "date_display": req.due_date.strftime("%d %b"),
                    "title": f"Compliance: {req.requirement_name}",
                    "days_remaining": days,
                    "days_text": f"{days} days remaining" if days > 0 else "Due today",
                    "category": "Compliance",
                    "severity": "critical" if days <= 7 else "warning" if days <= 15 else "info"
                })

        # 2. Document expiry dates
        docs = db.query(Document).filter(
            Document.institution_id == institution_id,
            Document.expiry_date.isnot(None)
        ).all()
        for doc in docs:
            days = (doc.expiry_date - today).days
            if 0 <= days <= 45:
                deadlines.append({
                    "id": f"dl-doc-{doc.id}",
                    "date_display": doc.expiry_date.strftime("%d %b"),
                    "title": f"{doc.document_type} Renewal",
                    "days_remaining": days,
                    "days_text": f"{days} days remaining" if days > 0 else "Expires today",
                    "category": "Document",
                    "severity": "critical" if days <= 7 else "warning" if days <= 15 else "info"
                })

        # 3. EVC visit date
        evc = db.query(EVCVisit).filter(
            EVCVisit.institution_id == institution_id,
            EVCVisit.status == "Scheduled"
        ).first()
        if evc and evc.visit_date:
            days = (evc.visit_date - today).days
            if days >= 0:
                deadlines.append({
                    "id": f"dl-evc-{evc.id}",
                    "date_display": evc.visit_date.strftime("%d %b"),
                    "title": "EVC Committee Preparation",
                    "days_remaining": days,
                    "days_text": f"{days} days remaining" if days > 0 else "Visit today",
                    "category": "EVC",
                    "severity": "warning" if days <= 14 else "info"
                })

        # Sort chronologically by days_remaining ascending
        deadlines.sort(key=lambda x: x["days_remaining"])
        return deadlines[:6]

    @staticmethod
    def get_document_passport(db: Session, institution_id: str) -> List[dict]:
        docs = db.query(Document).filter(Document.institution_id == institution_id).all()
        passport_items = []
        for d in docs:
            status, days = document_service.calculate_expiry_status(d.expiry_date)
            passport_items.append({
                "id": d.id,
                "document_type": d.document_type,
                "document_name": d.document_name,
                "verification_status": d.verification_status,
                "expiry_date": d.expiry_date,
                "expiry_status": status,
                "days_remaining": days,
                "file_url": d.file_url or f"/api/institution/documents/download/{d.id}"
            })
        return passport_items

    @staticmethod
    def get_compliance_summary(db: Session, institution_id: str) -> dict:
        reqs = db.query(ComplianceRequirement).filter(ComplianceRequirement.institution_id == institution_id).all()
        total = len(reqs)
        if total == 0:
            return {
                "total_requirements": 0,
                "completed_requirements": 0,
                "pending_requirements": 0,
                "overdue_requirements": 0,
                "progress_percentage": 100.0
            }
            
        completed = sum(1 for r in reqs if r.status in ("Verified", "Submitted"))
        overdue = sum(1 for r in reqs if compliance_service.get_effective_status(r)[0] == "Overdue")
        pending = total - completed - overdue
        if pending < 0:
            pending = 0
            
        progress_percentage = round((completed / total) * 100, 1)

        return {
            "total_requirements": total,
            "completed_requirements": completed,
            "pending_requirements": pending,
            "overdue_requirements": overdue,
            "progress_percentage": progress_percentage
        }

    @staticmethod
    def get_evc_status(db: Session, institution_id: str) -> dict:
        evc = db.query(EVCVisit).filter(EVCVisit.institution_id == institution_id).order_by(EVCVisit.visit_date.asc()).first()
        if not evc:
            return {"is_applicable": False}

        today = date.today()
        days_until = (evc.visit_date - today).days if evc.visit_date else None
        
        # Format date e.g. "20 Nov 2026"
        formatted_date = evc.visit_date.strftime("%d %b %Y") if evc.visit_date else "TBD"

        app_num = None
        if evc.application:
            app_num = evc.application.application_number

        return {
            "is_applicable": True,
            "id": evc.id,
            "application_id": evc.application_id,
            "application_number": app_num,
            "visit_date": evc.visit_date,
            "formatted_date": formatted_date,
            "visit_time": evc.visit_time or "10:30 AM",
            "visit_type": evc.visit_type or "Committee Visit",
            "status": evc.status or "Scheduled",
            "committee_members_count": evc.committee_members_count or 3,
            "preparation_status_pct": evc.preparation_status_pct or 75,
            "venue_or_mode": evc.venue_or_mode or "On-site Inspection",
            "contact_person": evc.contact_person or "Principal / AICTE Coordinator",
            "remarks": evc.remarks,
            "days_until_visit": days_until
        }

dashboard_service = DashboardService()
