"""MongoDB database connection management."""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional

from app.config import MONGODB_URL, MONGODB_DB_NAME


class Database:
    """MongoDB database manager."""
    
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None


db = Database()


async def connect_to_mongodb():
    """Connect to MongoDB on application startup."""
    print(f"Connecting to MongoDB")
    db.client = AsyncIOMotorClient(MONGODB_URL)
    db.db = db.client[MONGODB_DB_NAME]
    
    # Verify connection
    try:
        await db.client.admin.command('ping')
        print(f"Connected to MongoDB database: {MONGODB_DB_NAME}")
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
        raise


async def close_mongodb_connection():
    """Close MongoDB connection on application shutdown."""
    if db.client:
        print("Closing MongoDB connection...")
        db.client.close()
        print("MongoDB connection closed")


def get_database() -> AsyncIOMotorDatabase:
    """Get the database instance."""
    if db.db is None:
        raise RuntimeError("Database not connected. Call connect_to_mongodb() first.")
    return db.db


async def get_collection(name: str):
    """Get a collection from the database."""
    database = get_database()
    return database[name]


# Collection names
USERS_COLLECTION = "users"
CONVERSATIONS_COLLECTION = "conversations"
REFRESH_TOKENS_COLLECTION = "refresh_tokens"
LEADERBOARD_MODELS_COLLECTION = "leaderboard_models"
