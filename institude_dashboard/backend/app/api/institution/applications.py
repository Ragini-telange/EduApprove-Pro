from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import random
from app.database.session import get_db
from app.models.application import Application
from app.schemas.application import ApplicationResponse, ApplicationRecentItem, ApplicationCreate
from app.api.institution.dashboard import get_current_institution_id

router = APIRouter(prefix="/institution/applications", tags=["Applications"])

@router.get("", response_model=List[ApplicationResponse])
def get_applications(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    institution_id: str = Depends(get_current_institution_id),
    db: Session = Depends(get_db)
):
    """Retrieve all applications for the institution with optional status/search filters"""
    query = db.query(Application).filter(Application.institution_id == institution_id)

    if status_filter and status_filter.lower() != "all":
        query = query.filter(Application.status.ilike(f"%{status_filter}%"))

    if search:
        query = query.filter(
            (Application.application_number.ilike(f"%{search}%")) |
            (Application.application_type.ilike(f"%{search}%")) |
            (Application.remarks.ilike(f"%{search}%"))
        )

    apps = query.order_by(Application.created_at.desc()).all()
    return apps

@router.get("/recent", response_model=List[ApplicationRecentItem])
def get_recent_applications(
    limit: int = 5,
    institution_id: str = Depends(get_current_institution_id),
    db: Session = Depends(get_db)
):
    """Recent applications table view on the dashboard"""
    apps = db.query(Application).filter(
        Application.institution_id == institution_id
    ).order_by(Application.submitted_at.desc().nullslast()).limit(limit).all()

    items = []
    for a in apps:
        items.append(ApplicationRecentItem(
            id=a.id,
            application_number=a.application_number,
            application_type=a.application_type,
            submitted_date=a.submitted_at.strftime("%d %b %Y") if a.submitted_at else "Draft",
            current_stage=a.current_stage,
            status=a.status
        ))
    return items

@router.get("/{id}", response_model=ApplicationResponse)
def get_application_by_id(
    id: int,
    institution_id: str = Depends(get_current_institution_id),
    db: Session = Depends(get_db)
):
    """Retrieve specific application detail"""
    app = db.query(Application).filter(
        Application.id == id,
        Application.institution_id == institution_id
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app

@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(
    payload: ApplicationCreate,
    institution_id: str = Depends(get_current_institution_id),
    db: Session = Depends(get_db)
):
    """Create a new institution application (e.g. Course Extension, New Program)"""
    # Generate unique application number
    app_num = f"APP-2026-{random.randint(1030, 9999)}"
    
    new_app = Application(
        institution_id=institution_id,
        application_number=app_num,
        application_type=payload.application_type,
        academic_year=payload.academic_year or "2026-2027",
        status="Draft",
        current_stage="Draft Preparation",
        submitted_at=None,
        remarks=payload.remarks or "Application initiated by institution admin."
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    return new_app
