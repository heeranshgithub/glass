"""Pydantic schemas for request/response validation."""

from schemas.base import CamelSchema, camel_config, to_camel_dict
from schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    TokenRefreshRequest,
    PasswordChangeRequest,
    LogoutRequest,
    AuthStatusResponse,
)
from schemas.conversation import (
    CreateConversationRequest,
    SendMessageRequest,
    ModelResponseSchema,
    ModelRankingSchema,
    Stage3ResultSchema,
    AggregateRankingSchema,
    CouncilMetadataSchema,
    CouncilResponse,
    MessageSchema,
    ConversationResponse,
    ConversationMetadataResponse,
    ConversationListResponse,
)
from schemas.user import (
    UserResponse,
    UserUpdateRequest,
    AdminUserUpdateRequest,
    UserListResponse,
    UserListQuery,
)

__all__ = [
    # Base
    "CamelSchema",
    "camel_config",
    "to_camel_dict",
    # Auth
    "LoginRequest",
    "RegisterRequest",
    "TokenResponse",
    "TokenRefreshRequest",
    "PasswordChangeRequest",
    "LogoutRequest",
    "AuthStatusResponse",
    # Conversation
    "CreateConversationRequest",
    "SendMessageRequest",
    "ModelResponseSchema",
    "ModelRankingSchema",
    "Stage3ResultSchema",
    "AggregateRankingSchema",
    "CouncilMetadataSchema",
    "CouncilResponse",
    "MessageSchema",
    "ConversationResponse",
    "ConversationMetadataResponse",
    "ConversationListResponse",
    # User
    "UserResponse",
    "UserUpdateRequest",
    "AdminUserUpdateRequest",
    "UserListResponse",
    "UserListQuery",
]
