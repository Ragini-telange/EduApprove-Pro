from sqlalchemy import Column, Integer, String, DateTime, Date, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.base import Base

class ComplianceRequirement(Base):
    __tablename__ = "compliance_requirements"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    institution_id = Column(String(50), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    requirement_name = Column(String(255), nullable=False)
    category = Column(String(100), default="Infrastructure")
    description = Column(Text, nullable=True)
    due_date = Column(Date, nullable=False)
    status = Column(String(50), default="Pending") # "Pending", "Submitted", "Verified", "Rejected", "Overdue"
    submitted_at = Column(DateTime, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    institution = relationship("Institution", back_populates="compliance_requirements")
