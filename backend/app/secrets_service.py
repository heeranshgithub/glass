"""AWS Secrets Manager loader for runtime environment variables.

Uses boto3 (AWS SDK for Python) to call GetSecretValue — there is no stdlib HTTP
client that signs AWS requests; boto3 handles credentials and SigV4.
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass

import boto3
from botocore.exceptions import ClientError


logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class SecretConfig:
    """Maps one AWS secret id to one environment variable."""

    name: str
    env_key: str
    required: bool = True


class SecretsService:
    """Loads and applies secrets from AWS Secrets Manager."""

    def __init__(self) -> None:
        self.region = os.getenv("AWS_REGION", "ap-south-1")
        self.secrets_config: list[SecretConfig] = [
            SecretConfig(name="glass-backend/openrouter_api_key", env_key="OPENROUTER_API_KEY"),
            SecretConfig(name="glass-backend/encryption_key", env_key="ENCRYPTION_KEY"),
            SecretConfig(name="glass-backend/mongodb_uri", env_key="MONGODB_URL"),
            SecretConfig(name="glass-backend/jwt_secret_key", env_key="JWT_SECRET_KEY"),
            SecretConfig(name="glass-backend/waitlist_email", env_key="WAITLIST_EMAIL"),
            SecretConfig(name="glass-backend/waitlist_pass", env_key="WAITLIST_PASS"),
            SecretConfig(name="glass-backend/demo_email", env_key="DEMO_EMAIL"),
            SecretConfig(name="glass-backend/demo_pass", env_key="DEMO_PASS"),
            SecretConfig(name="glass-backend/admin_email", env_key="ADMIN_EMAIL"),
            SecretConfig(
                name="glass-backend/frontend_url",
                env_key="CORS_ORIGINS",
                required=False,
            ),
        ]

    @staticmethod
    def _is_enabled() -> bool:
        return (os.getenv("APP_ENV") or "").lower() == "production"

    def load_secrets(self) -> None:
        """Load all configured secrets into process environment variables."""
        if not self._is_enabled():
            logger.info("AWS secrets loading disabled (APP_ENV is not production)")
            return

        logger.info("Loading secrets from AWS Secrets Manager...")
        client = boto3.client("secretsmanager", region_name=self.region)

        for config in self.secrets_config:
            try:
                response = client.get_secret_value(SecretId=config.name)
            except ClientError as error:
                code = error.response.get("Error", {}).get("Code", "Unknown")
                if code == "ResourceNotFoundException":
                    if config.required:
                        raise RuntimeError(
                            f"Required secret not found: {config.name}"
                        ) from error
                    logger.warning("Optional secret not found: %s", config.name)
                    continue
                logger.error("Failed loading secret %s: %s", config.name, error)
                raise

            secret_value = response.get("SecretString")
            if not secret_value:
                raise RuntimeError(f"Secret {config.name} has no SecretString value")

            os.environ[config.env_key] = secret_value
            logger.info("Loaded secret into env var: %s", config.env_key)

        logger.info("Successfully loaded configured AWS secrets")


def load_aws_secrets() -> None:
    """Entry point used by app config initialization."""
    SecretsService().load_secrets()
