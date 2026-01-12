"""Council orchestration service."""

from typing import Dict, Any

from ai.council import (
    stage1_collect_responses,
    stage2_collect_rankings,
    stage3_synthesize_final,
    stage1_collect_responses_stream,
    stage2_collect_rankings_stream,
    stage3_synthesize_final_stream,
    calculate_aggregate_ranking,
    generate_conversation_title,
)
from ai.config import COUNCIL_MODELS, ARBITER_MODEL


class CouncilService:
    """Service for council orchestration."""
    
    @staticmethod
    async def run_council_staged(user_query: str, api_key: str):
        """
        Run the council process stage by stage (for streaming).
        
        Yields each stage as it completes.
        
        Args:
            user_query: The user's question
            api_key: OpenRouter API key
            
        Yields:
            Tuple of (stage_name, data) for each completed stage
        """
        # Stage 1: Collect responses
        yield ("stage1_start", None)
        stage1_results = await stage1_collect_responses(user_query, api_key)
        yield ("stage1_complete", stage1_results)
        
        if not stage1_results:
            yield ("error", "All models failed to respond")
            return
        
        # Stage 2: Collect rankings
        yield ("stage2_start", None)
        stage2_results, label_to_model = await stage2_collect_rankings(
            user_query, stage1_results, api_key
        )
        aggregate_ranking = calculate_aggregate_ranking(stage2_results, label_to_model)
        yield ("stage2_complete", {
            "data": stage2_results,
            "metadata": {
                "label_to_model": label_to_model,
                "aggregate_ranking": aggregate_ranking
            }
        })
        
        # Stage 3: Synthesize final answer
        yield ("stage3_start", None)
        stage3_result = await stage3_synthesize_final(
            user_query, stage1_results, stage2_results, api_key
        )
        # Persist/stream the council-wide aggregate ranking with the Stage 3 payload
        stage3_result = stage3_result.model_copy(update={"aggregate_ranking": aggregate_ranking})
        yield ("stage3_complete", stage3_result)
        
        # Complete
        yield ("complete", {
            "stage1": stage1_results,
            "stage2": stage2_results,
            "stage3": stage3_result,
            "metadata": {
                "label_to_model": label_to_model,
                "aggregate_ranking": aggregate_ranking
            }
        })
    
    @staticmethod
    async def run_council_staged_stream(user_query: str, api_key: str):
        """
        Run the council process stage by stage with real-time token streaming.
        
        Yields tokens as they arrive from models, providing a ChatGPT-like experience.
        
        Args:
            user_query: The user's question
            api_key: OpenRouter API key
            
        Yields:
            Tuple of (event_name, data) for each token and completed stage
        """
        # Stage 1: Collect responses with streaming
        yield ("stage1_start", None)
        
        stage1_results = None
        async for event_type, data in stage1_collect_responses_stream(user_query, api_key):
            if event_type == "token":
                # Yield token event: {"model": str, "token": str}
                yield ("stage1_token", data)
            elif event_type == "complete":
                # Stage 1 complete
                stage1_results = data
                yield ("stage1_complete", stage1_results)
        
        if not stage1_results:
            yield ("error", "All models failed to respond")
            return
        
        # Stage 2: Collect rankings with streaming
        yield ("stage2_start", None)
        
        stage2_results = None
        label_to_model = None
        async for event_type, data in stage2_collect_rankings_stream(
            user_query, stage1_results, api_key
        ):
            if event_type == "token":
                # Yield token event: {"model": str, "token": str}
                yield ("stage2_token", data)
            elif event_type == "complete":
                # Stage 2 complete
                stage2_results = data["rankings"]
                label_to_model = data["label_to_model"]
                
                # Calculate aggregate ranking
                aggregate_ranking = calculate_aggregate_ranking(stage2_results, label_to_model)
                
                yield ("stage2_complete", {
                    "data": stage2_results,
                    "metadata": {
                        "label_to_model": label_to_model,
                        "aggregate_ranking": aggregate_ranking
                    }
                })
        
        # Stage 3: Synthesize final answer with streaming
        yield ("stage3_start", None)
        
        stage3_result = None
        async for event_type, data in stage3_synthesize_final_stream(
            user_query, stage1_results, stage2_results, api_key
        ):
            if event_type == "token":
                # Yield token event: {"token": str}
                yield ("stage3_token", data)
            elif event_type == "complete":
                # Stage 3 complete
                stage3_result = data
                # Add aggregate ranking to stage3 result
                stage3_result = stage3_result.model_copy(update={"aggregate_ranking": aggregate_ranking})
                yield ("stage3_complete", stage3_result)
        
        # Complete
        yield ("complete", {
            "stage1": stage1_results,
            "stage2": stage2_results,
            "stage3": stage3_result,
            "metadata": {
                "label_to_model": label_to_model,
                "aggregate_ranking": aggregate_ranking
            }
        })
    
    @staticmethod
    async def generate_title(user_query: str, api_key: str) -> str:
        """
        Generate a title for a conversation.
        
        Args:
            user_query: The first user message
            api_key: OpenRouter API key
            
        Returns:
            Generated title
        """
        return await generate_conversation_title(user_query, api_key)
    
    @staticmethod
    def get_council_info() -> Dict[str, Any]:
        """
        Get information about the council configuration.
        
        Returns:
            Dict with council models and arbiter
        """
        return {
            "council_models": COUNCIL_MODELS,
            "arbiter_model": ARBITER_MODEL,
            "model_count": len(COUNCIL_MODELS)
        }
