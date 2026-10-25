from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.base import Base

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    application_number = Column(String(50), unique=True, index=True, nullable=False) # e.g. "APP-2026-1024"
    institution_id = Column(String(50), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    application_type = Column(String(100), nullable=False) # "New Institution", "Course Extension", "Increase in Intake"
    academic_year = Column(String(20), default="2026-2027")
    status = Column(String(50), nullable=False, default="Draft") # "Draft", "Submitted", "Under Scrutiny", "Correction Required", "EVC", "Completed", "Rejected"
    current_stage = Column(String(100), default="Draft Preparation") # "Scrutiny", "Document Verification", "EVC", "Regional Committee Review", etc.
    submitted_at = Column(DateTime, nullable=True)
    last_updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    correction_deadline = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    institution = relationship("Institution", back_populates="applications")
    evc_visit = relationship("EVCVisit", back_populates="application", uselist=False)
