import hashlib
import secrets

from app.models.api_key import APIKey


def generate_api_key() -> tuple[str, str, str]:
    """
    Generate a SentinelX API key.

    Returns:
        raw_key: Full API key shown to the user once.
        key_prefix: Short identifier used for display/logging.
        key_hash: SHA-256 hash stored in the database.
    """

    random_part = secrets.token_urlsafe(32)

    raw_key = f"sx_live_{random_part}"

    key_prefix = raw_key[:16]

    key_hash = hashlib.sha256(
        raw_key.encode("utf-8")
    ).hexdigest()

    return raw_key, key_prefix, key_hash


def create_api_key_record(
    name: str,
    organization_name: str,
) -> tuple[APIKey, str]:
    """
    Create an APIKey database record.

    The raw API key is NOT stored in the database.
    """

    raw_key, key_prefix, key_hash = generate_api_key()

    api_key = APIKey(
        name=name,
        key_prefix=key_prefix,
        key_hash=key_hash,
        organization_name=organization_name,
        is_active=True,
    )

    return api_key, raw_key