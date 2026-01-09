"""Conversation and Council API routes."""

import asyncio
import json

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorDatabase

from core.dependencies import get_db, get_current_active_user
from services.conversation_service import ConversationService
from services.council_service import CouncilService
from api.users import get_user_openrouter_key
from models.user import UserInDB
from schemas.conversation import (
    CreateConversationRequest,
    SendMessageRequest,
    ConversationResponse,
    ConversationMetadataResponse,
    ConversationListResponse,
)
from schemas.base import to_camel_dict

router = APIRouter()


@router.get("/health")
async def health_check():
    """
    Health check endpoint with council model information.
    
    This endpoint is public (no auth required).
    """
    council_info = CouncilService.get_council_info()
    response = {
        "status": "healthy",
        "service": "LLM Council API",
        **council_info
    }
    return to_camel_dict(response)


@router.get("/conversations", response_model=ConversationListResponse)
async def list_conversations(
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    List all conversations for the current user.
    
    Returns metadata only (not full message content).
    """
    conv_service = ConversationService(db)
    conversations = await conv_service.list_conversations(current_user.id)

    items = [
        ConversationMetadataResponse(
            id=conv.id,
            title=conv.title,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
            message_count=conv.message_count,
            category=conv.category,
            score=conv.score
        )
        for conv in conversations
    ]

    return ConversationListResponse(conversations=items, total=len(items))


@router.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    request: CreateConversationRequest,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Create a new conversation.
    """
    conv_service = ConversationService(db)
    
    title = request.title if request.title else "New Conversation"
    conversation = await conv_service.create_conversation(
        user_id=current_user.id,
        title=title
    )
    
    return ConversationResponse(
        id=conversation.id,
        user_id=conversation.user_id,
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        messages=[],
        category=conversation.category,
        score=conversation.score
    )


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get a specific conversation with all messages.
    
    Verifies that the conversation belongs to the current user.
    """
    conv_service = ConversationService(db)
    
    conversation = await conv_service.get_conversation(
        conversation_id=conversation_id,
        user_id=current_user.id
    )
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    return ConversationResponse(
        id=conversation.id,
        user_id=conversation.user_id,
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        messages=conversation.messages,
        category=conversation.category,
        score=conversation.score
    )


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Delete a conversation.
    
    Verifies that the conversation belongs to the current user.
    """
    conv_service = ConversationService(db)
    
    deleted = await conv_service.delete_conversation(
        conversation_id=conversation_id,
        user_id=current_user.id
    )
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    return None


@router.post("/conversations/{conversation_id}/messages")
async def send_message_stream(
    conversation_id: str,
    request: SendMessageRequest,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Send a message and stream the 3-stage council process.
    
    Returns Server-Sent Events as each stage completes.
    """
    conv_service = ConversationService(db)
    
    # Verify conversation exists and belongs to user
    conversation = await conv_service.get_conversation(
        conversation_id=conversation_id,
        user_id=current_user.id
    )
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Get user's OpenRouter API key
    try:
        api_key = await get_user_openrouter_key(current_user.id, db)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve API key: {str(e)}"
        )
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OpenRouter API key not configured. Please add your API key in settings."
        )
    
    is_first_message = len(conversation.messages) == 0
    
    async def event_generator():
        try:
            # Add user message
            await conv_service.add_user_message(
                conversation_id=conversation_id,
                user_id=current_user.id,
                content=request.content
            )
            
            # Start title generation in parallel
            title_task = None
            if is_first_message:
                title_task = asyncio.create_task(
                    CouncilService.generate_title(request.content, api_key)
                )
            
            # Run council stages
            stage1_results = None
            stage2_results = None
            stage3_result = None
            metadata = {}
            
            async for stage_name, data in CouncilService.run_council_staged(request.content, api_key):
                if stage_name == "stage1_start":
                    yield f"data: {json.dumps({'type': 'stage1Start'})}\n\n"
                
                elif stage_name == "stage1_complete":
                    stage1_results = data
                    yield f"data: {json.dumps({'type': 'stage1Complete', 'data': to_camel_dict(data)})}\n\n"
                
                elif stage_name == "stage2_start":
                    yield f"data: {json.dumps({'type': 'stage2Start'})}\n\n"
                
                elif stage_name == "stage2_complete":
                    stage2_results = data["data"]
                    metadata = data["metadata"]
                    yield f"data: {json.dumps({'type': 'stage2Complete', 'data': to_camel_dict(stage2_results), 'metadata': to_camel_dict(metadata)})}\n\n"
                
                elif stage_name == "stage3_start":
                    yield f"data: {json.dumps({'type': 'stage3Start'})}\n\n"
                
                elif stage_name == "stage3_complete":
                    stage3_result = data
                    yield f"data: {json.dumps({'type': 'stage3Complete', 'data': to_camel_dict(data)})}\n\n"
                
                elif stage_name == "error":
                    yield f"data: {json.dumps({'type': 'error', 'message': data})}\n\n"
                    return
            
            # Wait for title generation if started
            if title_task:
                title = await title_task
                await conv_service.update_conversation_title(
                    conversation_id=conversation_id,
                    user_id=current_user.id,
                    title=title
                )
                yield f"data: {json.dumps({'type': 'titleComplete', 'data': {'title': title}})}\n\n"
            
            # Save assistant message
            if stage1_results and stage3_result:
                await conv_service.add_assistant_message(
                    conversation_id=conversation_id,
                    user_id=current_user.id,
                    stage1=[item.model_dump() for item in stage1_results],
                    stage2=[item.model_dump() for item in (stage2_results or [])],
                    stage3=stage3_result.model_dump(),
                    user_content=request.content,
                    api_key=api_key
                )
            
            # Send completion event
            yield f"data: {json.dumps({'type': 'complete'})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )
