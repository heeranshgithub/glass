"""Configuration for the Glass Backend."""

import os
import secrets
from typing import List
from dotenv import load_dotenv
from app.secrets_service import load_aws_secrets

load_dotenv()
load_aws_secrets()


def get_list_from_env(key: str, default: List[str]) -> List[str]:
    """Parse comma-separated list from environment variable."""
    value = os.getenv(key)
    if value:
        return [item.strip() for item in value.split(",")]
    return default


# Encryption Configuration for API Keys
# Used to encrypt/decrypt user OpenRouter API keys
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")
if not ENCRYPTION_KEY:
    print("WARNING: ENCRYPTION_KEY not set, using generated key. Set this in production!")
    raise ValueError("ENCRYPTION_KEY not set")

# MongoDB Configuration
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "llm_council")

# JWT Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not JWT_SECRET_KEY:
    # Generate a secure key if not provided (for development only)
    JWT_SECRET_KEY = secrets.token_urlsafe(32)
    print("WARNING: JWT_SECRET_KEY not set, using generated key. Set this in production!")

JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
JWT_REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# CORS Configuration
CORS_ORIGINS = get_list_from_env(
    "CORS_ORIGINS",
    ["http://localhost:5173", "http://localhost:3000"]
)

# API Configuration
API_V1_PREFIX = ""  # No versioning prefix for now 

# Application Settings
APP_NAME = "Glass Backend - LLM Council API"
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

# Email/SMTP Configuration
WAITLIST_EMAIL = os.getenv("WAITLIST_EMAIL", "")
WAITLIST_PASS = os.getenv("WAITLIST_PASS", "")
SMTP_HOST = os.getenv("SMTP_HOST", "smtpout.secureserver.net")
SMTP_PORT = int(os.getenv("SMTP_PORT", "465"))

# SMTP transport security mode:
# - ssl: implicit TLS (typical for port 465)
# - starttls: STARTTLS upgrade (typical for port 587)
# - none: plaintext (not recommended; mainly for local debugging)
_smtp_security_env = os.getenv("SMTP_SECURITY")
if _smtp_security_env:
    SMTP_SECURITY = _smtp_security_env.strip().lower()
else:
    SMTP_SECURITY = "ssl" if SMTP_PORT == 465 else "starttls"

# Platform-wide OpenRouter key, used for the shared demo account.
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")

# Demo and Admin Configuration
DEMO_EMAIL = os.getenv("DEMO_EMAIL", "")
DEMO_PASS = os.getenv("DEMO_PASS", "")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "")


