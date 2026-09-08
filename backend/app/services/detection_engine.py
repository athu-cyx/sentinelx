from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.security_event import SecurityEvent


FAILED_LOGIN_THRESHOLD = 5
TIME_WINDOW_MINUTES = 5


def detect_threat(
    db: Session,
    source_ip: str | None,
    username: str | None,
    event_type: str,
) -> dict:
    """
    Analyze a security event and detect suspicious activity.
    """

    # Default result for a normal event
    result = {
        "detected": False,
        "threat_type": None,
        "risk_score": 0,
        "severity": "low",
        "reason": "No suspicious activity detected.",
    }

    # We currently focus on failed-login detection
    if event_type != "failed_login":
        return result

    if not source_ip:
        return result

    # Look back over the configured time window
    current_time = datetime.now(timezone.utc)
    start_time = current_time - timedelta(minutes=TIME_WINDOW_MINUTES)

    query = db.query(SecurityEvent).filter(
        SecurityEvent.event_type == "failed_login",
        SecurityEvent.source_ip == source_ip,
        SecurityEvent.timestamp >= start_time,
    )

    # If username is available, include it in the analysis
    if username:
        query = query.filter(SecurityEvent.username == username)

    failed_login_count = query.count()

    # Brute-force detection
    if failed_login_count >= FAILED_LOGIN_THRESHOLD:
        result = {
            "detected": True,
            "threat_type": "brute_force_login",
            "risk_score": 85,
            "severity": "high",
            "reason": (
                f"{failed_login_count} failed login attempts detected "
                f"from the same source within {TIME_WINDOW_MINUTES} minutes."
            ),
        }

    return result