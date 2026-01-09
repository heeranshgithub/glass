"""Conversation request/response schemas."""

from typing import List, Dict, Any, Optional
from pydantic import Field
from datetime import datetime

from schemas.base import CamelSchema, camel_config


class CreateConversationRequest(CamelSchema):
    """Request to create a new conversation."""
    title: Optional[str] = None
    
    model_config = camel_config(
        json_schema_extra={
            "example": {
                "title": "New Discussion"
            }
        }
    )


class SendMessageRequest(CamelSchema):
    """Request to send a message in a conversation."""
    content: str = Field(..., min_length=1)
    
    model_config = camel_config(
        json_schema_extra={
            "example": {
                "content": "What is the best programming language?"
            }
        }
    )


class ModelResponseSchema(CamelSchema):
    """Individual model response."""
    model: str
    response: str


class ModelRankingSchema(CamelSchema):
    """Individual model ranking."""
    model: str
    ranking: str
    parsed_ranking: List[str] = []

    model_config = camel_config(
        json_schema_extra={
            "example": {
                "model": "openai/gpt-4o",
                "ranking": "Response A > Response B",
                # Ordered model names (best -> worst)
                "parsedRanking": ["openai/gpt-5.1", "google/gemini-3-pro-preview", "anthropic/claude-sonnet-4.5", "x-ai/grok-4"]
            }
        }
    )


class Stage3ResultSchema(CamelSchema):
    """Arbiter's final synthesis."""
    model: str
    response: str
    aggregate_ranking: List["AggregateRankingSchema"] = []


class AggregateRankingSchema(CamelSchema):
    """Aggregate ranking result."""
    model: str
    average_rank: float
    rankings_count: int
    # Higher is better. Normalized within the conversation (0-100).
    score: Optional[float] = None

    model_config = camel_config(
        json_schema_extra={
            "example": {
                "model": "openai/gpt-4o",
                "averageRank": 1.5,
                "rankingsCount": 4,
                "score": 83.3,
            }
        }
    )


class CouncilMetadataSchema(CamelSchema):
    """Metadata from council process."""
    label_to_model: Dict[str, str] = {}
    aggregate_ranking: List[AggregateRankingSchema] = []

    model_config = camel_config(
        json_schema_extra={
            "example": {
                "labelToModel": {"Response A": "openai/gpt-4o"},
                "aggregateRanking": [{"model": "openai/gpt-4o", "averageRank": 1.5, "rankingsCount": 4}]
            }
        }
    )


class CouncilResponse(CamelSchema):
    """Response from the council process."""
    stage1: List[ModelResponseSchema]
    stage2: List[ModelRankingSchema]
    stage3: Stage3ResultSchema
    metadata: CouncilMetadataSchema = Field(default_factory=CouncilMetadataSchema)
    
    model_config = camel_config(
        json_schema_extra={
            "example": {
                "stage1": [
                    {"model": "openai/gpt-5.1", "response": "Python is..."},
                    {"model": "google/gemini-3-pro-preview", "response": "Python is..."},
                    {"model": "anthropic/claude-sonnet-4.5", "response": "Python is..."},
                    {"model": "x-ai/grok-4", "response": "Python is..."}
                ],
                "stage2": [
                    {"model": "openai/gpt-5.1", "ranking": "...", "parsedRanking": ["openai/gpt-5.1"]},
                    {"model": "google/gemini-3-pro-preview", "ranking": "...", "parsedRanking": ["google/gemini-3-pro-preview"]},
                    {"model": "anthropic/claude-sonnet-4.5", "ranking": "...", "parsedRanking": ["anthropic/claude-sonnet-4.5"]},
                    {"model": "x-ai/grok-4", "ranking": "...", "parsedRanking": ["x-ai/grok-4"]}
                ],
                "stage3": {
                    "model": "google/gemini-pro",
                    "response": "The council agrees...",
                    "aggregateRanking": [{"model": "openai/gpt-5.1", "averageRank": 1.5, "rankingsCount": 4}]
                },
                "metadata": {
                    "labelToModel": {"Response A": "openai/gpt-5.1"},
                    "aggregateRanking": [{"model": "openai/gpt-5.1", "averageRank": 1.5, "rankingsCount": 4}]
                }
            }
        }
    )


class MessageSchema(CamelSchema):
    """Message in a conversation."""
    role: str  # "user" or "assistant"
    content: Optional[str] = None  # For user messages
    stage1: Optional[List[ModelResponseSchema]] = None  # For assistant messages
    stage2: Optional[List[ModelRankingSchema]] = None  # For assistant messages
    stage3: Optional[Stage3ResultSchema] = None  # For assistant messages
    timestamp: Optional[datetime] = None


class ConversationResponse(CamelSchema):
    """Full conversation response."""
    id: str
    user_id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageSchema] = []
    category: Optional[str] = None
    score: Optional[float] = None
    
    model_config = camel_config(
        json_schema_extra={
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "userId": "507f1f77bcf86cd799439012",
                "title": "AI Discussion",
                "createdAt": "2025-01-01T00:00:00Z",
                "updatedAt": "2025-01-01T00:00:00Z",
                "messages": [],
                "category": "Philosophy & Growth",
                "score": 85.5
            }
        }
    )


class ConversationMetadataResponse(CamelSchema):
    """Conversation metadata for list view."""
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int
    category: Optional[str] = None
    score: Optional[float] = None
    
    model_config = camel_config(
        json_schema_extra={
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "title": "AI Discussion",
                "createdAt": "2025-01-01T00:00:00Z",
                "updatedAt": "2025-01-01T00:00:00Z",
                "messageCount": 5,
                "category": "Philosophy & Growth",
                "score": 85.5
            }
        }
    )


class ConversationListResponse(CamelSchema):
    """List of conversations."""
    conversations: List[ConversationMetadataResponse]
    total: int
    
    model_config = camel_config(
        json_schema_extra={
            "example": {
                "conversations": [],
                "total": 0
            }
        }
    )
