from pydantic_settings import BaseSettings
from typing import Optional
import os
from pathlib import Path

class Settings(BaseSettings):
    PROJECT_NAME: str = "AICTE SmartAssist - Institution Admin Portal"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = "development"
    
    # Institution Default Context
    DEFAULT_INSTITUTION_ID: str = "AICTE-INS-10245"
    DEFAULT_INSTITUTION_NAME: str = "Government College of Engineering"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./aicte_smartassist.db")
    
    # File storage
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    MAX_FILE_SIZE_MB: int = 15
    ALLOWED_EXTENSIONS: set = {".pdf", ".jpg", ".jpeg", ".png"}
    ALLOWED_MIME_TYPES: set = {
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg"
    }
    
    # Supabase (Optional)
    SUPABASE_URL: Optional[str] = os.getenv("SUPABASE_URL", None)
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = os.getenv("SUPABASE_SERVICE_ROLE_KEY", None)
    SUPABASE_STORAGE_BUCKET: str = os.getenv("SUPABASE_STORAGE_BUCKET", "aicte-documents")
    
    # AI Assistant (Optional)
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", None)

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "allow"

settings = Settings()

# Ensure uploads directory exists
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
