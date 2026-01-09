"""Conversation MongoDB model."""

from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, field_validator
from bson import ObjectId


class ConversationBase(BaseModel):
    """Base conversation model."""
    title: str = "New Conversation"
    category: Optional[str] = None  # Category of the conversation (from first user message)
    score: Optional[float] = None  # Overall score for the conversation


class Conversation(ConversationBase):
    """Conversation model for responses."""
    id: str = Field(alias="_id")
    user_id: str
    created_at: datetime
    updated_at: datetime
    messages: List[Dict[str, Any]] = []
    
    @field_validator("id", "user_id", mode="before")
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
                "user_id": "507f1f77bcf86cd799439012",
                "title": "Discussion about AI",
                "created_at": "2025-01-01T00:00:00Z",
                "updated_at": "2025-01-01T00:00:00Z",
                "messages": []
            }
        }
    }


class ConversationInDB(ConversationBase):
    """Conversation model as stored in MongoDB."""
    id: str = Field(alias="_id")
    user_id: str
    created_at: datetime
    updated_at: datetime
    messages: List[Dict[str, Any]] = []
    
    @field_validator("id", "user_id", mode="before")
    @classmethod
    def convert_objectid(cls, v: Any) -> str:
        if isinstance(v, ObjectId):
            return str(v)
        return v
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }


class ConversationMetadata(BaseModel):
    """Conversation metadata for list view."""
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int
    category: Optional[str] = None
    score: Optional[float] = None
    
    @field_validator("id", mode="before")
    @classmethod
    def convert_objectid(cls, v: Any) -> str:
        if isinstance(v, ObjectId):
            return str(v)
        return v


def create_conversation_document(user_id: str, title: str = "New Conversation") -> dict:
    """
    Create a conversation document for MongoDB insertion.
    
    Args:
        user_id: Owner's user ID
        title: Conversation title
        
    Returns:
        Document ready for MongoDB insertion
    """
    now = datetime.now(timezone.utc)
    return {
        "user_id": ObjectId(user_id),
        "title": title,
        "created_at": now,
        "updated_at": now,
        "messages": [],
        "category": None,
        "score": None,
    }


