"""Leaderboard service for model rankings."""

from datetime import datetime, timezone
from typing import List, Dict, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from core.database import (
    CONVERSATIONS_COLLECTION,
    LEADERBOARD_MODELS_COLLECTION,
)
from schemas.leaderboard import (
    ModelLeaderboardEntry,
    LeaderboardResponse,
)


class LeaderboardService:
    """Service for model leaderboard operations."""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        """
        Initialize the leaderboard service.
        
        Args:
            db: MongoDB database instance
        """
        self.db = db
        self.conversations = db[CONVERSATIONS_COLLECTION]
        self.leaderboard_models = db[LEADERBOARD_MODELS_COLLECTION]
    
    async def record_model_scores(
        self,
        category: Optional[str],
        aggregate_ranking: List[Dict]
    ) -> bool:
        """
        Record model scores from a conversation's aggregate ranking.
        Updates both overall and category-specific stats.
        
        Args:
            category: Category of the conversation (optional)
            aggregate_ranking: List of {model, score, ...} from stage3
            
        Returns:
            True if recorded successfully, False otherwise
        """
        if not aggregate_ranking:
            return False
        
        try:
            now = datetime.now(timezone.utc)
            
            for rank_entry in aggregate_ranking:
                model = rank_entry.get("model")
                score = rank_entry.get("score")
                
                if not model or score is None:
                    continue
                
                score = float(score)
                
                # Update overall stats (category = None)
                await self.leaderboard_models.update_one(
                    {"model": model, "category": None},
                    {
                        "$inc": {
                            "total_score": score,
                            "appearances": 1
                        },
                        "$set": {"last_updated": now}
                    },
                    upsert=True
                )
                
                # Update category-specific stats if category is provided
                if category:
                    await self.leaderboard_models.update_one(
                        {"model": model, "category": category},
                        {
                            "$inc": {
                                "total_score": score,
                                "appearances": 1
                            },
                            "$set": {"last_updated": now}
                        },
                        upsert=True
                    )
            
            return True
        except Exception as e:
            print(f"Error recording model scores: {e}")
            return False
    
    async def get_leaderboard(self) -> LeaderboardResponse:
        """
        Get the complete model leaderboard (overall and by category).
        
        Returns:
            LeaderboardResponse with overall and per-category rankings
        """
        # Get overall rankings
        overall = await self._get_model_rankings(category=None)
        
        # Get all distinct categories
        categories = await self.leaderboard_models.distinct(
            "category", 
            {"category": {"$ne": None}}
        )
        
        # Get per-category rankings
        by_category: Dict[str, List[ModelLeaderboardEntry]] = {}
        for cat in categories:
            by_category[cat] = await self._get_model_rankings(category=cat)
        
        return LeaderboardResponse(
            overall=overall,
            by_category=by_category,
            categories=sorted(categories)
        )
    
    async def _get_model_rankings(
        self, 
        category: Optional[str]
    ) -> List[ModelLeaderboardEntry]:
        """
        Get model rankings for a specific category or overall.
        
        Args:
            category: Category name, or None for overall
            
        Returns:
            List of ModelLeaderboardEntry sorted by avg_score descending
        """
        entries = []
        cursor = self.leaderboard_models.find({"category": category})
        
        async for doc in cursor:
            total_score = doc.get("total_score", 0)
            appearances = doc.get("appearances", 0)
            avg_score = total_score / appearances if appearances > 0 else 0
            
            entries.append(ModelLeaderboardEntry(
                model=doc.get("model"),
                total_score=round(total_score, 1),
                avg_score=round(avg_score, 1),
                appearances=appearances,
                rank=0,  # Will be set after sorting
                category=category
            ))
        
        # Sort by avg_score descending, then total_score
        entries.sort(key=lambda x: (x.avg_score, x.total_score), reverse=True)
        
        # Assign ranks
        for i, entry in enumerate(entries):
            entry.rank = i + 1
        
        return entries
    
    async def rebuild_from_conversations(self) -> Dict[str, int]:
        """
        Rebuild the model leaderboard from the conversations collection.
        
        Returns:
            Dict with counts of processed items
        """
        try:
            # Clear existing leaderboard data
            await self.leaderboard_models.delete_many({})
            
            # Process all conversations
            cursor = self.conversations.find({}, {"messages": 1})
            
            conversations_processed = 0
            rankings_processed = 0
            
            async for conv_doc in cursor:
                conversations_processed += 1
                messages = conv_doc.get("messages", [])
                
                for message in messages:
                    if message.get("role") != "assistant":
                        continue
                    
                    # Get category from message
                    category = message.get("category")
                    
                    # Get aggregate_ranking from stage3
                    stage3 = message.get("stage3") or {}
                    aggregate_ranking = (
                        stage3.get("aggregate_ranking") or 
                        stage3.get("aggregateRanking") or 
                        []
                    )
                    
                    if aggregate_ranking:
                        await self.record_model_scores(category, aggregate_ranking)
                        rankings_processed += 1
            
            # Get final count
            model_entries = await self.leaderboard_models.count_documents({})
            
            return {
                "conversations_processed": conversations_processed,
                "rankings_processed": rankings_processed,
                "model_entries": model_entries
            }
        except Exception as e:
            print(f"Error rebuilding leaderboard: {e}")
            return {"error": str(e)}
