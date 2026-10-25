from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.database.base import Base
from app.database.session import engine, SessionLocal
from app.database.seed import seed_database
from app.api.institution import api_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("aicte-smartassist")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database and Seed if empty
    logger.info("Initializing AICTE SmartAssist database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    
    logger.info("Database initialized successfully.")
    yield
    # Shutdown logic
    logger.info("Shutting down AICTE SmartAssist backend.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Institution Admin Portal API for AICTE SmartAssist Workflow Automation",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for uploaded documents
app.mount("/static/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")

# Include Institution API routes
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "service": "AICTE SmartAssist - Institution Admin Portal",
        "version": "1.0.0",
        "status": "online",
        "institution_id": settings.DEFAULT_INSTITUTION_ID,
        "institution_name": settings.DEFAULT_INSTITUTION_NAME,
        "docs_url": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "connected"}

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global error handler caught: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected server error occurred. Please contact AICTE SmartAssist support."}
    )
