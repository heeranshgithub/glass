"""Leaderboard API routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from core.dependencies import get_db, get_current_active_user
from services.leaderboard_service import LeaderboardService
from models.user import UserInDB
from schemas.leaderboard import LeaderboardResponse


router = APIRouter()


@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get the model leaderboard.
    
    Returns:
    - Overall model rankings
    - Per-category model rankings
    - List of available categories
    """
    leaderboard_service = LeaderboardService(db)
    return await leaderboard_service.get_leaderboard()


@router.post("/leaderboard/rebuild")
async def rebuild_leaderboard(
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Rebuild the model leaderboard from conversations.
    
    This recalculates all model scores from the conversations collection.
    Requires authentication.
    """
    leaderboard_service = LeaderboardService(db)
    result = await leaderboard_service.rebuild_from_conversations()
    
    return {
        "message": "Leaderboard rebuilt successfully",
        "stats": result
    }
