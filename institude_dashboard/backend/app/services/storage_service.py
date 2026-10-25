import os
import shutil
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings

class StorageService:
    def __init__(self):
        self.upload_dir = settings.UPLOAD_DIR
        self.supabase_url = settings.SUPABASE_URL
        self.supabase_key = settings.SUPABASE_SERVICE_ROLE_KEY
        self.bucket = settings.SUPABASE_STORAGE_BUCKET
        self.is_supabase_configured = bool(self.supabase_url and self.supabase_key)
        
    def validate_file(self, file: UploadFile) -> None:
        """Validate uploaded file type and extension"""
        # Validate file extension
        ext = Path(file.filename or "").suffix.lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file extension '{ext}'. Allowed extensions: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )
            
        # Validate content type if provided
        if file.content_type and file.content_type not in settings.ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid content type '{file.content_type}'. Allowed types: PDF, JPG, JPEG, PNG"
            )

    async def save_file(self, file: UploadFile, institution_id: str) -> dict:
        """
        Saves file to Supabase Storage if configured, or securely stores locally.
        Returns dict with file_path, file_url, and file_size_kb.
        """
        self.validate_file(file)
        
        contents = await file.read()
        file_size_kb = len(contents) // 1024
        max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
        
        if len(contents) > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB"
            )

        # Generate unique storage filename
        original_ext = Path(file.filename or "doc.pdf").suffix.lower()
        unique_name = f"{uuid.uuid4().hex[:12]}_{Path(file.filename).name}"
        clean_filename = "".join(c for c in unique_name if c.isalnum() or c in "._- ")

        if self.is_supabase_configured:
            try:
                # Attempt upload to Supabase Storage via REST or SDK
                import httpx
                supabase_storage_url = f"{self.supabase_url.rstrip('/')}/storage/v1/object/{self.bucket}/{institution_id}/{clean_filename}"
                headers = {
                    "Authorization": f"Bearer {self.supabase_key}",
                    "apikey": self.supabase_key,
                    "Content-Type": file.content_type or "application/octet-stream"
                }
                async with httpx.AsyncClient() as client:
                    resp = await client.post(supabase_storage_url, content=contents, headers=headers)
                    if resp.status_code in (200, 201):
                        public_url = f"{self.supabase_url.rstrip('/')}/storage/v1/object/public/{self.bucket}/{institution_id}/{clean_filename}"
                        return {
                            "file_path": f"{institution_id}/{clean_filename}",
                            "file_url": public_url,
                            "file_size_kb": file_size_kb,
                            "mime_type": file.content_type or "application/pdf"
                        }
            except Exception as e:
                # If Supabase storage fails or isn't reachable, smoothly fallback to local storage
                print(f"Supabase upload notice: {e}. Falling back to local storage.")

        # Local secure storage
        inst_dir = self.upload_dir / institution_id
        inst_dir.mkdir(parents=True, exist_ok=True)
        local_path = inst_dir / clean_filename
        
        with open(local_path, "wb") as f:
            f.write(contents)
            
        file_url = f"/api/institution/documents/download/{institution_id}/{clean_filename}"
        
        return {
            "file_path": str(local_path),
            "file_url": file_url,
            "file_size_kb": file_size_kb,
            "mime_type": file.content_type or "application/pdf"
        }

storage_service = StorageService()
