"""FastAPI dependencies for authentication and database."""

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from core.database import get_database, USERS_COLLECTION
from core.security import decode_token
from models.user import UserInDB


# HTTP Bearer scheme for JWT tokens
security = HTTPBearer(auto_error=False)


async def get_db() -> AsyncIOMotorDatabase:
    """
    Get MongoDB database dependency.
    
    Returns:
        MongoDB database instance
    """
    return get_database()


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> UserInDB:
    """
    Get the current authenticated user from JWT token.
    
    Args:
        credentials: HTTP Bearer credentials
        db: MongoDB database
        
    Returns:
        Current user
        
    Raises:
        HTTPException: If not authenticated or token invalid
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not credentials:
        raise credentials_exception
    
    token = credentials.credentials
    payload = decode_token(token)
    
    if payload is None:
        raise credentials_exception
    
    # Check token type
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    # Fetch user from database
    try:
        user_data = await db[USERS_COLLECTION].find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise credentials_exception
    
    if user_data is None:
        raise credentials_exception
    
    return UserInDB(**user_data)


async def get_current_active_user(
    current_user: UserInDB = Depends(get_current_user)
) -> UserInDB:
    """
    Ensure the current user is active.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        Active user
        
    Raises:
        HTTPException: If user is inactive
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user


async def get_current_admin_user(
    current_user: UserInDB = Depends(get_current_active_user),
) -> UserInDB:
    """
    Ensure the current user has admin privileges.
    """
    if "admin" not in (current_user.roles or []):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> Optional[UserInDB]:
    """
    Get current user if authenticated, otherwise return None.
    Useful for endpoints that can work with or without auth.
    
    Args:
        credentials: Optional HTTP Bearer credentials
        db: MongoDB database
        
    Returns:
        Current user or None
    """
    if not credentials:
        return None
    
    token = credentials.credentials
    payload = decode_token(token)
    
    if payload is None or payload.get("type") != "access":
        return None
    
    user_id = payload.get("sub")
    if user_id is None:
        return None
    
    try:
        user_data = await db[USERS_COLLECTION].find_one({"_id": ObjectId(user_id)})
        if user_data:
            return UserInDB(**user_data)
    except Exception:
        pass
    
    return None
