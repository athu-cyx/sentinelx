from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.core.auth import hash_password, require_super_admin
from app.core.database import get_db
from app.models.organization import Organization
from app.models.user import User


router = APIRouter(
    prefix="/api/customers",
    tags=["Customers"],
)


class CustomerCreate(BaseModel):
    organization_name: str = Field(..., min_length=2, max_length=150)
    admin_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=8, max_length=100)


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_customer(
    data: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_super_admin),
):
    organization_name = data.organization_name.strip()
    username = data.username.strip().lower()
    email = str(data.email).strip().lower()

    existing_org = (
        db.query(Organization)
        .filter(Organization.name == organization_name)
        .first()
    )

    if existing_org:
        raise HTTPException(
            status_code=409,
            detail="Organization already exists",
        )

    existing_username = (
        db.query(User)
        .filter(User.username == username)
        .first()
    )

    if existing_username:
        raise HTTPException(
            status_code=409,
            detail="Username already exists",
        )

    existing_email = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if existing_email:
        raise HTTPException(
            status_code=409,
            detail="Email already exists",
        )

    organization = Organization(
        name=organization_name,
        is_active=True,
    )

    db.add(organization)
    db.flush()

    customer_admin = User(
        username=username,
        email=email,
        hashed_password=hash_password(data.password),
        role="admin",
        organization_name=organization_name,
        is_active=True,
    )

    db.add(customer_admin)
    db.commit()

    db.refresh(organization)
    db.refresh(customer_admin)

    return {
        "success": True,
        "message": "Customer created successfully",
        "organization": {
            "id": organization.id,
            "name": organization.name,
            "is_active": organization.is_active,
        },
        "admin": {
            "id": customer_admin.id,
            "username": customer_admin.username,
            "email": customer_admin.email,
            "role": customer_admin.role,
            "organization_name": customer_admin.organization_name,
            "is_active": customer_admin.is_active,
        },
    }


@router.get("/")
def get_customers(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_super_admin),
):
    customers = (
        db.query(User)
        .filter(
            User.role == "admin",
            User.organization_name.isnot(None),
        )
        .order_by(User.created_at.desc())
        .all()
    )

    return {
        "success": True,
        "count": len(customers),
        "customers": [
            {
                "id": customer.id,
                "username": customer.username,
                "email": customer.email,
                "role": customer.role,
                "organization_name": customer.organization_name,
                "is_active": customer.is_active,
                "created_at": customer.created_at,
            }
            for customer in customers
        ],
    }


@router.patch("/{customer_id}/status")
def update_customer_status(
    customer_id: str,
    is_active: bool,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_super_admin),
):
    customer = (
        db.query(User)
        .filter(
            User.id == customer_id,
            User.role == "admin",
        )
        .first()
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    customer.is_active = is_active

    db.commit()
    db.refresh(customer)

    return {
        "success": True,
        "message": "Customer status updated successfully",
        "customer": {
            "id": customer.id,
            "username": customer.username,
            "email": customer.email,
            "organization_name": customer.organization_name,
            "is_active": customer.is_active,
        },
    }