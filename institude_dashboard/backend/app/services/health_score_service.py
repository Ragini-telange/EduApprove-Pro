from sqlalchemy.orm import Session
from datetime import date
from app.models.application import Application
from app.models.document import Document
from app.models.compliance import ComplianceRequirement
from app.services.document_service import document_service
from app.services.compliance_service import compliance_service

class HealthScoreService:
    @staticmethod
    def calculate_institution_health_score(db: Session, institution_id: str) -> dict:
        """
        Dynamically calculates institution health score based on live database state:
        - Application Compliance (30% weight)
        - Document Validity (30% weight)
        - Undertaking / Compliance (25% weight)
        - Pending Actions resolution (15% weight)
        """
        # 1. Application Compliance
        apps = db.query(Application).filter(Application.institution_id == institution_id).all()
        if not apps:
            app_compliance_pct = 90.0
        else:
            # Positive statuses: Approved, Under Scrutiny, Document Verification, EVC Scheduled, Submitted
            # Negative / warning statuses: Correction Required, Rejected
            clean_count = sum(1 for a in apps if a.status not in ("Correction Required", "Rejected"))
            app_compliance_pct = round((clean_count / len(apps)) * 100, 1)

        # 2. Document Validity
        docs = db.query(Document).filter(Document.institution_id == institution_id).all()
        if not docs:
            doc_validity_pct = 75.0
        else:
            valid_count = 0
            for d in docs:
                status, _ = document_service.calculate_expiry_status(d.expiry_date)
                if status == "Valid" and d.verification_status != "Rejected":
                    valid_count += 1
                elif status == "Expiring Soon":
                    valid_count += 0.5 # Partial credit
            doc_validity_pct = round((valid_count / len(docs)) * 100, 1)

        # 3. Compliance Requirements
        compliance_reqs = db.query(ComplianceRequirement).filter(
            ComplianceRequirement.institution_id == institution_id
        ).all()
        if not compliance_reqs:
            compliance_pct = 85.0
        else:
            met_count = 0
            for req in compliance_reqs:
                eff_status, _ = compliance_service.get_effective_status(req)
                if eff_status in ("Verified", "Submitted"):
                    met_count += 1
            compliance_pct = round((met_count / len(compliance_reqs)) * 100, 1)

        # 4. Pending Actions & Critical issues
        # Check expired docs, correction required apps, overdue compliance
        expired_docs = sum(1 for d in docs if document_service.calculate_expiry_status(d.expiry_date)[0] == "Expired")
        correction_apps = sum(1 for a in apps if a.status == "Correction Required")
        overdue_reqs = sum(1 for r in compliance_reqs if compliance_service.get_effective_status(r)[0] == "Overdue")
        
        critical_issues_count = expired_docs + correction_apps + overdue_reqs
        pending_actions_score = max(30.0, round(100.0 - (critical_issues_count * 5.0), 1))

        # Overall composite calculation
        composite = (
            0.30 * app_compliance_pct +
            0.30 * doc_validity_pct +
            0.25 * compliance_pct +
            0.15 * pending_actions_score
        )
        final_score = int(round(composite))
        final_score = max(1, min(100, final_score))

        # Status text
        if final_score >= 85:
            status_text = "Excellent"
        elif final_score >= 70:
            status_text = "Good"
        elif final_score >= 50:
            status_text = "Needs Attention"
        else:
            status_text = "Critical"

        return {
            "score": final_score,
            "max_score": 100,
            "status": status_text,
            "breakdown": {
                "application_compliance": app_compliance_pct,
                "document_validity": doc_validity_pct,
                "undertaking_compliance": compliance_pct,
                "pending_actions": pending_actions_score
            },
            "disclaimer": "AICTE SmartAssist Institutional Health Indicator. Not an official AICTE score."
        }

health_score_service = HealthScoreService()
