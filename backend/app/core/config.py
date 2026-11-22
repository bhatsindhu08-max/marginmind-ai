
import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "MarginMind AI"
    API_V1_STR: str = "/api/v1"

    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        "marginmind-enterprise-secret-key-super-secure-2026"
    )

    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./marginmind.db"
    )

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
    ]

    # External APIs
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    WORLD_BANK_API_URL: str = "https://api.worldbank.org/v2"
    RBI_DATA_URL: str = "https://rbi.org.in/scripts/BS_PressReleaseDisplay.aspx"
    DEMO_MODE_DEFAULT: bool = True

    # Document upload directory
    UPLOAD_DIR: str = os.getenv(
        "UPLOAD_DIR",
        "/tmp/marginmind/uploads"
    )

    # Reports directory
    REPORTS_DIR: str = os.getenv(
        "REPORTS_DIR",
        "/tmp/marginmind/reports"
    )

    class Config:
        case_sensitive = True


settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.REPORTS_DIR, exist_ok=True)

