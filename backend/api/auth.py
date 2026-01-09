"""Authentication API routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from core.dependencies import get_db, get_current_user, get_current_active_user
from services.auth_service import AuthService
from models.user import UserInDB
from schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    TokenRefreshRequest,
    PasswordChangeRequest,
    LogoutRequest,
    AuthStatusResponse,
)

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: RegisterRequest,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Register a new user.
    
    Returns access and refresh tokens on successful registration.
    """
    auth_service = AuthService(db)
    
    try:
        user = await auth_service.register_user(
            email=request.email,
            password=request.password,
            full_name=request.full_name,
            username=request.username
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    # Create and return tokens
    return await auth_service.create_tokens(user.id)


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Login with email and password.
    
    Returns access and refresh tokens on successful authentication.
    """
    auth_service = AuthService(db)
    
    user = await auth_service.authenticate_user(
        email=request.email,
        password=request.password
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account"
        )
    
    return await auth_service.create_tokens(user.id)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: TokenRefreshRequest,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Refresh access token using a valid refresh token.
    
    Returns new access and refresh tokens.
    """
    auth_service = AuthService(db)
    
    tokens = await auth_service.refresh_access_token(request.refresh_token)
    
    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return tokens


@router.post("/logout")
async def logout(
    request: LogoutRequest,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Logout the current session.
    
    Optionally provide the refresh token to invalidate a specific session.
    """
    auth_service = AuthService(db)
    
    await auth_service.logout_user(
        user_id=current_user.id,
        refresh_token=request.refresh_token
    )
    
    return {"message": "Successfully logged out"}


@router.post("/logout/all")
async def logout_all(
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Logout all sessions for the current user.
    
    Invalidates all refresh tokens.
    """
    auth_service = AuthService(db)
    
    count = await auth_service.logout_all_sessions(current_user.id)
    
    return {
        "message": "Successfully logged out of all sessions",
        "sessions_invalidated": count
    }


@router.post("/password/change")
async def change_password(
    request: PasswordChangeRequest,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Change the current user's password.
    
    Requires the current password for verification.
    """
    auth_service = AuthService(db)
    
    success = await auth_service.change_password(
        user_id=current_user.id,
        current_password=request.current_password,
        new_password=request.new_password
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    return {"message": "Password changed successfully"}


@router.get("/status", response_model=AuthStatusResponse)
async def auth_status(
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Get the current authentication status.
    
    Returns information about the authenticated user.
    """
    return AuthStatusResponse(
        authenticated=True,
        user_id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        roles=current_user.roles
    )
