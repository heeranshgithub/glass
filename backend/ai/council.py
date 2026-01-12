"""3-stage LLM Council orchestration."""

import re
from collections import defaultdict
from typing import List, Dict, Any, Tuple, Optional, AsyncGenerator

from ai.openrouter import query_models_parallel, query_model, query_models_parallel_stream, query_model_stream
from ai.config import COUNCIL_MODELS, ARBITER_MODEL, TITLE_MODEL
from schemas.conversation import (
    ModelResponseSchema,
    ModelRankingSchema,
    Stage3ResultSchema,
    AggregateRankingSchema,
)


async def stage1_collect_responses(user_query: str, api_key: str) -> List[ModelResponseSchema]:
    """
    Stage 1: Collect individual responses from all council models.

    Args:
        user_query: The user's question
        api_key: OpenRouter API key

    Returns:
        List of dicts with 'model' and 'response' keys
    """
    messages = [{"role": "user", "content": user_query}]

    # Query all models in parallel
    responses = await query_models_parallel(COUNCIL_MODELS, messages, api_key)

    # Format results
    stage1_results = []
    for model, response in responses.items():
        if response is not None:  # Only include successful responses
            stage1_results.append(
                ModelResponseSchema(
                    model=model,
                    response=response.get('content', '')
                )
            )

    return stage1_results


async def stage2_collect_rankings(
    user_query: str,
    stage1_results: List[ModelResponseSchema],
    api_key: str
) -> Tuple[List[ModelRankingSchema], Dict[str, str]]:
    """
    Stage 2: Each model ranks the anonymized responses.

    Args:
        user_query: The original user query
        stage1_results: Results from Stage 1
        api_key: OpenRouter API key

    Returns:
        Tuple of (rankings list, label_to_model mapping)
    """
    # Create anonymized labels for responses (Response A, Response B, etc.)
    labels = [chr(65 + i) for i in range(len(stage1_results))]  # A, B, C, ...

    # Create mapping from label to model name
    label_to_model = {
        f"Response {label}": result.model
        for label, result in zip(labels, stage1_results)
    }

    # Build the ranking prompt
    responses_text = "\n\n".join([
        f"Response {label}:\n{result.response}"
        for label, result in zip(labels, stage1_results)
    ])

    ranking_prompt = f"""Your task is to assess multiple responses to this question:
Question: {user_query}
Below are the model responses (identities hidden):
{responses_text}
What you need to do:

1. Begin by analyzing each response on its own merits. For every response, identify its strengths and weaknesses.
2. After completing your analysis, conclude with a definitive ranking.

CRITICAL: The final ranking must follow this EXACT format:

- Begin with "FINAL RANKING:" (capitalized, followed by a colon)
- List responses in order from best to worst using a numbered format
- Format each entry as: number, period, space, response label only (e.g., "1. Response A")
- Include nothing else—no additional commentary or explanations in this ranking section

Here's how your complete response should look:
Response A demonstrates strong coverage of X, though it overlooks Y...
Response B maintains accuracy but doesn't fully explore Z...
Response C delivers the most thorough treatment of the topic...
FINAL RANKING:
1. Response C
2. Response A
3. Response B

Please proceed with your evaluation and ranking:"""

    messages = [{"role": "user", "content": ranking_prompt}]

    # Get rankings from all council models in parallel
    responses = await query_models_parallel(COUNCIL_MODELS, messages, api_key)

    # Format results
    stage2_results = []
    for model, response in responses.items():
        if response is not None:
            full_text = response.get('content', '')
            # Parse as anonymous labels first ("Response A", ...), then map to model names
            parsed_labels = parse_ranking_from_text(full_text)
            parsed_model_ranking = [
                label_to_model[label]
                for label in parsed_labels
                if label in label_to_model
            ]
            stage2_results.append(
                ModelRankingSchema(
                    model=model,
                    ranking=full_text,
                    parsed_ranking=parsed_model_ranking
                )
            )

    return stage2_results, label_to_model


async def stage3_synthesize_final(
    user_query: str,
    stage1_results: List[ModelResponseSchema],
    stage2_results: List[ModelRankingSchema],
    api_key: str
) -> Stage3ResultSchema:
    """
    Stage 3: Arbiter synthesizes final response.

    Args:
        user_query: The original user query
        stage1_results: Individual model responses from Stage 1
        stage2_results: Rankings from Stage 2
        api_key: OpenRouter API key

    Returns:
        Dict with 'model' and 'response' keys
    """
    # Build comprehensive context for arbiter
    stage1_text = "\n\n".join([
        f"Model: {result.model}\nResponse: {result.response}"
        for result in stage1_results
    ])

    stage2_text = "\n\n".join([
        f"Model: {result.model}\nRanking: {result.ranking}"
        for result in stage2_results
    ])

    arbiter_prompt = f"""You serve as the Lead Arbiter of an LLM Council. Several language models have submitted answers to a user's inquiry, followed by evaluating one another's contributions.

User's Original Inquiry: {user_query}

PHASE 1 - Model Submissions:
{stage1_text}

PHASE 2 - Cross-Model Assessments:
{stage2_text}

As Lead Arbiter, your responsibility is to consolidate this information into one thorough, precise response to the user's initial question. Take into account:
- Each model's submission and the insights they offer
- The cross-evaluations and their implications for answer quality
- Any observable consensus or divergence among assessments

Deliver a lucid, logically sound final response that embodies the council's combined expertise:"""

    messages = [{"role": "user", "content": arbiter_prompt}]

    # Query the arbiter model
    response = await query_model(ARBITER_MODEL, messages, api_key)

    if response is None:
        # Fallback if arbiter fails
        return Stage3ResultSchema(
            model=ARBITER_MODEL,
            response="Error: Unable to generate final synthesis.",
            aggregate_ranking=[]
        )

    return Stage3ResultSchema(
        model=ARBITER_MODEL,
        response=response.get('content', ''),
        aggregate_ranking=[]
    )


def parse_ranking_from_text(ranking_text: str) -> List[str]:
    """
    Parse the FINAL RANKING section from the model's response.

    Args:
        ranking_text: The full text response from the model

    Returns:
        List of response labels in ranked order
    """
    # Look for "FINAL RANKING:" section
    if "FINAL RANKING:" in ranking_text:
        # Extract everything after "FINAL RANKING:"
        parts = ranking_text.split("FINAL RANKING:")
        if len(parts) >= 2:
            ranking_section = parts[1]
            # Try to extract numbered list format (e.g., "1. Response A")
            # This pattern looks for: number, period, optional space, "Response X"
            numbered_matches = re.findall(r'\d+\.\s*Response [A-Z]', ranking_section)
            if numbered_matches:
                # Extract just the "Response X" part
                return [re.search(r'Response [A-Z]', m).group() for m in numbered_matches]

            # Fallback: Extract all "Response X" patterns in order
            matches = re.findall(r'Response [A-Z]', ranking_section)
            return matches

    # Fallback: try to find any "Response X" patterns in order
    matches = re.findall(r'Response [A-Z]', ranking_text)
    return matches


def calculate_aggregate_ranking(
    stage2_results: List[ModelRankingSchema],
    label_to_model: Dict[str, str]
) -> List[AggregateRankingSchema]:
    """
    Calculate aggregate rankings across all models.

    Args:
        stage2_results: Rankings from each model
        label_to_model: Mapping from anonymous labels to model names

    Returns:
        List of dicts with model name and average rank, sorted best to worst
    """
    # Track positions for each model
    model_positions = defaultdict(list)

    # Determine model count for normalization. Prefer the stage1-derived mapping.
    # (This is the set of models that were actually ranked.)
    unique_models = {m for m in label_to_model.values() if m}
    n_models = len(unique_models) if unique_models else 1

    for ranking in stage2_results:
        # Prefer the already-parsed ranking if present (expected to be model names).
        parsed = ranking.parsed_ranking
        if not parsed:
            parsed = parse_ranking_from_text(ranking.ranking)

        for position, item in enumerate(parsed, start=1):
            # Backward-compatible: if item is "Response X", map via label_to_model.
            model_name = label_to_model.get(item, item)
            if model_name:
                model_positions[model_name].append(position)

    # Calculate average position for each model
    aggregate = []
    for model, positions in model_positions.items():
        if positions:
            avg_rank = sum(positions) / len(positions)

            # Convert average rank (lower is better) into a normalized score (higher is better).
            # score ∈ [0, 100]. Best possible avg_rank=1 => 100, worst avg_rank=N => 0.
            if n_models <= 1:
                norm = 1.0
            else:
                norm = 1.0 - (avg_rank - 1.0) / (n_models - 1.0)
                norm = max(0.0, min(1.0, norm))
            score = round(norm * 100.0, 1)

            aggregate.append(
                AggregateRankingSchema(
                    model=model,
                    average_rank=round(avg_rank, 2),
                    rankings_count=len(positions),
                    score=score,
                )
            )

    # Sort by average rank (lower is better)
    aggregate.sort(key=lambda x: x.average_rank)

    return aggregate


async def categorize_user_prompt(user_query: str, api_key: str) -> Optional[str]:
    """
    Categorize a user prompt into one of the predefined categories.

    Args:
        user_query: The user's message/prompt
        api_key: OpenRouter API key

    Returns:
        Category name if successful, None if categorization fails
    """
    categories = [
        "Business & Economics",
        "Health & Psychology",
        "Philosophy & Growth",
        "Creativity & Language"
    ]

    category_prompt = f"""You are a categorization assistant. Analyze the following user query and categorize it into exactly ONE of these categories:

1. Business & Economics - Topics related to business, finance, economics, entrepreneurship, markets, investments, career advice, workplace issues
2. Health & Psychology - Topics related to physical health, mental health, psychology, wellness, medical advice, therapy, self-care
3. Philosophy & Growth - Topics related to philosophy, personal development, self-improvement, life advice, ethics, meaning, purpose, clarity of thought
4. Creativity & Language - Topics related to art, writing, language, creativity, design, storytelling, communication, expression

User Query: {user_query}

Respond with ONLY the exact category name from the list above (e.g., "Business & Economics"). Do not include any explanation or additional text."""

    messages = [{"role": "user", "content": category_prompt}]

    # Use gemini-2.5-pro for categorization
    response = await query_model("google/gemini-2.5-pro", messages, api_key, timeout=30.0)

    if response is None:
        return None

    category = response.get('content', '').strip()

    # Clean up the response - remove quotes, extra whitespace
    category = category.strip('"\' \n\t')

    # Validate that the response matches one of our categories
    if category in categories:
        return category

    # If the response doesn't match exactly, try to find a partial match
    category_lower = category.lower()
    for valid_category in categories:
        if valid_category.lower() in category_lower or category_lower in valid_category.lower():
            return valid_category

    # If no match found, return None
    return None


async def generate_conversation_title(user_query: str, api_key: str) -> str:
    """
    Generate a short title for a conversation based on the first user message.

    Args:
        user_query: The first user message
        api_key: OpenRouter API key

    Returns:
        A short title (3-5 words)
    """
    title_prompt = f"""Create a brief title (maximum 3-5 words) that captures the essence of this question.
Keep it compact and informative. Avoid using quotes or punctuation marks in your title.

Question: {user_query}

Title:"""

    messages = [{"role": "user", "content": title_prompt}]

    # Use gemini-2.5-flash for title generation (fast and cheap)
    response = await query_model(TITLE_MODEL, messages, api_key, timeout=30.0)

    if response is None:
        # Fallback to a generic title
        return "New Conversation"

    title = response.get('content', 'New Conversation').strip()

    # Clean up the title - remove quotes, limit length
    title = title.strip('"\'')

    # Truncate if too long
    if len(title) > 50:
        title = title[:47] + "..."

    return title


# ============================================================================
# STREAMING VERSIONS OF STAGE FUNCTIONS
# ============================================================================

async def stage1_collect_responses_stream(
    user_query: str, 
    api_key: str
) -> AsyncGenerator[Tuple[str, Dict[str, Any]], None]:
    """
    Stage 1: Collect individual responses from all council models with streaming.

    Args:
        user_query: The user's question
        api_key: OpenRouter API key

    Yields:
        Tuple of ("token", {"model": str, "token": str}) for each token
        Tuple of ("complete", List[ModelResponseSchema]) when all models finish
    """
    messages = [{"role": "user", "content": user_query}]
    
    # Track accumulated responses for each model
    model_responses: Dict[str, str] = {model: "" for model in COUNCIL_MODELS}
    
    # Stream from all models in parallel
    async for chunk in query_models_parallel_stream(COUNCIL_MODELS, messages, api_key):
        model = chunk["model"]
        token = chunk["token"]
        done = chunk.get("done", False)
        
        if token:
            # Accumulate the token
            model_responses[model] += token
            # Yield the token
            yield ("token", {"model": model, "token": token})
        
        if done and "error" in chunk:
            print(f"Model {model} failed: {chunk['error']}")
    
    # Build final results
    stage1_results = []
    for model, response in model_responses.items():
        if response:  # Only include models that produced responses
            stage1_results.append(
                ModelResponseSchema(
                    model=model,
                    response=response
                )
            )
    
    # Yield complete results
    yield ("complete", stage1_results)


async def stage2_collect_rankings_stream(
    user_query: str,
    stage1_results: List[ModelResponseSchema],
    api_key: str
) -> AsyncGenerator[Tuple[str, Any], None]:
    """
    Stage 2: Each model ranks the anonymized responses with streaming.

    Args:
        user_query: The original user query
        stage1_results: Results from Stage 1
        api_key: OpenRouter API key

    Yields:
        Tuple of ("token", {"model": str, "token": str}) for each token
        Tuple of ("complete", {"rankings": List[ModelRankingSchema], "label_to_model": Dict}) when done
    """
    # Create anonymized labels for responses (Response A, Response B, etc.)
    labels = [chr(65 + i) for i in range(len(stage1_results))]  # A, B, C, ...

    # Create mapping from label to model name
    label_to_model = {
        f"Response {label}": result.model
        for label, result in zip(labels, stage1_results)
    }

    # Build the ranking prompt
    responses_text = "\n\n".join([
        f"Response {label}:\n{result.response}"
        for label, result in zip(labels, stage1_results)
    ])

    ranking_prompt = f"""Your task is to assess multiple responses to this question:
Question: {user_query}
Below are the model responses (identities hidden):
{responses_text}
What you need to do:

1. Begin by analyzing each response on its own merits. For every response, identify its strengths and weaknesses.
2. After completing your analysis, conclude with a definitive ranking.

CRITICAL: The final ranking must follow this EXACT format:

- Begin with "FINAL RANKING:" (capitalized, followed by a colon)
- List responses in order from best to worst using a numbered format
- Format each entry as: number, period, space, response label only (e.g., "1. Response A")
- Include nothing else—no additional commentary or explanations in this ranking section

Here's how your complete response should look:
Response A demonstrates strong coverage of X, though it overlooks Y...
Response B maintains accuracy but doesn't fully explore Z...
Response C delivers the most thorough treatment of the topic...
FINAL RANKING:
1. Response C
2. Response A
3. Response B

Please proceed with your evaluation and ranking:"""

    messages = [{"role": "user", "content": ranking_prompt}]
    
    # Track accumulated rankings for each model
    model_rankings: Dict[str, str] = {model: "" for model in COUNCIL_MODELS}
    
    # Stream from all models in parallel
    async for chunk in query_models_parallel_stream(COUNCIL_MODELS, messages, api_key):
        model = chunk["model"]
        token = chunk["token"]
        done = chunk.get("done", False)
        
        if token:
            # Accumulate the token
            model_rankings[model] += token
            # Yield the token
            yield ("token", {"model": model, "token": token})
        
        if done and "error" in chunk:
            print(f"Model {model} failed ranking: {chunk['error']}")
    
    # Build final results
    stage2_results = []
    for model, full_text in model_rankings.items():
        if full_text:
            # Parse as anonymous labels first, then map to model names
            parsed_labels = parse_ranking_from_text(full_text)
            parsed_model_ranking = [
                label_to_model[label]
                for label in parsed_labels
                if label in label_to_model
            ]
            stage2_results.append(
                ModelRankingSchema(
                    model=model,
                    ranking=full_text,
                    parsed_ranking=parsed_model_ranking
                )
            )
    
    # Yield complete results
    yield ("complete", {
        "rankings": stage2_results,
        "label_to_model": label_to_model
    })


async def stage3_synthesize_final_stream(
    user_query: str,
    stage1_results: List[ModelResponseSchema],
    stage2_results: List[ModelRankingSchema],
    api_key: str
) -> AsyncGenerator[Tuple[str, Any], None]:
    """
    Stage 3: Arbiter synthesizes final response with streaming.

    Args:
        user_query: The original user query
        stage1_results: Individual model responses from Stage 1
        stage2_results: Rankings from Stage 2
        api_key: OpenRouter API key

    Yields:
        Tuple of ("token", {"token": str}) for each token
        Tuple of ("complete", Stage3ResultSchema) when done
    """
    # Build comprehensive context for arbiter
    stage1_text = "\n\n".join([
        f"Model: {result.model}\nResponse: {result.response}"
        for result in stage1_results
    ])

    stage2_text = "\n\n".join([
        f"Model: {result.model}\nRanking: {result.ranking}"
        for result in stage2_results
    ])

    arbiter_prompt = f"""You serve as the Lead Arbiter of an LLM Council. Several language models have submitted answers to a user's inquiry, followed by evaluating one another's contributions.

User's Original Inquiry: {user_query}

PHASE 1 - Model Submissions:
{stage1_text}

PHASE 2 - Cross-Model Assessments:
{stage2_text}

As Lead Arbiter, your responsibility is to consolidate this information into one thorough, precise response to the user's initial question. Take into account:
- Each model's submission and the insights they offer
- The cross-evaluations and their implications for answer quality
- Any observable consensus or divergence among assessments

Deliver a lucid, logically sound final response that embodies the council's combined expertise:"""

    messages = [{"role": "user", "content": arbiter_prompt}]
    
    # Track accumulated response
    full_response = ""
    
    # Stream from arbiter model
    async for chunk in query_model_stream(ARBITER_MODEL, messages, api_key):
        token = chunk["token"]
        done = chunk.get("done", False)
        
        if token:
            # Accumulate the token
            full_response += token
            # Yield the token
            yield ("token", {"token": token})
        
        if done and "error" in chunk:
            print(f"Arbiter model failed: {chunk['error']}")
            # Yield error result
            yield ("complete", Stage3ResultSchema(
                model=ARBITER_MODEL,
                response="Error: Unable to generate final synthesis.",
                aggregate_ranking=[]
            ))
            return
    
    # Yield complete result
    yield ("complete", Stage3ResultSchema(
        model=ARBITER_MODEL,
        response=full_response if full_response else "Error: No response generated.",
        aggregate_ranking=[]
    ))
