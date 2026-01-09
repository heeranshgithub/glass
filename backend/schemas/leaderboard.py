"""Leaderboard request/response schemas."""

from typing import List, Optional
from schemas.base import CamelSchema, camel_config


class ModelLeaderboardEntry(CamelSchema):
    """Leaderboard entry for a model."""
    model: str
    total_score: float
    avg_score: float
    appearances: int
    rank: int
    category: Optional[str] = None  # None = overall, string = specific category

    model_config = camel_config(
        json_schema_extra={
            "example": {
                "model": "openai/gpt-5.1",
                "totalScore": 380.0,
                "avgScore": 95.0,
                "appearances": 4,
                "rank": 1,
                "category": None
            }
        }
    )


class LeaderboardResponse(CamelSchema):
    """Complete leaderboard response."""
    overall: List[ModelLeaderboardEntry]
    by_category: dict[str, List[ModelLeaderboardEntry]]
    categories: List[str]  # List of available categories
    
    model_config = camel_config(
        json_schema_extra={
            "example": {
                "overall": [
                    {
                        "model": "openai/gpt-5.1",
                        "totalScore": 380.0,
                        "avgScore": 95.0,
                        "appearances": 4,
                        "rank": 1,
                        "category": None
                    }
                ],
                "byCategory": {
                    "Philosophy & Growth": [
                        {
                            "model": "openai/gpt-5.1",
                            "totalScore": 280.0,
                            "avgScore": 93.3,
                            "appearances": 3,
                            "rank": 1,
                            "category": "Philosophy & Growth"
                        }
                    ]
                },
                "categories": ["Philosophy & Growth", "Business & Economics"]
            }
        }
    )
