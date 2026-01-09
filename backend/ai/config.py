"""AI-specific configuration for the LLM Council."""

# Council members - list of OpenRouter model identifiers
COUNCIL_MODELS = [
    "openai/gpt-5.1",
    "google/gemini-3-pro-preview",
    "anthropic/claude-sonnet-4.5",
    "x-ai/grok-4",
]

# Arbiter model - synthesizes final response
ARBITER_MODEL = "openai/gpt-5.1"

# OpenRouter API endpoint
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Model for title generation (fast and cheap)
TITLE_MODEL = "google/gemini-2.5-flash"
