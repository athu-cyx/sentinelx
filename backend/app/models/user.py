from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )

    username: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    # Supported roles:
    # super_admin -> SentinelX platform administrator
    # admin       -> Organization/customer administrator
    # analyst     -> Security analyst
    # viewer      -> Read-only user
    role: Mapped[str] = mapped_column(
        String(30),
        default="viewer",
        nullable=False,
        index=True,
    )

    # Super Admin can have no organization.
    # Customer users must belong to an organization.
    organization_name: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
        index=True,
    )

    is_active: Mapped[bool] = mapped_column(
        default=True,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )