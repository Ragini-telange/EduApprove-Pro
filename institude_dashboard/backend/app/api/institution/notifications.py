from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database.session import get_db
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse, NotificationCountResponse
from app.api.institution.dashboard import get_current_institution_id

router = APIRouter(prefix="/institution/notifications", tags=["Notifications"])

def format_time_ago(created_at: datetime) -> str:
    diff = datetime.utcnow() - created_at
    seconds = diff.total_seconds()
    if seconds < 60:
        return "Just now"
    elif seconds < 3600:
        return f"{int(seconds // 60)}m ago"
    elif seconds < 86400:
        return f"{int(seconds // 3600)}h ago"
    else:
        return f"{int(seconds // 86400)}d ago"

@router.get("", response_model=List[NotificationResponse])
def get_notifications(
    unread_only: bool = Query(False),
    limit: int = Query(20),
    institution_id: str = Depends(get_current_institution_id),
    db: Session = Depends(get_db)
):
    """Retrieve institutional notifications"""
    query = db.query(Notification).filter(Notification.institution_id == institution_id)
    if unread_only:
        query = query.filter(Notification.is_read == False)
        
    notifs = query.order_by(Notification.created_at.desc()).limit(limit).all()
    
    result = []
    for n in notifs:
        n_dict = {
            "id": n.id,
            "institution_id": n.institution_id,
            "title": n.title,
            "message": n.message,
            "notification_type": n.notification_type,
            "severity": n.severity,
            "is_read": n.is_read,
            "related_entity_type": n.related_entity_type,
            "related_entity_id": n.related_entity_id,
            "created_at": n.created_at,
            "time_ago": format_time_ago(n.created_at)
        }
        result.append(n_dict)
    return result

@router.patch("/{id}/read", response_model=NotificationResponse)
def mark_notification_read(
    id: int,
    institution_id: str = Depends(get_current_institution_id),
    db: Session = Depends(get_db)
):
    """Mark a notification as read"""
    notif = db.query(Notification).filter(
        Notification.id == id,
        Notification.institution_id == institution_id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    
    return {
        "id": notif.id,
        "institution_id": notif.institution_id,
        "title": notif.title,
        "message": notif.message,
        "notification_type": notif.notification_type,
        "severity": notif.severity,
        "is_read": notif.is_read,
        "related_entity_type": notif.related_entity_type,
        "related_entity_id": notif.related_entity_id,
        "created_at": notif.created_at,
        "time_ago": format_time_ago(notif.created_at)
    }

@router.post("/mark-all-read")
def mark_all_notifications_read(
    institution_id: str = Depends(get_current_institution_id),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read for the institution"""
    db.query(Notification).filter(
        Notification.institution_id == institution_id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}
