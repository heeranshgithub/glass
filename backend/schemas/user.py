"""User request/response schemas."""

from typing import Optional, List, Literal
from pydantic import EmailStr, Field
from datetime import datetime

from schemas.base import CamelSchema, camel_config


class UserResponse(CamelSchema):
    """User response schema (public fields only)."""
    id: str
    email: EmailStr
    full_name: str
    username: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    is_active: bool
    is_verified: bool
    last_login: Optional[datetime] = None
    roles: List[str]
    has_open_router_key: bool
    daily_request_count: int = 0
    daily_request_limit: Optional[int] = None
    last_request_date: Optional[datetime] = None
    is_demo: Optional[bool] = None
    
    model_config = camel_config(
        json_schema_extra={
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "email": "user@example.com",
                "fullName": "John Doe",
                "username": "johndoe",
                "createdAt": "2025-01-01T00:00:00Z",
                "updatedAt": "2025-01-01T00:00:00Z",
                "isActive": True,
                "isVerified": False,
                "lastLogin": None,
                "roles": ["user"],
                "hasOpenRouterKey": False,
                "dailyRequestCount": 0,
                "dailyRequestLimit": None,
                "lastRequestDate": None,
                "isDemo": None
            }
        }
    )


class UserUpdateRequest(CamelSchema):
    """User update request schema."""
    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    
    model_config = camel_config(
        json_schema_extra={
            "example": {
                "fullName": "John Smith",
                "username": "johnsmith"
            }
        }
    )


class AdminUserUpdateRequest(CamelSchema):
    """Admin user update request schema."""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    # Note: roles are managed via dedicated role endpoints in the frontend, but
    # we allow updating here too for completeness.
    roles: Optional[List[str]] = None

    model_config = camel_config(
        json_schema_extra={
            "example": {
                "email": "updated@example.com",
                "fullName": "Updated Name",
                "username": "updateduser",
                "isActive": True,
                "isVerified": True,
                "roles": ["user", "admin"]
            }
        }
    )


class UserListResponse(CamelSchema):
    """Paginated user list response."""
    users: List[UserResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

    model_config = camel_config(
        json_schema_extra={
            "example": {
                "users": [],
                "total": 0,
                "page": 1,
                "pageSize": 20,
                "totalPages": 1
            }
        }
    )


class UserListQuery(CamelSchema):
    """User list query parameters (admin)."""
    page: int = 1
    page_size: int = 20
    search: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    sort_by: str = "updated_at"
    sort_order: Literal["asc", "desc"] = "desc"

    model_config = camel_config(
        json_schema_extra={
            "example": {
                "page": 1,
                "pageSize": 20,
                "search": "john",
                "role": "admin",
                "isActive": True,
                "sortBy": "updatedAt",
                "sortOrder": "desc"
            }
        }
    )
