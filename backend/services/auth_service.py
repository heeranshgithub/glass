"""Authentication business logic service."""

from datetime import datetime, timezone
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from core.database import USERS_COLLECTION, REFRESH_TOKENS_COLLECTION
from app.config import JWT_ACCESS_TOKEN_EXPIRE_MINUTES
from models.user import UserInDB, create_user_document
from schemas.auth import TokenResponse


class AuthService:
    """Service for authentication operations."""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        """
        Initialize the auth service.
        
        Args:
            db: MongoDB database instance
        """
        self.db = db
        self.users = db[USERS_COLLECTION]
        self.refresh_tokens = db[REFRESH_TOKENS_COLLECTION]
    
    async def register_user(
        self,
        email: str,
        password: str,
        full_name: str,
        username: Optional[str] = None
    ) -> UserInDB:
        """
        Register a new user.
        
        Args:
            email: User email
            password: Plain text password
            full_name: User's full name
            username: Optional username
            
        Returns:
            Created user
            
        Raises:
            ValueError: If email already exists
        """
        # Check if email already exists
        existing = await self.users.find_one({"email": email})
        if existing:
            raise ValueError("Email already registered")
        
        # Check if username already exists (if provided)
        if username:
            existing_username = await self.users.find_one({"username": username})
            if existing_username:
                raise ValueError("Username already taken")
        
        # Create user document
        password_hash = hash_password(password)
        user_doc = create_user_document(
            email=email,
            password_hash=password_hash,
            full_name=full_name,
            username=username
        )
        
        # Insert into database
        result = await self.users.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id
        
        return UserInDB(**user_doc)
    
    async def authenticate_user(
        self,
        email: str,
        password: str
    ) -> Optional[UserInDB]:
        """
        Authenticate a user by email and password.
        
        Args:
            email: User email
            password: Plain text password
            
        Returns:
            User if authentication successful, None otherwise
        """
        user_doc = await self.users.find_one({"email": email})
        if not user_doc:
            return None
        
        if not verify_password(password, user_doc["password_hash"]):
            return None

        # Update last_login timestamp (best-effort)
        try:
            now = datetime.now(timezone.utc)
            await self.users.update_one(
                {"_id": user_doc["_id"]},
                {"$set": {"last_login": now}},
            )
            user_doc["last_login"] = now
        except Exception:
            pass

        return UserInDB(**user_doc)
    
    async def create_tokens(self, user_id: str) -> TokenResponse:
        """
        Create access and refresh tokens for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            Token response with access and refresh tokens
        """
        token_data = {"sub": user_id}
        
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        
        # Store refresh token in database for logout functionality
        await self.refresh_tokens.insert_one({
            "user_id": ObjectId(user_id),
            "token": refresh_token,
            "created_at": datetime.now(timezone.utc),
            "is_valid": True
        })
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
    
    async def refresh_access_token(self, refresh_token: str) -> Optional[TokenResponse]:
        """
        Refresh an access token using a refresh token.
        
        Args:
            refresh_token: Valid refresh token
            
        Returns:
            New token response, or None if refresh token is invalid
        """
        # Decode the refresh token
        payload = decode_token(refresh_token)
        if payload is None or payload.get("type") != "refresh":
            return None
        
        user_id = payload.get("sub")
        if not user_id:
            return None
        
        # Check if refresh token is valid in database
        token_doc = await self.refresh_tokens.find_one({
            "token": refresh_token,
            "is_valid": True
        })
        if not token_doc:
            return None
        
        # Check if user still exists and is active
        user_doc = await self.users.find_one({
            "_id": ObjectId(user_id),
            "is_active": True
        })
        if not user_doc:
            return None
        
        # Invalidate old refresh token
        await self.refresh_tokens.update_one(
            {"_id": token_doc["_id"]},
            {"$set": {"is_valid": False}}
        )
        
        # Create new tokens
        return await self.create_tokens(user_id)
    
    async def change_password(
        self,
        user_id: str,
        current_password: str,
        new_password: str
    ) -> bool:
        """
        Change a user's password.
        
        Args:
            user_id: User ID
            current_password: Current password
            new_password: New password
            
        Returns:
            True if password changed successfully, False otherwise
        """
        user_doc = await self.users.find_one({"_id": ObjectId(user_id)})
        if not user_doc:
            return False
        
        if not verify_password(current_password, user_doc["password_hash"]):
            return False
        
        new_hash = hash_password(new_password)
        await self.users.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "password_hash": new_hash,
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        
        return True
    
    async def logout_user(
        self,
        user_id: str,
        refresh_token: Optional[str] = None
    ) -> bool:
        """
        Logout a user by invalidating their refresh token(s).
        
        Args:
            user_id: User ID
            refresh_token: Optional specific refresh token to invalidate
            
        Returns:
            True if logout successful
        """
        if refresh_token:
            # Invalidate specific refresh token
            await self.refresh_tokens.update_one(
                {"token": refresh_token, "user_id": ObjectId(user_id)},
                {"$set": {"is_valid": False}}
            )
        else:
            # Invalidate all refresh tokens for this user
            await self.refresh_tokens.update_many(
                {"user_id": ObjectId(user_id)},
                {"$set": {"is_valid": False}}
            )
        
        return True
    
    async def logout_all_sessions(self, user_id: str) -> int:
        """
        Logout all sessions for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            Number of sessions invalidated
        """
        result = await self.refresh_tokens.update_many(
            {"user_id": ObjectId(user_id), "is_valid": True},
            {"$set": {"is_valid": False}}
        )
        return result.modified_count
    
    async def get_user_by_id(self, user_id: str) -> Optional[UserInDB]:
        """
        Get a user by their ID.
        
        Args:
            user_id: User ID
            
        Returns:
            User if found, None otherwise
        """
        try:
            user_doc = await self.users.find_one({"_id": ObjectId(user_id)})
            if user_doc:
                return UserInDB(**user_doc)
            return None
        except Exception:
            return None
