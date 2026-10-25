from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.base import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    institution_id = Column(String(50), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(100), default="Application") # "Correction Required", "Document Expiring", "Application Updated", "EVC Scheduled", "Compliance"
    severity = Column(String(50), default="info") # "info", "warning", "critical", "success"
    is_read = Column(Boolean, default=False)
    related_entity_type = Column(String(50), nullable=True) # "application", "document", "compliance", "evc"
    related_entity_id = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    institution = relationship("Institution", back_populates="notifications")
