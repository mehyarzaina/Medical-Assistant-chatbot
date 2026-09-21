"""
Central configuration. Everything is pulled from environment variables so no
secrets ever live in source control. Copy `.env.example` to `.env` and fill
in the real values before running.
"""

import os
from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # --- MongoDB Atlas — same cluster/db as Dr_RAG's migrate_pg_to_mongo.py
    # writes to. Point this at your Atlas connection string, not localhost;
    # new collections (appointments, patients) are created automatically the
    # first time this app writes to them — nothing to set up in the Atlas UI. ---
    mongo_uri: str = os.getenv("MONGO_URI")
    mongo_db_name: str = os.getenv("MONGO_DB_NAME", "altibbi_dr")

    # --- Redis (caches Gemini specialty-matching results only) ---
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    groq_model: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")

    # --- Google Calendar (personal Gmail calendar used as the single
    # source-of-truth *display* calendar; availability truth stays in Mongo) ---
    google_credentials_path: str = os.getenv(
        "GOOGLE_CREDENTIALS_PATH", "credentials.json"
    )
    google_token_path: str = os.getenv("GOOGLE_TOKEN_PATH", "token.json")
    google_calendar_id: str = os.getenv("GOOGLE_CALENDAR_ID", "primary")

    # --- How long each bookable slot is. This is the ONLY thing that controls
    # slot granularity — see app/routers/appointments.py::_generate_slots. ---
    appointment_duration_minutes: int = int(
        os.getenv("APPOINTMENT_DURATION_MINUTES", "30")
    )

        # --- Zilliz / embedding (RAG doctor search) ---
    zilliz_uri: str = os.getenv("ZILLIZ_URI", "")
    zilliz_token: str = os.getenv("ZILLIZ_TOKEN", "")
    dr_collection_name: str = os.getenv("DR_COLLECTION_NAME", "altibbi_doctors")
    embedding_url: str = os.getenv("EMBEDDING_URL", "")
    embedding_api_key: str = os.getenv("EMBEDDING_API_KEY", "")

        # --- Email (personal Gmail SMTP for now — swap for a transactional
    # service like Resend/SES later if volume grows) ---
    gmail_address: str = os.getenv("GMAIL_ADDRESS", "")
    gmail_app_password: str = os.getenv("GMAIL_APP_PASSWORD", "")
    frontend_base_url: str = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173")

    dr_collection_name: str = os.getenv("DR_COLLECTION_NAME", "altibbi_doctors")
    articles_collection_name: str = os.getenv("ARTICLES_COLLECTION_NAME", "altibbi_articles")

    admin_password: str = os.getenv("ADMIN_PASSWORD", "")

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
