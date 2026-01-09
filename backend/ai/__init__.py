"""AI layer for Glass Backend - OpenRouter and Council orchestration."""

from ai.config import COUNCIL_MODELS, ARBITER_MODEL, OPENROUTER_API_URL
from ai.openrouter import query_model, query_models_parallel
from ai.council import (
    stage1_collect_responses,
    stage2_collect_rankings,
    stage3_synthesize_final,
    parse_ranking_from_text,
    calculate_aggregate_ranking,
    categorize_user_prompt,
    generate_conversation_title,
)

__all__ = [
    # Config
    "COUNCIL_MODELS",
    "ARBITER_MODEL",
    "OPENROUTER_API_URL",
    # OpenRouter
    "query_model",
    "query_models_parallel",
    # Council
    "stage1_collect_responses",
    "stage2_collect_rankings",
    "stage3_synthesize_final",
    "parse_ranking_from_text",
    "calculate_aggregate_ranking",
    "categorize_user_prompt",
    "generate_conversation_title",
]
