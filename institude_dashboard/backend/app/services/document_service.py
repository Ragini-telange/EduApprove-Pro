from datetime import date, datetime
from typing import Optional, Tuple
from app.models.document import Document

class DocumentService:
    @staticmethod
    def calculate_expiry_status(expiry_date: Optional[date]) -> Tuple[str, Optional[int]]:
        """
        Determines the document expiry status based on AICTE rules:
        - Permanent: No expiry date (e.g. Building Completion Certificate if permanent)
        - Expired: Expiry date is before today
        - Critical: 7 days or less remaining
        - Expiring Soon: 30 days or less remaining
        - Valid: More than 30 days remaining
        Returns: (status_string, days_remaining)
        """
        if not expiry_date:
            return "Valid", None
            
        today = date.today()
        delta_days = (expiry_date - today).days
        
        if delta_days < 0:
            return "Expired", delta_days
        elif delta_days <= 7:
            return "Critical", delta_days
        elif delta_days <= 30:
            return "Expiring Soon", delta_days
        else:
            return "Valid", delta_days

    @classmethod
    def enrich_document_data(cls, doc: Document) -> dict:
        """Enriches document model instance with dynamic expiry computations"""
        expiry_status, days_remaining = cls.calculate_expiry_status(doc.expiry_date)
        
        return {
            "id": doc.id,
            "institution_id": doc.institution_id,
            "document_type": doc.document_type,
            "document_name": doc.document_name,
            "file_path": doc.file_path,
            "file_url": doc.file_url or f"/api/institution/documents/download/{doc.id}",
            "uploaded_at": doc.uploaded_at,
            "expiry_date": doc.expiry_date,
            "verification_status": doc.verification_status,
            "verified_by": doc.verified_by,
            "verified_at": doc.verified_at,
            "rejection_reason": doc.rejection_reason,
            "file_size_kb": doc.file_size_kb,
            "mime_type": doc.mime_type,
            "created_at": doc.created_at,
            "updated_at": doc.updated_at,
            "expiry_status": expiry_status,
            "days_remaining": days_remaining
        }

document_service = DocumentService()
