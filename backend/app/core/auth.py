import os
from datetime import datetime, timedelta, timezone
from typing import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext


# ============================================================
# CONFIGURATION
# ============================================================

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "sentinelx-development-secret-change-this-before-production",
)

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


# ============================================================
# ROLES
# ============================================================

ROLE_SUPER_ADMIN = "super_admin"
ROLE_ADMIN = "admin"
ROLE_ANALYST = "analyst"
ROLE_VIEWER = "viewer"

ALL_ROLES = {
    ROLE_SUPER_ADMIN,
    ROLE_ADMIN,
    ROLE_ANALYST,
    ROLE_VIEWER,
}


# ============================================================
# PASSWORD SECURITY
# ============================================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


security = HTTPBearer()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    return pwd_context.verify(
        plain_password,
        hashed_password,
    )


# ============================================================
# JWT ACCESS TOKEN
# ============================================================

def create_access_token(
    username: str,
    role: str,
    organization_name: str | None = None,
) -> str:

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": username,
        "role": role,
        "organization_name": organization_name,
        "exp": expire,
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def decode_access_token(token: str) -> dict | None:

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        username = payload.get("sub")
        role = payload.get("role")
        organization_name = payload.get("organization_name")

        if not username or not role:
            return None

        if role not in ALL_ROLES:
            return None

        return {
            "username": username,
            "role": role,
            "organization_name": organization_name,
        }

    except JWTError:

        return None


# ============================================================
# CURRENT USER
# ============================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:

    token = credentials.credentials

    user = decode_access_token(token)

    if not user:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={
                "WWW-Authenticate": "Bearer",
            },
        )

    return user


# ============================================================
# ROLE-BASED ACCESS CONTROL
# ============================================================

def require_role(*allowed_roles: str) -> Callable:

    def role_checker(
        current_user: dict = Depends(get_current_user),
    ) -> dict:

        if current_user["role"] not in allowed_roles:

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action",
            )

        return current_user

    return role_checker


# ============================================================
# COMMON ROLE DEPENDENCIES
# ============================================================

require_super_admin = require_role(
    ROLE_SUPER_ADMIN
)


require_admin = require_role(
    ROLE_ADMIN,
    ROLE_SUPER_ADMIN,
)


require_analyst = require_role(
    ROLE_ANALYST,
    ROLE_ADMIN,
    ROLE_SUPER_ADMIN,
)


require_viewer = require_role(
    ROLE_VIEWER,
    ROLE_ANALYST,
    ROLE_ADMIN,
    ROLE_SUPER_ADMIN,
)