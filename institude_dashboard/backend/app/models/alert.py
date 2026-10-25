from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.base import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    institution_id = Column(String(50), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(50), nullable=False) # "Critical", "High Priority", "Upcoming"
    category = Column(String(100), default="General") # "Document", "Application", "Compliance", "EVC"
    action_url = Column(String(255), nullable=True)
    action_label = Column(String(100), nullable=True)
    is_dismissed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    institution = relationship("Institution", back_populates="alerts")
