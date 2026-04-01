"""User profile API routes."""

from datetime import datetime, timezone
from math import ceil
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from core.dependencies import get_db, get_current_active_user, get_current_admin_user
from core.database import USERS_COLLECTION
from core.security import encrypt_api_key, decrypt_api_key
from models.user import UserInDB
from schemas.user import (
    UserResponse,
    UserUpdateRequest,
    AdminUserUpdateRequest,
    UserListResponse,
)
from pydantic import Field
from schemas.base import CamelSchema, camel_config
from app.config import DEMO_EMAIL
from services.rate_limit_service import RateLimitService

router = APIRouter()
DEMO_DAILY_REQUEST_LIMIT = 3

async def get_user_openrouter_key(user_id: str, db: AsyncIOMotorDatabase) -> Optional[str]:
    """
    Fetch and decrypt the user's OpenRouter API key.

    Returns None if the user has not configured a key.

    Raises:
        ValueError: if the user_id is invalid, the user is missing, or decryption fails.
    """
    users = db[USERS_COLLECTION]

    try:
        user_doc = await users.find_one({"_id": ObjectId(user_id)})
    except Exception as e:
        raise ValueError(f"Invalid user id: {str(e)}")

    if not user_doc:
        raise ValueError("User not found")

    encrypted = user_doc.get("openrouter_api_key_encrypted")
    if not encrypted:
        return None

    # decrypt_api_key raises ValueError on failure; bubble it up for callers to handle.
    return decrypt_api_key(encrypted)


def _user_doc_to_response(user_doc: dict) -> UserResponse:
    return UserResponse(
        id=str(user_doc["_id"]),
        email=user_doc["email"],
        full_name=user_doc["full_name"],
        username=user_doc.get("username"),
        created_at=user_doc["created_at"],
        updated_at=user_doc["updated_at"],
        is_active=user_doc.get("is_active", True),
        is_verified=user_doc.get("is_verified", False),
        last_login=user_doc.get("last_login"),
        roles=user_doc.get("roles", ["user"]),
        has_open_router_key=bool(user_doc.get("openrouter_api_key_encrypted")),
        daily_request_count=user_doc.get("daily_request_count", 0),
        daily_request_limit=user_doc.get("daily_request_limit"),
        last_request_date=user_doc.get("last_request_date"),
        is_demo=True if user_doc["email"] == DEMO_EMAIL else None,
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get the current user's profile.
    """
    # Fetch fresh user data to get encrypted API key status
    users = db[USERS_COLLECTION]
    user_doc = await users.find_one({"_id": ObjectId(current_user.id)})
    
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    is_demo_user = bool(DEMO_EMAIL) and user_doc.get("email") == DEMO_EMAIL
    if is_demo_user:
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        last_request_date = user_doc.get("last_request_date")

        reset_daily_limit = False
        if last_request_date is None:
            reset_daily_limit = True
        elif isinstance(last_request_date, datetime):
            if last_request_date.tzinfo is None:
                last_request_date = last_request_date.replace(tzinfo=timezone.utc)
            reset_daily_limit = last_request_date < today_start
        else:
            reset_daily_limit = True

        if reset_daily_limit and (
            user_doc.get("daily_request_limit") != DEMO_DAILY_REQUEST_LIMIT
            or user_doc.get("daily_request_count", 0) != 0
        ):
            await users.update_one(
                {"_id": user_doc["_id"]},
                {
                    "$set": {
                        "daily_request_limit": DEMO_DAILY_REQUEST_LIMIT,
                        "daily_request_count": 0,
                        "updated_at": now,
                    }
                },
            )
            user_doc["daily_request_limit"] = DEMO_DAILY_REQUEST_LIMIT
            user_doc["daily_request_count"] = 0

    return _user_doc_to_response(user_doc)


@router.patch("/me", response_model=UserResponse)
async def update_current_user_profile(
    request: UserUpdateRequest,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Update the current user's profile.
    
    Only provided fields will be updated.
    """
    users = db[USERS_COLLECTION]
    
    # Build update document
    update_data = {}
    
    if request.full_name is not None:
        update_data["full_name"] = request.full_name
    
    if request.username is not None:
        # Check if username is already taken by another user
        existing = await users.find_one({
            "username": request.username,
            "_id": {"$ne": ObjectId(current_user.id)}
        })
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        update_data["username"] = request.username
    
    if not update_data:
        # No updates provided, return current user
        # Fetch fresh user data
        user_doc = await users.find_one({"_id": ObjectId(current_user.id)})
        if not user_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return _user_doc_to_response(user_doc)
    
    # Add updated_at timestamp
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    # Update user
    await users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": update_data}
    )
    
    # Fetch updated user
    updated_user = await users.find_one({"_id": ObjectId(current_user.id)})

    return _user_doc_to_response(updated_user)


# OpenRouter API Key Management

class OpenRouterKeyRequest(CamelSchema):
    """Request schema for setting OpenRouter API key."""
    api_key: str = Field(..., min_length=10, description="OpenRouter API key (starts with sk-or-)")
    
    model_config = camel_config(
        json_schema_extra={
            "example": {
                "apiKey": "sk-or-v1-..."
            }
        }
    )


@router.post("/me/openrouter-key", status_code=status.HTTP_200_OK)
async def set_openrouter_key(
    request: OpenRouterKeyRequest,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Set or update the current user's OpenRouter API key.
    
    The API key is encrypted before storage.
    """
    # Validate API key format (OpenRouter keys start with sk-or-)
    if not request.api_key.startswith("sk-or-"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OpenRouter API key format. Keys must start with 'sk-or-'"
        )
    
    # Encrypt the API key
    try:
        encrypted_key = encrypt_api_key(request.api_key)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to encrypt API key: {str(e)}"
        )
    
    # Update user document
    users = db[USERS_COLLECTION]
    await users.update_one(
        {"_id": ObjectId(current_user.id)},
        {
            "$set": {
                "openrouter_api_key_encrypted": encrypted_key,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    return {"message": "OpenRouter API key saved successfully"}


@router.delete("/me/openrouter-key", status_code=status.HTTP_200_OK)
async def remove_openrouter_key(
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Remove the current user's OpenRouter API key.
    """
    users = db[USERS_COLLECTION]
    await users.update_one(
        {"_id": ObjectId(current_user.id)},
        {
            "$set": {
                "openrouter_api_key_encrypted": None,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    return {"message": "OpenRouter API key removed successfully"}


# Admin endpoints

@router.get("", response_model=UserListResponse)
@router.get("/", response_model=UserListResponse)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    sort_by: str = Query("updated_at"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    _: UserInDB = Depends(get_current_admin_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    List users (admin only).
    """
    users = db[USERS_COLLECTION]

    query: dict = {}
    if is_active is not None:
        query["is_active"] = is_active
    if role:
        query["roles"] = role
    if search:
        query["$or"] = [
            {"email": {"$regex": search, "$options": "i"}},
            {"full_name": {"$regex": search, "$options": "i"}},
            {"username": {"$regex": search, "$options": "i"}},
        ]

    # Sorting
    allowed_sort_fields = {"created_at", "updated_at", "email", "full_name", "username", "last_login"}
    if sort_by not in allowed_sort_fields:
        sort_by = "updated_at"
    sort_dir = 1 if sort_order == "asc" else -1

    total = await users.count_documents(query)
    skip = (page - 1) * page_size

    cursor = users.find(query).sort(sort_by, sort_dir).skip(skip).limit(page_size)
    results = []
    async for user_doc in cursor:
        results.append(_user_doc_to_response(user_doc))

    total_pages = max(1, ceil(total / page_size)) if total else 1

    return UserListResponse(
        users=results,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    _: UserInDB = Depends(get_current_admin_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    users = db[USERS_COLLECTION]
    try:
        user_doc = await users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user id")

    if not user_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return _user_doc_to_response(user_doc)


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    request: AdminUserUpdateRequest,
    _: UserInDB = Depends(get_current_admin_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    users = db[USERS_COLLECTION]

    update_data: dict = {}
    if request.email is not None:
        update_data["email"] = request.email
    if request.full_name is not None:
        update_data["full_name"] = request.full_name
    if request.username is not None:
        existing = await users.find_one({"username": request.username, "_id": {"$ne": ObjectId(user_id)}})
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken")
        update_data["username"] = request.username
    if request.is_active is not None:
        update_data["is_active"] = request.is_active
    if request.is_verified is not None:
        update_data["is_verified"] = request.is_verified
    if request.roles is not None:
        update_data["roles"] = request.roles

    if not update_data:
        # No updates provided, return current server-side state
        try:
            user_doc = await users.find_one({"_id": ObjectId(user_id)})
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user id")
        if not user_doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return _user_doc_to_response(user_doc)

    update_data["updated_at"] = datetime.now(timezone.utc)

    try:
        result = await users.update_one({"_id": ObjectId(user_id)}, {"$set": update_data})
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user id")

    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user_doc = await users.find_one({"_id": ObjectId(user_id)})
    return _user_doc_to_response(user_doc)


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    _: UserInDB = Depends(get_current_admin_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    users = db[USERS_COLLECTION]
    try:
        result = await users.delete_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user id")

    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return {"message": "User deleted"}


@router.post("/{user_id}/roles/{role}", response_model=UserResponse)
async def add_user_role(
    user_id: str,
    role: str,
    _: UserInDB = Depends(get_current_admin_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    users = db[USERS_COLLECTION]
    try:
        await users.update_one(
            {"_id": ObjectId(user_id)},
            {"$addToSet": {"roles": role}, "$set": {"updated_at": datetime.now(timezone.utc)}},
        )
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user id")

    user_doc = await users.find_one({"_id": ObjectId(user_id)})
    if not user_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return _user_doc_to_response(user_doc)


@router.delete("/{user_id}/roles/{role}", response_model=UserResponse)
async def remove_user_role(
    user_id: str,
    role: str,
    _: UserInDB = Depends(get_current_admin_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    users = db[USERS_COLLECTION]
    try:
        await users.update_one(
            {"_id": ObjectId(user_id)},
            {"$pull": {"roles": role}, "$set": {"updated_at": datetime.now(timezone.utc)}},
        )
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user id")

    user_doc = await users.find_one({"_id": ObjectId(user_id)})
    if not user_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return _user_doc_to_response(user_doc)


@router.post("/demo/reset-limit", response_model=UserResponse)
async def reset_demo_user_limit(
    _: UserInDB = Depends(get_current_admin_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Reset the demo user's daily request count to 0 (admin only).
    
    This allows the demo user to make their full allocation of requests again.
    """
    if not DEMO_EMAIL:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Demo email not configured"
        )
    
    users = db[USERS_COLLECTION]
    
    # Find demo user
    demo_user = await users.find_one({"email": DEMO_EMAIL})
    if not demo_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Demo user not found"
        )
    
    # Reset the limit using rate limit service
    rate_limit_service = RateLimitService(db)
    success = await rate_limit_service.reset_user_limit(
        str(demo_user["_id"]), daily_limit=DEMO_DAILY_REQUEST_LIMIT
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset demo user limit"
        )
    
    # Return updated user
    updated_user = await users.find_one({"_id": demo_user["_id"]})
    return _user_doc_to_response(updated_user)
