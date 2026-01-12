"""Waitlist API routes."""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError
import logging

from core.dependencies import get_db
from core.database import WAITLIST_COLLECTION
from models.waitlist import create_waitlist_document
from schemas.waitlist import WaitlistJoinRequest, WaitlistJoinResponse
from services.email_service import get_email_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/join", response_model=WaitlistJoinResponse, status_code=status.HTTP_201_CREATED)
async def join_waitlist(
    request: WaitlistJoinRequest,
    http_request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Join the waitlist by submitting an email.
    
    - Validates email format
    - Checks for duplicates
    - Stores in MongoDB
    - Sends confirmation email
    """
    email = request.email
    collection = db[WAITLIST_COLLECTION]
    
    # Get client info
    ip_address = http_request.client.host if http_request.client else None
    user_agent = http_request.headers.get("user-agent")
    
    # Check if email already exists
    existing = await collection.find_one({"email": email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This email is already on the waitlist"
        )
    
    try:
        # Create waitlist document
        document = create_waitlist_document(
            email=email,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        # Insert into database
        result = await collection.insert_one(document)
        
        # Create unique index on email if it doesn't exist
        try:
            await collection.create_index("email", unique=True)
        except Exception as e:
            logger.warning(f"Index creation warning: {e}")
        
        # Send confirmation email (don't fail if email fails)
        email_service = get_email_service()
        try:
            await email_service.send_waitlist_confirmation(email)
            logger.info(f"Confirmation email sent to {email}")
        except Exception as e:
            logger.error(f"Failed to send confirmation email to {email}: {e}")
            # Continue anyway - the user is on the waitlist
        
        return WaitlistJoinResponse(
            success=True,
            message="Successfully joined the waitlist! Check your email for confirmation."
        )
        
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This email is already on the waitlist"
        )
    except Exception as e:
        logger.error(f"Error adding to waitlist: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to join waitlist. Please try again later."
        )


@router.get("", response_model=dict)
async def list_waitlist(
    db: AsyncIOMotorDatabase = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """
    List all waitlist entries (admin endpoint).
    
    This endpoint can be secured with authentication in the future.
    """
    collection = db[WAITLIST_COLLECTION]
    
    # Get total count
    total = await collection.count_documents({})
    
    # Get entries
    cursor = collection.find({}).sort("joined_at", -1).skip(skip).limit(limit)
    entries = await cursor.to_list(length=limit)
    
    # Convert ObjectId to string
    for entry in entries:
        entry["_id"] = str(entry["_id"])
    
    return {
        "total": total,
        "entries": entries,
        "skip": skip,
        "limit": limit
    }
