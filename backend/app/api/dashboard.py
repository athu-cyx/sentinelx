from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.security_event import SecurityEvent


router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"],
)


# ---------------------------------------------------------
# DASHBOARD STATS
# ORGANIZATION ISOLATED
# ---------------------------------------------------------
@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    organization_name = current_user.get("organization_name")

    # Base query restricted to current organization
    base_query = db.query(SecurityEvent)

    if organization_name:
        base_query = base_query.filter(
            SecurityEvent.organization_name == organization_name
        )

    total_events = base_query.count()

    threats_detected = (
        base_query
        .filter(
            SecurityEvent.severity.in_(
                ["medium", "high", "critical"]
            )
        )
        .count()
    )

    critical_threats = (
        base_query
        .filter(
            SecurityEvent.severity == "critical"
        )
        .count()
    )

    critical_count = (
        base_query
        .filter(
            SecurityEvent.severity == "critical"
        )
        .count()
    )

    high_count = (
        base_query
        .filter(
            SecurityEvent.severity == "high"
        )
        .count()
    )

    medium_count = (
        base_query
        .filter(
            SecurityEvent.severity == "medium"
        )
        .count()
    )

    low_count = (
        base_query
        .filter(
            SecurityEvent.severity == "low"
        )
        .count()
    )

    blocked_ips = (
        base_query
        .with_entities(SecurityEvent.source_ip)
        .filter(
            SecurityEvent.severity.in_(
                ["high", "critical"]
            ),
            SecurityEvent.source_ip.isnot(None),
        )
        .distinct()
        .count()
    )

    return {
        "organization_name": organization_name,
        "total_events": total_events,
        "threats_detected": threats_detected,
        "critical_threats": critical_threats,
        "blocked_ips": blocked_ips,
        "critical_count": critical_count,
        "high_count": high_count,
        "medium_count": medium_count,
        "low_count": low_count,
    }


# ---------------------------------------------------------
# DASHBOARD ACTIVITY
# ORGANIZATION ISOLATED
# ---------------------------------------------------------
@router.get("/activity")
def get_dashboard_activity(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    organization_name = current_user.get("organization_name")

    now = datetime.now(timezone.utc)
    start_time = now - timedelta(hours=24)

    query = (
        db.query(
            func.date_trunc(
                "hour",
                SecurityEvent.timestamp
            ).label("hour"),
            func.count(SecurityEvent.id).label("count"),
        )
        .filter(
            SecurityEvent.timestamp >= start_time
        )
    )

    # Tenant / organization isolation
    if organization_name:
        query = query.filter(
            SecurityEvent.organization_name == organization_name
        )

    results = (
        query
        .group_by(
            func.date_trunc(
                "hour",
                SecurityEvent.timestamp
            )
        )
        .order_by(
            func.date_trunc(
                "hour",
                SecurityEvent.timestamp
            )
        )
        .all()
    )

    activity = []

    for hour, count in results:
        activity.append({
            "time": hour.isoformat(),
            "count": count,
        })

    return {
        "organization_name": organization_name,
        "period": "last_24_hours",
        "activity": activity,
    }