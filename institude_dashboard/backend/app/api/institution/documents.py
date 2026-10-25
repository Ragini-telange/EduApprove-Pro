from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from fastapi.responses import FileResponse, PlainTextResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from pathlib import Path
from app.database.session import get_db
from app.models.document import Document
from app.schemas.document import DocumentResponse, DocumentPassportItem
from app.services.document_service import document_service
from app.services.storage_service import storage_service
from app.api.institution.dashboard import get_current_institution_id

router = APIRouter(prefix="/institution/documents", tags=["Documents"])

@router.get("", response_model=List[DocumentResponse])
def get_documents(
    document_type: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    institution_id: str = Depends(get_current_institution_id),
    db: Session = Depends(get_db)
):
    """
    Get all institutional documents enriched with backend calculated expiry statuses:
    Valid, Expiring Soon, Critical, Expired.
    """
    query = db.query(Document).filter(Document.institution_id == institution_id)

    if document_type:
        query = query.filter(Document.document_type.ilike(f"%{document_type}%"))

    if status_filter and status_filter.lower() != "all":
        query = query.filter(Document.verification_status.ilike(f"%{status_filter}%"))

    docs = query.order_by(Document.expiry_date.asc().nullslast()).all()
    
    # Enrich with dynamic expiry business logic
    enriched = [document_service.enrich_document_data(d) for d in docs]
    return enriched

@router.get("/passport", response_model=List[DocumentPassportItem])
def get_document_passport(
    institution_id: str = Depends(get_current_institution_id),
    db: Session = Depends(get_db)
):
    """Smart Document Passport for institutional credentials"""
    docs = db.query(Document).filter(Document.institution_id == institution_id).all()
    passport_items = []
    for d in docs:
        status, days = document_service.calculate_expiry_status(d.expiry_date)
        passport_items.append({
            "id": d.id,
            "document_type": d.document_type,
            "document_name": d.document_name,
            "verification_status": d.verification_status,
            "expiry_date": d.expiry_date,
            "expiry_status": status,
            "days_remaining": days,
            "file_url": d.file_url or f"/api/institution/documents/download/{d.id}"
        })
    return passport_items

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    document_type: str = Form(...),
    expiry_date: Optional[str] = Form(None),
    file: UploadFile = File(...),
    institution_id: str = Depends(get_current_institution_id),
    db: Session = Depends(get_db)
):
    """
    Secure document upload:
    Validates file extension (.pdf, .jpg, .png) and file size (<15MB).
    Stores file securely and updates database.
    """
    # Parse expiry date if provided
    parsed_expiry = None
    if expiry_date and expiry_date.strip():
        try:
            parsed_expiry = datetime.strptime(expiry_date.strip(), "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid expiry date format. Expected YYYY-MM-DD")

    # Securely save file (Supabase Storage or local storage fallback)
    stored_info = await storage_service.save_file(file, institution_id)

    # Check if an existing document of this type exists; if so, update it
    existing_doc = db.query(Document).filter(
        Document.institution_id == institution_id,
        Document.document_type == document_type
    ).first()

    if existing_doc:
        existing_doc.document_name = file.filename or "document.pdf"
        existing_doc.file_path = stored_info["file_path"]
        existing_doc.file_url = stored_info["file_url"]
        existing_doc.expiry_date = parsed_expiry
        existing_doc.verification_status = "Verification Pending"
        existing_doc.file_size_kb = stored_info["file_size_kb"]
        existing_doc.mime_type = stored_info["mime_type"]
        existing_doc.uploaded_at = datetime.utcnow()
        db.commit()
        db.refresh(existing_doc)
        return document_service.enrich_document_data(existing_doc)

    new_doc = Document(
        institution_id=institution_id,
        document_type=document_type,
        document_name=file.filename or "document.pdf",
        file_path=stored_info["file_path"],
        file_url=stored_info["file_url"],
        uploaded_at=datetime.utcnow(),
        expiry_date=parsed_expiry,
        verification_status="Verification Pending",
        file_size_kb=stored_info["file_size_kb"],
        mime_type=stored_info["mime_type"]
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    return document_service.enrich_document_data(new_doc)

@router.get("/download/{doc_id}")
def download_document(
    doc_id: int,
    institution_id: str = Depends(get_current_institution_id),
    db: Session = Depends(get_db)
):
    """Download/view document file"""
    doc = db.query(Document).filter(
        Document.id == doc_id,
        Document.institution_id == institution_id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document record not found")

    file_path = Path(doc.file_path)
    if file_path.exists() and file_path.is_file():
        return FileResponse(
            path=str(file_path),
            filename=doc.document_name,
            media_type=doc.mime_type
        )
    
    # Friendly response for simulated demo documents
    return PlainTextResponse(
        content=f"AICTE SmartAssist Document Repository\n\nInstitution: {institution_id}\nDocument Type: {doc.document_type}\nFile Name: {doc.document_name}\nStatus: {doc.verification_status}\nExpiry: {doc.expiry_date}",
        headers={"Content-Disposition": f'attachment; filename="{doc.document_name}.txt"'}
    )
