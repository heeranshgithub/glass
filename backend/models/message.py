"""Message MongoDB model."""

from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Literal, Union
from pydantic import BaseModel, Field


class ModelResponse(BaseModel):
    """Individual model response in Stage 1."""
    model: str
    response: str


class ModelRanking(BaseModel):
    """Individual model ranking in Stage 2."""
    model: str
    ranking: str
    parsed_ranking: List[str] = []


class Stage3Result(BaseModel):
    """Arbiter's final synthesis in Stage 3."""
    model: str
    response: str
    aggregate_ranking: List[Dict[str, Any]] = []


class UserMessage(BaseModel):
    """User message in a conversation."""
    role: Literal["user"] = "user"
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AssistantMessage(BaseModel):
    """Assistant message with 3-stage council response."""
    role: Literal["assistant"] = "assistant"
    stage1: List[Dict[str, Any]] = []  # List of ModelResponse
    stage2: List[Dict[str, Any]] = []  # List of ModelRanking
    stage3: Dict[str, Any] = {}  # Stage3Result
    category: Optional[str] = None  # Category classification of the user prompt
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Union type for messages
Message = Union[UserMessage, AssistantMessage]


def create_user_message(content: str) -> dict:
    """
    Create a user message document.
    
    Args:
        content: Message content
        
    Returns:
        User message document
    """
    return {
        "role": "user",
        "content": content,
        "timestamp": datetime.now(timezone.utc),
    }


def create_assistant_message(
    stage1: List[Dict[str, Any]],
    stage2: List[Dict[str, Any]],
    stage3: Dict[str, Any],
    category: Optional[str] = None
) -> dict:
    """
    Create an assistant message document with all 3 stages.
    
    Args:
        stage1: List of individual model responses
        stage2: List of model rankings
        stage3: Final synthesized response
        category: Optional category classification of the user prompt
        
    Returns:
        Assistant message document
    """
    message = {
        "role": "assistant",
        "stage1": stage1,
        "stage2": stage2,
        "stage3": stage3,
        "timestamp": datetime.now(timezone.utc),
    }
    if category is not None:
        message["category"] = category
    return message


