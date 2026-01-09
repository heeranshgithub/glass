"""Security utilities: JWT, password hashing, API key encryption, OAuth helpers."""

import secrets
import base64
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

from jose import jwt, JWTError
from passlib.context import CryptContext
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from app.config import (
    JWT_SECRET_KEY,
    JWT_ALGORITHM,
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
    JWT_REFRESH_TOKEN_EXPIRE_DAYS,
    ENCRYPTION_KEY,
)


# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.
    
    Args:
        plain_password: Plain text password
        hashed_password: Hashed password
        
    Returns:
        True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Data to encode in the token (should include 'sub' for user ID)
        expires_delta: Optional custom expiration time
        
    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access"
    })
    
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def create_refresh_token(data: Dict[str, Any]) -> str:
    """
    Create a JWT refresh token.
    
    Args:
        data: Data to encode in the token (should include 'sub' for user ID)
        
    Returns:
        Encoded JWT refresh token
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "refresh"
    })
    
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and validate a JWT token.
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded token data or None if invalid/expired
    """
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        return None


# OAuth helpers (stubs for future implementation)

def get_oauth_provider(provider: str) -> Optional[Dict[str, Any]]:
    """
    Get OAuth provider configuration.
    
    Args:
        provider: OAuth provider name (e.g., 'google', 'github')
        
    Returns:
        Provider configuration or None if not configured
    """
    # Stub for future OAuth implementation
    providers = {
        # 'google': {
        #     'client_id': os.getenv('GOOGLE_CLIENT_ID'),
        #     'client_secret': os.getenv('GOOGLE_CLIENT_SECRET'),
        #     'authorize_url': 'https://accounts.google.com/o/oauth2/v2/auth',
        #     'token_url': 'https://oauth2.googleapis.com/token',
        # },
        # 'github': {
        #     'client_id': os.getenv('GITHUB_CLIENT_ID'),
        #     'client_secret': os.getenv('GITHUB_CLIENT_SECRET'),
        #     'authorize_url': 'https://github.com/login/oauth/authorize',
        #     'token_url': 'https://github.com/login/oauth/access_token',
        # },
    }
    return providers.get(provider)


def generate_oauth_state() -> str:
    """Generate a secure state parameter for OAuth."""
    return secrets.token_urlsafe(32)


def verify_oauth_state(state: str, expected: str) -> bool:
    """Verify OAuth state parameter."""
    return secrets.compare_digest(state, expected)


# API Key Encryption Utilities
# Note: API keys are encrypted (reversible) unlike passwords which are hashed (one-way)

def _get_fernet_key() -> Fernet:
    """
    Get Fernet encryption key from ENCRYPTION_KEY.
    
    Converts the encryption key string to a Fernet-compatible key.
    """
    # Derive a 32-byte key from the encryption key string
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=b'glass_api_key_salt',  # Fixed salt for consistency
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(ENCRYPTION_KEY.encode()))
    return Fernet(key)


def encrypt_api_key(api_key: str) -> str:
    """
    Encrypt an API key using Fernet symmetric encryption.
    
    Args:
        api_key: Plain text API key
        
    Returns:
        Encrypted API key as base64 string
    """
    fernet = _get_fernet_key()
    encrypted = fernet.encrypt(api_key.encode())
    return encrypted.decode()


def decrypt_api_key(encrypted_key: str) -> str:
    """
    Decrypt an API key using Fernet symmetric encryption.
    
    Args:
        encrypted_key: Encrypted API key as base64 string
        
    Returns:
        Plain text API key
        
    Raises:
        ValueError: If decryption fails (invalid key or corrupted data)
    """
    try:
        fernet = _get_fernet_key()
        decrypted = fernet.decrypt(encrypted_key.encode())
        return decrypted.decode()
    except Exception as e:
        raise ValueError(f"Failed to decrypt API key: {str(e)}")
