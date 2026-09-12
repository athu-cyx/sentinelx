import hashlib
from datetime import datetime, timezone

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import APIKeyHeader
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.api_key import APIKey


api_key_header = APIKeyHeader(
    name="X-API-Key",
    auto_error=False,
)


def verify_api_key(
    api_key: str | None = Security(api_key_header),
    db: Session = Depends(get_db),
) -> APIKey:
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key is required.",
        )

    key_hash = hashlib.sha256(
        api_key.encode("utf-8")
    ).hexdigest()

    integration = (
        db.query(APIKey)
        .filter(
            APIKey.key_hash == key_hash,
            APIKey.is_active.is_(True),
        )
        .first()
    )

    if not integration:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked API key.",
        )

    integration.last_used_at = datetime.now(timezone.utc)
    db.commit()

    return integration