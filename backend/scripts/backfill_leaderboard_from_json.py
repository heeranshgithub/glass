"""Script to backfill leaderboard_models collection from glass.conversations.json file."""

import asyncio
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional, Tuple, List

# Add parent directory to path to import modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from bson import ObjectId
from core.database import (
    connect_to_mongodb, 
    close_mongodb_connection, 
    get_database,
    CONVERSATIONS_COLLECTION,
    LEADERBOARD_MODELS_COLLECTION,
)
from services.leaderboard_service import LeaderboardService


def load_conversations_json(file_path: str) -> list:
    """Load conversations from JSON file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def convert_mongo_types(obj: Any) -> Any:
    """
    Convert MongoDB extended JSON types to Python/BSON types.
    Handles {"$oid": "..."} and {"$date": "..."} formats.
    """
    if isinstance(obj, dict):
        if "$oid" in obj and len(obj) == 1:
            return ObjectId(obj["$oid"])
        if "$date" in obj and len(obj) == 1:
            date_str = obj["$date"]
            # Handle ISO format with Z suffix
            if date_str.endswith("Z"):
                date_str = date_str[:-1] + "+00:00"
            return datetime.fromisoformat(date_str)
        return {k: convert_mongo_types(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_mongo_types(item) for item in obj]
    return obj


def extract_category_and_ranking(conv: Dict[str, Any]) -> Tuple[Optional[str], List[Dict]]:
    """
    Extract category and aggregate_ranking from a conversation.
    
    Returns:
        Tuple of (category, aggregate_ranking list)
    """
    messages = conv.get("messages", [])
    
    for message in messages:
        if message.get("role") != "assistant":
            continue
        
        category = message.get("category")
        stage3 = message.get("stage3", {})
        aggregate_ranking = stage3.get("aggregate_ranking", [])
        
        if aggregate_ranking:
            return category, aggregate_ranking
    
    return None, []


async def backfill_from_json(json_file_path: str):
    """
    Backfill conversations and leaderboard from JSON file.
    
    Args:
        json_file_path: Path to the conversations JSON file
    """
    await connect_to_mongodb()
    db = get_database()
    
    try:
        print(f"Loading conversations from {json_file_path}...")
        conversations = load_conversations_json(json_file_path)
        print(f"Loaded {len(conversations)} conversations")
        
        conversations_coll = db[CONVERSATIONS_COLLECTION]
        leaderboard_coll = db[LEADERBOARD_MODELS_COLLECTION]
        leaderboard_service = LeaderboardService(db)
        
        # Clear existing leaderboard data
        print("Clearing existing leaderboard data...")
        await leaderboard_coll.delete_many({})
        
        upserted = 0
        rankings_processed = 0
        
        for conv in conversations:
            try:
                # Convert MongoDB types
                conv_doc = convert_mongo_types(conv)
                
                # Extract _id for upsert
                conv_id = conv_doc.get("_id")
                if not conv_id:
                    continue
                
                # Extract category and score for conversation-level fields
                category, aggregate_ranking = extract_category_and_ranking(conv)
                
                # Add category and score to conversation document
                if category:
                    conv_doc["category"] = category
                if aggregate_ranking:
                    # Use highest score as conversation score
                    scores = [r.get("score", 0) for r in aggregate_ranking if r.get("score")]
                    if scores:
                        conv_doc["score"] = max(scores)
                
                # Upsert conversation
                await conversations_coll.replace_one(
                    {"_id": conv_id},
                    conv_doc,
                    upsert=True
                )
                upserted += 1
                
                # Record model scores in leaderboard
                if aggregate_ranking:
                    await leaderboard_service.record_model_scores(category, aggregate_ranking)
                    rankings_processed += 1
                    
            except Exception as e:
                print(f"Error processing conversation: {e}")
        
        # Get final counts
        model_entries = await leaderboard_coll.count_documents({})
        
        print("\n" + "="*50)
        print("Backfill Summary:")
        print(f"  Total conversations: {len(conversations)}")
        print(f"  Upserted conversations: {upserted}")
        print(f"  Rankings processed: {rankings_processed}")
        print(f"  Model leaderboard entries: {model_entries}")
        print("="*50)
        
    finally:
        await close_mongodb_connection()


async def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Backfill leaderboard from glass.conversations.json"
    )
    parser.add_argument(
        "--json-file",
        type=str,
        default="glass.conversations.json",
        help="Path to the conversations JSON file"
    )
    
    args = parser.parse_args()
    
    # Resolve file path
    backend_dir = Path(__file__).parent.parent
    json_path = backend_dir / args.json_file
    
    if not json_path.exists():
        print(f"Error: JSON file not found at {json_path}")
        sys.exit(1)
    
    await backfill_from_json(str(json_path))


if __name__ == "__main__":
    asyncio.run(main())
