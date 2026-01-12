"""OpenRouter API client for making LLM requests."""

import asyncio
import json
import httpx
from typing import List, Dict, Any, Optional, AsyncGenerator

from ai.config import OPENROUTER_API_URL


async def query_model(
    model: str,
    messages: List[Dict[str, str]],
    api_key: str,
    timeout: float = 120.0
) -> Optional[Dict[str, Any]]:
    """
    Query a single model via OpenRouter API.

    Args:
        model: OpenRouter model identifier (e.g., "openai/gpt-4o")
        messages: List of message dicts with 'role' and 'content'
        api_key: OpenRouter API key (required)
        timeout: Request timeout in seconds

    Returns:
        Response dict with 'content' and optional 'reasoning_details', or None if failed
    """
    if not api_key:
        raise ValueError("OpenRouter API key is required")
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": model,
        "messages": messages,
    }

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                OPENROUTER_API_URL,
                headers=headers,
                json=payload
            )
            response.raise_for_status()

            data = response.json()
            print(f"Response from {model}: received")
            message = data['choices'][0]['message']

            return {
                'content': message.get('content'),
                'reasoning_details': message.get('reasoning_details')
            }

    except Exception as e:
        print(f"Error querying model {model}: {e}")
        return None


async def query_models_parallel(
    models: List[str],
    messages: List[Dict[str, str]],
    api_key: str
) -> Dict[str, Optional[Dict[str, Any]]]:
    """
    Query multiple models in parallel.

    Args:
        models: List of OpenRouter model identifiers
        messages: List of message dicts to send to each model
        api_key: OpenRouter API key (required)

    Returns:
        Dict mapping model identifier to response dict (or None if failed)
    """
    # Create tasks for all models
    tasks = [query_model(model, messages, api_key) for model in models]

    # Wait for all to complete
    responses = await asyncio.gather(*tasks)

    # Map models to their responses
    return {model: response for model, response in zip(models, responses)}


async def query_model_stream(
    model: str,
    messages: List[Dict[str, str]],
    api_key: str,
    timeout: float = 120.0
) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Query a single model via OpenRouter API with streaming.

    Args:
        model: OpenRouter model identifier (e.g., "openai/gpt-4o")
        messages: List of message dicts with 'role' and 'content'
        api_key: OpenRouter API key (required)
        timeout: Request timeout in seconds

    Yields:
        Dict with 'model', 'token', and 'done' keys
    """
    if not api_key:
        raise ValueError("OpenRouter API key is required")
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": model,
        "messages": messages,
        "stream": True,
    }

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            async with client.stream(
                "POST",
                OPENROUTER_API_URL,
                headers=headers,
                json=payload
            ) as response:
                response.raise_for_status()
                
                async for line in response.aiter_lines():
                    # Skip empty lines
                    if not line.strip():
                        continue
                    
                    # Skip lines that don't start with "data: "
                    if not line.startswith("data: "):
                        continue
                    
                    # Extract the JSON data
                    data_str = line[6:]  # Remove "data: " prefix
                    
                    # Handle [DONE] signal
                    if data_str.strip() == "[DONE]":
                        yield {
                            "model": model,
                            "token": "",
                            "done": True
                        }
                        break
                    
                    try:
                        data = json.loads(data_str)
                        
                        # Extract token from delta
                        if "choices" in data and len(data["choices"]) > 0:
                            delta = data["choices"][0].get("delta", {})
                            content = delta.get("content", "")
                            
                            if content:
                                yield {
                                    "model": model,
                                    "token": content,
                                    "done": False
                                }
                    except json.JSONDecodeError:
                        # Skip malformed JSON
                        continue

    except Exception as e:
        print(f"Error streaming from model {model}: {e}")
        yield {
            "model": model,
            "token": "",
            "done": True,
            "error": str(e)
        }


async def query_models_parallel_stream(
    models: List[str],
    messages: List[Dict[str, str]],
    api_key: str
) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Query multiple models in parallel with streaming.

    Args:
        models: List of OpenRouter model identifiers
        messages: List of message dicts to send to each model
        api_key: OpenRouter API key (required)

    Yields:
        Dict with 'model', 'token', and 'done' keys from whichever model produces next
    """
    # Create a queue to collect tokens from all models
    queue = asyncio.Queue()
    
    # Track active models
    active_models = set(models)
    
    async def stream_model(model: str):
        """Stream a single model and put tokens in queue."""
        try:
            async for chunk in query_model_stream(model, messages, api_key):
                await queue.put(chunk)
                
                if chunk.get("done"):
                    active_models.discard(model)
        except Exception as e:
            print(f"Error in parallel stream for {model}: {e}")
            await queue.put({
                "model": model,
                "token": "",
                "done": True,
                "error": str(e)
            })
            active_models.discard(model)
    
    # Start all streaming tasks
    tasks = [asyncio.create_task(stream_model(model)) for model in models]
    
    # Yield tokens as they arrive from any model
    try:
        while active_models:
            # Wait for next token with timeout
            try:
                chunk = await asyncio.wait_for(queue.get(), timeout=1.0)
                yield chunk
            except asyncio.TimeoutError:
                # Check if all tasks are done
                if all(task.done() for task in tasks):
                    break
                continue
        
        # Drain any remaining items in queue
        while not queue.empty():
            try:
                chunk = queue.get_nowait()
                yield chunk
            except asyncio.QueueEmpty:
                break
    
    finally:
        # Ensure all tasks are cancelled if we exit early
        for task in tasks:
            if not task.done():
                task.cancel()
        
        # Wait for all tasks to complete
        await asyncio.gather(*tasks, return_exceptions=True)
