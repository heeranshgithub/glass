"""User MongoDB model."""

from datetime import datetime, timezone
from typing import List, Optional, Any
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


class UserBase(BaseModel):
    """Base user model."""
    email: EmailStr
    full_name: str
    username: Optional[str] = None


class UserCreate(UserBase):
    """Model for creating a new user."""
    password: str


class User(UserBase):
    """User model for responses (without sensitive data)."""
    id: str = Field(alias="_id")
    created_at: datetime
    updated_at: datetime
    is_active: bool = True
    is_verified: bool = False
    last_login: Optional[datetime] = None
    roles: List[str] = ["user"]
    
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
                "full_name": "John Doe",
                "username": "johndoe",
                "created_at": "2025-01-01T00:00:00Z",
                "updated_at": "2025-01-01T00:00:00Z",
                "is_active": True,
                "roles": ["user"]
            }
        }
    }


class UserInDB(UserBase):
    """User model as stored in MongoDB (includes password hash and encrypted API key)."""
    id: str = Field(alias="_id")
    password_hash: str
    created_at: datetime
    updated_at: datetime
    is_active: bool = True
    is_verified: bool = False
    last_login: Optional[datetime] = None
    roles: List[str] = ["user"]
    openrouter_api_key_encrypted: Optional[str] = None
    daily_request_count: int = 0
    daily_request_limit: Optional[int] = None
    last_request_date: Optional[datetime] = None
    
    @field_validator("id", mode="before")
    @classmethod
    def convert_objectid(cls, v: Any) -> str:
        if isinstance(v, ObjectId):
            return str(v)
        return v
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }


def create_user_document(
    email: str,
    password_hash: str,
    full_name: str,
    username: Optional[str] = None
) -> dict:
    """
    Create a user document for MongoDB insertion.
    
    Args:
        email: User email
        password_hash: Hashed password
        full_name: User's full name
        username: Optional username
        
    Returns:
        Document ready for MongoDB insertion
    """
    now = datetime.now(timezone.utc)
    return {
        "email": email,
        "password_hash": password_hash,
        "full_name": full_name,
        "username": username,
        "created_at": now,
        "updated_at": now,
        "is_active": True,
        "is_verified": False,
        "last_login": None,
        "roles": ["user"],
        "openrouter_api_key_encrypted": None,
        "daily_request_count": 0,
        "daily_request_limit": None,
        "last_request_date": None,
    }


