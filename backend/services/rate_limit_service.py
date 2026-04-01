"""Rate limiting service for demo users."""

from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from core.database import USERS_COLLECTION


class RateLimitService:
    """Service for managing user rate limits."""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        """
        Initialize the rate limit service.
        
        Args:
            db: MongoDB database instance
        """
        self.db = db
        self.users = db[USERS_COLLECTION]
    
    async def check_and_increment_limit(self, user_id: str) -> Tuple[bool, int, Optional[str]]:
        """
        Check if user can make a request and increment count if allowed.
        
        Args:
            user_id: User ID
            
        Returns:
            Tuple of (allowed: bool, remaining: int, error_message: Optional[str])
            - allowed: True if request is allowed, False if limit exceeded
            - remaining: Number of requests remaining
            - error_message: Error message if not allowed, None otherwise
        """
        try:
            user_doc = await self.users.find_one({"_id": ObjectId(user_id)})
            if not user_doc:
                return False, 0, "User not found"
            
            # If user has no limit, allow unlimited requests
            daily_limit = user_doc.get("daily_request_limit")
            if daily_limit is None:
                return True, -1, None  # -1 means unlimited
            
            # Get current count and last request date
            current_count = user_doc.get("daily_request_count", 0)
            last_request_date = user_doc.get("last_request_date")
            
            # Check if we need to reset the count (new day)
            now = datetime.now(timezone.utc)
            today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

            # Normalize last_request_date to an aware datetime in UTC (for old data that may be naive)
            reset_daily_count = False
            if last_request_date is None:
                reset_daily_count = True
            elif isinstance(last_request_date, datetime):
                if last_request_date.tzinfo is None:
                    last_request_date = last_request_date.replace(tzinfo=timezone.utc)
                reset_daily_count = last_request_date < today_start
            else:
                # Unexpected type – be safe and reset the counter
                reset_daily_count = True

            if reset_daily_count:
                # Reset count for new day
                current_count = 0
            
            # Check if limit exceeded
            if current_count >= daily_limit:
                return False, 0, f"Daily request limit of {daily_limit} exceeded. Please contact support for more requests."
            
            # Increment count (store last_request_date as UTC-aware so reads can compare safely)
            new_count = current_count + 1
            await self.users.update_one(
                {"_id": ObjectId(user_id)},
                {
                    "$set": {
                        "daily_request_count": new_count,
                        "last_request_date": now,  # datetime.now(timezone.utc) above
                        "updated_at": now
                    }
                }
            )
            
            remaining = daily_limit - new_count
            return True, remaining, None
            
        except Exception as e:
            return False, 0, f"Rate limit check failed: {str(e)}"
    
    async def get_remaining_requests(self, user_id: str) -> Tuple[int, Optional[int]]:
        """
        Get remaining requests for a user without incrementing.
        
        Args:
            user_id: User ID
            
        Returns:
            Tuple of (remaining: int, limit: Optional[int])
            - remaining: Number of requests remaining (-1 for unlimited)
            - limit: Daily limit (None for unlimited)
        """
        try:
            user_doc = await self.users.find_one({"_id": ObjectId(user_id)})
            if not user_doc:
                return 0, None
            
            daily_limit = user_doc.get("daily_request_limit")
            if daily_limit is None:
                return -1, None  # Unlimited
            
            current_count = user_doc.get("daily_request_count", 0)
            last_request_date = user_doc.get("last_request_date")
            
            # Check if we're in a new day
            now = datetime.now(timezone.utc)
            today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

            # Normalize last_request_date similarly to check_and_increment_limit
            reset_daily_count = False
            if last_request_date is None:
                reset_daily_count = True
            elif isinstance(last_request_date, datetime):
                if last_request_date.tzinfo is None:
                    last_request_date = last_request_date.replace(tzinfo=timezone.utc)
                reset_daily_count = last_request_date < today_start
            else:
                reset_daily_count = True

            if reset_daily_count:
                # New day, count resets
                current_count = 0
            
            remaining = max(0, daily_limit - current_count)
            return remaining, daily_limit
            
        except Exception:
            return 0, None
    
    async def reset_user_limit(self, user_id: str, daily_limit: Optional[int] = None) -> bool:
        """
        Reset a user's daily request count to 0.
        
        Args:
            user_id: User ID
            daily_limit: Optional daily limit to set during reset
            
        Returns:
            True if successful, False otherwise
        """
        try:
            update_data = {
                "daily_request_count": 0,
                "updated_at": datetime.now(timezone.utc)
            }
            if daily_limit is not None:
                update_data["daily_request_limit"] = daily_limit

            result = await self.users.update_one(
                {"_id": ObjectId(user_id)},
                {
                    "$set": update_data
                }
            )
            return result.modified_count > 0
        except Exception:
            return False
