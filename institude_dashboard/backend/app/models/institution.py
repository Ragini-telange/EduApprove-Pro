from sqlalchemy import Column, String, DateTime, Text, Integer, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.base import Base

class Institution(Base):
    __tablename__ = "institutions"

    id = Column(String(50), primary_key=True, index=True) # e.g. "AICTE-INS-10245"
    name = Column(String(255), nullable=False) # e.g. "Government College of Engineering"
    code = Column(String(50), nullable=True) # e.g. "GCE-PUN-01"
    category = Column(String(100), default="Engineering & Technology")
    institution_type = Column(String(50), default="Government")
    email = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    state = Column(String(100), default="Maharashtra")
    district = Column(String(100), default="Pune")
    pincode = Column(String(10), default="411005")
    establishment_year = Column(Integer, default=1954)
    approval_status = Column(String(50), default="Approved")
    current_academic_year = Column(String(20), default="2026-2027")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    applications = relationship("Application", back_populates="institution", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="institution", cascade="all, delete-orphan")
    compliance_requirements = relationship("ComplianceRequirement", back_populates="institution", cascade="all, delete-orphan")
    evc_visits = relationship("EVCVisit", back_populates="institution", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="institution", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="institution", cascade="all, delete-orphan")
