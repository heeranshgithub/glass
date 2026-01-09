"""Auth request/response schemas."""

from typing import Optional, List
from pydantic import EmailStr, Field

from schemas.base import CamelSchema, camel_config


class LoginRequest(CamelSchema):
    """Login request schema."""
    email: EmailStr
    password: str = Field(..., min_length=6)
    
    model_config = camel_config(
        json_schema_extra={
            "example": {
                "email": "user@example.com",
                "password": "securepassword123"
            }
        }
    )


class RegisterRequest(CamelSchema):
    """Register request schema."""
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=1, max_length=100)
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    
    model_config = camel_config(
        json_schema_extra={
            "example": {
                "email": "user@example.com",
                "password": "securepassword123",
                "fullName": "John Doe",
                "username": "johndoe"
            }
        }
    )


class TokenResponse(CamelSchema):
    """Token response schema."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds until access token expires
    
    model_config = camel_config(
        json_schema_extra={
            "example": {
                "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "tokenType": "bearer",
                "expiresIn": 1800
            }
        }
    )


class TokenRefreshRequest(CamelSchema):
    """Token refresh request schema."""
    refresh_token: str
    
    model_config = camel_config(
        json_schema_extra={
            "example": {
                "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            }
        }
    )


class PasswordChangeRequest(CamelSchema):
    """Password change request schema."""
    current_password: str
    new_password: str = Field(..., min_length=6)
    
    model_config = camel_config(
        json_schema_extra={
            "example": {
                "currentPassword": "oldpassword123",
                "newPassword": "newsecurepassword456"
            }
        }
    )


class LogoutRequest(CamelSchema):
    """Logout request schema (optional refresh token for targeted logout)."""
    refresh_token: Optional[str] = None
    
    model_config = camel_config(
        json_schema_extra={
            "example": {
                "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            }
        }
    )


class AuthStatusResponse(CamelSchema):
    """Auth status response schema."""
    authenticated: bool
    user_id: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    roles: List[str] = []
    
    model_config = camel_config(
        json_schema_extra={
            "example": {
                "authenticated": True,
                "userId": "507f1f77bcf86cd799439011",
                "email": "user@example.com",
                "fullName": "John Doe",
                "roles": ["user"]
            }
        }
    )
