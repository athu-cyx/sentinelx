from datetime import datetime
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import require_super_admin
from app.core.database import get_db
from app.models.organization import Organization


router = APIRouter(
    prefix="/api/organizations",
    tags=["Organizations"],
)


# ============================================================
# REQUEST SCHEMAS
# ============================================================

class OrganizationCreate(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=150,
    )


class OrganizationUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    is_active: bool | None = None


# ============================================================
# CREATE ORGANIZATION
# ============================================================

@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
)
def create_organization(
    data: OrganizationCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_super_admin),
):

    name = data.name.strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Organization name cannot be empty",
        )

    existing = (
        db.query(Organization)
        .filter(Organization.name == name)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Organization already exists",
        )

    organization = Organization(
        name=name,
        is_active=True,
    )

    db.add(organization)
    db.commit()
    db.refresh(organization)

    return {
        "success": True,
        "message": "Organization created successfully",
        "organization": {
            "id": organization.id,
            "name": organization.name,
            "is_active": organization.is_active,
            "created_at": organization.created_at,
        },
    }


# ============================================================
# LIST ORGANIZATIONS
# ============================================================

@router.get("/")
def get_organizations(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_super_admin),
):

    organizations = (
        db.query(Organization)
        .order_by(Organization.created_at.desc())
        .all()
    )

    return {
        "success": True,
        "count": len(organizations),
        "organizations": [
            {
                "id": organization.id,
                "name": organization.name,
                "is_active": organization.is_active,
                "created_at": organization.created_at,
            }
            for organization in organizations
        ],
    }


# ============================================================
# GET SINGLE ORGANIZATION
# ============================================================

@router.get("/{organization_id}")
def get_organization(
    organization_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_super_admin),
):

    organization = (
        db.query(Organization)
        .filter(Organization.id == organization_id)
        .first()
    )

    if not organization:
        raise HTTPException(
            status_code=404,
            detail="Organization not found",
        )

    return {
        "success": True,
        "organization": {
            "id": organization.id,
            "name": organization.name,
            "is_active": organization.is_active,
            "created_at": organization.created_at,
        },
    }


# ============================================================
# UPDATE ORGANIZATION
# ============================================================

@router.patch("/{organization_id}")
def update_organization(
    organization_id: str,
    data: OrganizationUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_super_admin),
):

    organization = (
        db.query(Organization)
        .filter(Organization.id == organization_id)
        .first()
    )

    if not organization:
        raise HTTPException(
            status_code=404,
            detail="Organization not found",
        )

    if data.name is not None:

        new_name = data.name.strip()

        if not new_name:
            raise HTTPException(
                status_code=400,
                detail="Organization name cannot be empty",
            )

        existing = (
            db.query(Organization)
            .filter(
                Organization.name == new_name,
                Organization.id != organization_id,
            )
            .first()
        )

        if existing:
            raise HTTPException(
                status_code=409,
                detail="Organization name already exists",
            )

        organization.name = new_name

    if data.is_active is not None:
        organization.is_active = data.is_active

    db.commit()
    db.refresh(organization)

    return {
        "success": True,
        "message": "Organization updated successfully",
        "organization": {
            "id": organization.id,
            "name": organization.name,
            "is_active": organization.is_active,
            "created_at": organization.created_at,
        },
    }