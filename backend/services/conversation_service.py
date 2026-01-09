"""Conversation business logic service."""

from datetime import datetime, timezone
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from core.database import CONVERSATIONS_COLLECTION
from models.conversation import (
    Conversation,
    ConversationMetadata,
    create_conversation_document,
)
from models.message import create_user_message, create_assistant_message
from ai.council import categorize_user_prompt
from services.leaderboard_service import LeaderboardService


class ConversationService:
    """Service for conversation operations."""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        """
        Initialize the conversation service.
        
        Args:
            db: MongoDB database instance
        """
        self.db = db
        self.conversations = db[CONVERSATIONS_COLLECTION]
        self.leaderboard_service = LeaderboardService(db)
    
    async def create_conversation(
        self,
        user_id: str,
        title: str = "New Conversation"
    ) -> Conversation:
        """
        Create a new conversation.
        
        Args:
            user_id: Owner's user ID
            title: Optional conversation title
            
        Returns:
            Created conversation
        """
        conv_doc = create_conversation_document(user_id, title)
        result = await self.conversations.insert_one(conv_doc)
        conv_doc["_id"] = result.inserted_id
        
        return Conversation(**conv_doc)
    
    async def get_conversation(
        self,
        conversation_id: str,
        user_id: str
    ) -> Optional[Conversation]:
        """
        Get a conversation by ID, verifying ownership.
        
        Args:
            conversation_id: Conversation ID
            user_id: User ID (for ownership verification)
            
        Returns:
            Conversation if found and owned by user, None otherwise
        """
        try:
            conv_doc = await self.conversations.find_one({
                "_id": ObjectId(conversation_id),
                "user_id": ObjectId(user_id)
            })
            if conv_doc:
                return Conversation(**conv_doc)
            return None
        except Exception:
            return None
    
    async def list_conversations(self, user_id: str) -> List[ConversationMetadata]:
        """
        List all conversations for a user (metadata only).
        
        Args:
            user_id: User ID
            
        Returns:
            List of conversation metadata
        """
        cursor = self.conversations.find(
            {"user_id": ObjectId(user_id)}
        ).sort("updated_at", -1)  # Newest first
        
        conversations = []
        async for conv_doc in cursor:
            conversations.append(ConversationMetadata(
                id=str(conv_doc["_id"]),
                title=conv_doc.get("title", "New Conversation"),
                created_at=conv_doc["created_at"],
                updated_at=conv_doc["updated_at"],
                message_count=len(conv_doc.get("messages", [])),
                category=conv_doc.get("category"),
                score=conv_doc.get("score")
            ))
        
        return conversations
    
    async def delete_conversation(
        self,
        conversation_id: str,
        user_id: str
    ) -> bool:
        """
        Delete a conversation.
        
        Args:
            conversation_id: Conversation ID
            user_id: User ID (for ownership verification)
            
        Returns:
            True if deleted, False if not found or not owned
        """
        try:
            result = await self.conversations.delete_one({
                "_id": ObjectId(conversation_id),
                "user_id": ObjectId(user_id)
            })
            return result.deleted_count > 0
        except Exception:
            return False
    
    async def add_user_message(
        self,
        conversation_id: str,
        user_id: str,
        content: str
    ) -> bool:
        """
        Add a user message to a conversation.
        
        Args:
            conversation_id: Conversation ID
            user_id: User ID (for ownership verification)
            content: Message content
            
        Returns:
            True if message added, False otherwise
        """
        try:
            message = create_user_message(content)
            result = await self.conversations.update_one(
                {
                    "_id": ObjectId(conversation_id),
                    "user_id": ObjectId(user_id)
                },
                {
                    "$push": {"messages": message},
                    "$set": {"updated_at": datetime.now(timezone.utc)}
                }
            )
            return result.modified_count > 0
        except Exception:
            return False
    
    async def add_assistant_message(
        self,
        conversation_id: str,
        user_id: str,
        stage1: list,
        stage2: list,
        stage3: dict,
        user_content: str,
        api_key: str
    ) -> bool:
        """
        Add an assistant message with all 3 stages to a conversation.
        Also categorizes the user prompt and includes it in the message.
        Updates conversation-level category and score based on first message.
        
        Args:
            conversation_id: Conversation ID
            user_id: User ID (for ownership verification)
            stage1: List of individual model responses
            stage2: List of model rankings
            stage3: Final synthesized response
            user_content: The user's original prompt (for categorization)
            api_key: OpenRouter API key (for categorization)
            
        Returns:
            True if message added, False otherwise
        """
        try:
            # Categorize the user prompt
            category = None
            try:
                category = await categorize_user_prompt(user_content, api_key)
            except Exception:
                # If categorization fails, continue without category (category remains None)
                pass
            
            # Create message with category
            message = create_assistant_message(stage1, stage2, stage3, category=category)
            
            # Calculate conversation score from aggregate ranking (use top model's score)
            conversation_score = None
            if stage3.get("aggregate_ranking"):
                # Use the highest score from the aggregate ranking as conversation score
                scores = [r.get("score", 0) for r in stage3["aggregate_ranking"] if r.get("score") is not None]
                if scores:
                    conversation_score = max(scores)
            
            # Check if this is the first assistant message (to set conversation-level category/score)
            conv = await self.get_conversation(conversation_id, user_id)
            is_first_message = conv and len([m for m in conv.messages if m.get("role") == "assistant"]) == 0
            
            # Build update operations
            update_ops = {
                "$push": {"messages": message},
                "$set": {"updated_at": datetime.now(timezone.utc)}
            }
            
            # Set conversation-level category and score on first message
            if is_first_message:
                if category:
                    update_ops["$set"]["category"] = category
                if conversation_score is not None:
                    update_ops["$set"]["score"] = conversation_score
            
            result = await self.conversations.update_one(
                {
                    "_id": ObjectId(conversation_id),
                    "user_id": ObjectId(user_id)
                },
                update_ops
            )
            
            # Record model scores in leaderboard
            if result.modified_count > 0 and stage3.get("aggregate_ranking"):
                await self.leaderboard_service.record_model_scores(
                    category=category,
                    aggregate_ranking=stage3["aggregate_ranking"]
                )
            
            return result.modified_count > 0
        except Exception:
            return False
    
    async def update_conversation_title(
        self,
        conversation_id: str,
        user_id: str,
        title: str
    ) -> bool:
        """
        Update the title of a conversation.
        
        Args:
            conversation_id: Conversation ID
            user_id: User ID (for ownership verification)
            title: New title
            
        Returns:
            True if updated, False otherwise
        """
        try:
            result = await self.conversations.update_one(
                {
                    "_id": ObjectId(conversation_id),
                    "user_id": ObjectId(user_id)
                },
                {
                    "$set": {
                        "title": title,
                        "updated_at": datetime.now(timezone.utc)
                    }
                }
            )
            return result.modified_count > 0
        except Exception:
            return False
    
    async def get_message_count(
        self,
        conversation_id: str,
        user_id: str
    ) -> int:
        """
        Get the number of messages in a conversation.
        
        Args:
            conversation_id: Conversation ID
            user_id: User ID (for ownership verification)
            
        Returns:
            Number of messages, or 0 if not found
        """
        conv = await self.get_conversation(conversation_id, user_id)
        if conv:
            return len(conv.messages)
        return 0
