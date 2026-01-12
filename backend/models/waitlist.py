"""Waitlist MongoDB model."""

from datetime import datetime, timezone
from typing import Optional, Any, Literal
from pydantic import BaseModel, Field, EmailStr, field_validator
from bson import ObjectId


class PyObjectId(str):
    """Custom type for MongoDB ObjectId."""
    
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    
    @classmethod
    def validate(cls, v: Any, info: Any = None) -> str:
        if isinstance(v, ObjectId):
            return str(v)
        if isinstance(v, str):
            if ObjectId.is_valid(v):
                return v
        raise ValueError("Invalid ObjectId")


class WaitlistEntry(BaseModel):
    """Waitlist entry model for responses."""
    id: str = Field(alias="_id")
    email: EmailStr
    joined_at: datetime
    status: Literal["pending", "invited", "cancelled"] = "pending"
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    @field_validator("id", mode="before")
    @classmethod
    def convert_objectid(cls, v: Any) -> str:
        if isinstance(v, ObjectId):
            return str(v)
        return v
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_schema_extra": {
            "example": {
                "_id": "507f1f77bcf86cd799439011",
                "email": "user@example.com",
                "joined_at": "2026-01-12T00:00:00Z",
                "status": "pending",
                "ip_address": "1.2.3.4",
                "user_agent": "Mozilla/5.0...",
                "created_at": "2026-01-12T00:00:00Z",
                "updated_at": "2026-01-12T00:00:00Z",
            }
        }
    }


def create_waitlist_document(
    email: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> dict:
    """
    Create a waitlist document for MongoDB insertion.
    
    Args:
        email: User email
        ip_address: Optional IP address
        user_agent: Optional user agent string
        
    Returns:
        Document ready for MongoDB insertion
    """
    now = datetime.now(timezone.utc)
    return {
        "email": email,
        "joined_at": now,
        "status": "pending",
        "ip_address": ip_address,
        "user_agent": user_agent,
        "created_at": now,
        "updated_at": now,
    }
