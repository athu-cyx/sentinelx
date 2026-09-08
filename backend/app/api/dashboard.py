from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.security_event import SecurityEvent


router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"],
)


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
):
    total_events = db.query(SecurityEvent).count()

    threats_detected = (
        db.query(SecurityEvent)
        .filter(
            SecurityEvent.severity.in_(
                ["medium", "high", "critical"]
            )
        )
        .count()
    )

    critical_threats = (
        db.query(SecurityEvent)
        .filter(
            SecurityEvent.severity == "critical"
        )
        .count()
    )
    
    critical_count = (
        db.query(SecurityEvent)
        .filter(SecurityEvent.severity == "critical")
        .count()
    )

    high_count = (
        db.query(SecurityEvent)
        .filter(SecurityEvent.severity == "high")
        .count()
    )

    medium_count = (
        db.query(SecurityEvent)
        .filter(SecurityEvent.severity == "medium")
        .count()
    )

    low_count = (
        db.query(SecurityEvent)
        .filter(SecurityEvent.severity == "low")
        .count()
    )

    blocked_ips = (
        db.query(SecurityEvent.source_ip)
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
        "total_events": total_events,
        "threats_detected": threats_detected,
        "critical_threats": critical_threats,
        "blocked_ips": blocked_ips,
        "critical_count": critical_count,
        "high_count": high_count,
        "medium_count": medium_count,
        "low_count": low_count,
    }

    from datetime import datetime, timedelta, timezone
from sqlalchemy import func


@router.get("/activity")
def get_dashboard_activity(
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    start_time = now - timedelta(hours=24)

    results = (
        db.query(
            func.date_trunc("hour", SecurityEvent.timestamp).label("hour"),
            func.count(SecurityEvent.id).label("count"),
        )
        .filter(SecurityEvent.timestamp >= start_time)
        .group_by(func.date_trunc("hour", SecurityEvent.timestamp))
        .order_by(func.date_trunc("hour", SecurityEvent.timestamp))
        .all()
    )

    activity = []

    for hour, count in results:
        activity.append({
            "time": hour.isoformat(),
            "count": count,
        })

    return {
        "period": "last_24_hours",
        "activity": activity,
    }