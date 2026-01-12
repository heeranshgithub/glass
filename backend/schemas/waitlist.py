"""Waitlist request/response schemas."""

from pydantic import BaseModel, EmailStr


class WaitlistJoinRequest(BaseModel):
    """Request schema for joining waitlist."""
    email: EmailStr


class WaitlistJoinResponse(BaseModel):
    """Response schema for joining waitlist."""
    success: bool
    message: str
