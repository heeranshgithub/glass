"""Base schema with camelCase serialization for API responses."""

from typing import Any
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


# Base config for camelCase serialization
CAMEL_CONFIG = ConfigDict(
    alias_generator=to_camel,
    populate_by_name=True,  # Accept both snake_case and camelCase in requests
    from_attributes=True,   # Allow creating from ORM/dict objects with attributes
)


def camel_config(**kwargs: Any) -> ConfigDict:
    """
    Create a model_config with camelCase settings and custom overrides.
    
    Usage:
        class MySchema(CamelSchema):
            user_id: str
            
            model_config = camel_config(
                json_schema_extra={"example": {"userId": "123"}}
            )
    """
    return ConfigDict(**{**CAMEL_CONFIG, **kwargs})


class CamelSchema(BaseModel):
    """
    Base schema that automatically converts snake_case fields to camelCase.
    
    - All field names in Python code remain snake_case (Pythonic)
    - API requests can send camelCase OR snake_case (flexible input)
    - API responses always use camelCase (frontend convention)
    
    Usage:
        class MySchema(CamelSchema):
            user_id: str
            created_at: datetime
        
        # Serializes to: {"userId": "...", "createdAt": "..."}
    """
    
    model_config = CAMEL_CONFIG


def to_camel_dict(data: Any) -> Any:
    """
    Recursively convert all dictionary keys from snake_case to camelCase.
    
    Useful for converting raw dicts or Pydantic models before JSON serialization (e.g., SSE streams).
    
    Args:
        data: Any data structure (dict, list, Pydantic model, or primitive)
        
    Returns:
        Same structure with all dict keys converted to camelCase
    """
    # Handle Pydantic models
    if isinstance(data, BaseModel):
        # Dump with field names (snake_case), then convert to camelCase
        return to_camel_dict(data.model_dump(mode='json'))
    
    if isinstance(data, dict):
        return {to_camel(k): to_camel_dict(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [to_camel_dict(item) for item in data]
    else:
        return data

