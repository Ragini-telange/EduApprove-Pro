from sqlalchemy import Column, Integer, String, DateTime, Date, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.base import Base

class EVCVisit(Base):
    __tablename__ = "evc_visits"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    institution_id = Column(String(50), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="SET NULL"), nullable=True)
    visit_date = Column(Date, nullable=False) # e.g. 2026-11-20
    visit_time = Column(String(50), default="10:30 AM")
    visit_type = Column(String(100), default="Committee Visit")
    status = Column(String(50), default="Scheduled") # "Scheduled", "In Progress", "Completed", "Rescheduled"
    committee_members_count = Column(Integer, default=3)
    preparation_status_pct = Column(Integer, default=75) # e.g. 75% Complete
    venue_or_mode = Column(String(100), default="On-site Inspection")
    contact_person = Column(String(100), default="Principal / AICTE Coordinator")
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    institution = relationship("Institution", back_populates="evc_visits")
    application = relationship("Application", back_populates="evc_visit")
