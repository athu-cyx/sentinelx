from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.auth import require_role
from app.core.database import get_db
from app.models.api_key import APIKey
from app.services.api_key_service import create_api_key_record


router = APIRouter(
    prefix="/api/integrations",
    tags=["Integrations"],
)


class CreateAPIKeyRequest(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    organization_name: str = Field(
        ...,
        min_length=2,
        max_length=150,
    )


@router.post("/api-keys")
def create_api_key(
    request: CreateAPIKeyRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_role("admin")
    ),
):
    api_key_record, raw_api_key = create_api_key_record(
        name=request.name.strip(),
        organization_name=request.organization_name.strip(),
    )

    db.add(api_key_record)
    db.commit()
    db.refresh(api_key_record)

    return {
        "success": True,
        "message": (
            "API key created successfully. "
            "Store this key securely because it will "
            "not be shown again."
        ),
        "api_key": raw_api_key,
        "key_prefix": api_key_record.key_prefix,
        "name": api_key_record.name,
        "organization_name": api_key_record.organization_name,
        "created_at": api_key_record.created_at,
    }


@router.get("/api-keys")
def list_api_keys(
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_role("admin")
    ),
):
    api_keys = (
        db.query(APIKey)
        .order_by(APIKey.created_at.desc())
        .all()
    )

    return {
        "count": len(api_keys),
        "api_keys": [
            {
                "id": item.id,
                "name": item.name,
                "key_prefix": item.key_prefix,
                "organization_name": item.organization_name,
                "is_active": item.is_active,
                "created_at": item.created_at,
                "last_used_at": item.last_used_at,
            }
            for item in api_keys
        ],
    }


@router.patch("/api-keys/{api_key_id}/revoke")
def revoke_api_key(
    api_key_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_role("admin")
    ),
):
    api_key = (
        db.query(APIKey)
        .filter(APIKey.id == api_key_id)
        .first()
    )

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found.",
        )

    if not api_key.is_active:
        return {
            "success": True,
            "message": "API key is already revoked.",
            "api_key_id": api_key.id,
        }

    api_key.is_active = False

    db.commit()
    db.refresh(api_key)

    return {
        "success": True,
        "message": "API key revoked successfully.",
        "api_key_id": api_key.id,
        "is_active": api_key.is_active,
    }