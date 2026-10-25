from sqlalchemy import Column, Integer, String, DateTime, Date, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.base import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    institution_id = Column(String(50), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type = Column(String(100), nullable=False) # "Lease Agreement", "Building Completion Certificate", etc.
    document_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_url = Column(String(500), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    expiry_date = Column(Date, nullable=True) # nullable for permanent certificates
    verification_status = Column(String(50), default="Verification Pending") # "Verified", "Verification Pending", "Rejected", "Expired"
    verified_by = Column(String(100), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    file_size_kb = Column(Integer, default=0)
    mime_type = Column(String(100), default="application/pdf")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    institution = relationship("Institution", back_populates="documents")
