from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import get_current_user, require_role
from app.models.security_event import SecurityEvent
from app.services.detection_engine import detect_threat
from app.services.incident_service import create_incident
from app.services.notification_service import send_email_notification
from app.services.response_service import execute_security_response
from app.services.ml_service import predict_anomaly


router = APIRouter(
    prefix="/api/events",
    tags=["Security Events"],
)


class SecurityEventCreate(BaseModel):
    event_type: str = Field(..., min_length=1, max_length=100)
    source_ip: str | None = None
    username: str | None = None
    device: str | None = None
    location: str | None = None
    raw_data: dict | None = None
    description: str | None = None


def calculate_ml_features(
    db: Session,
    source_ip: str | None,
    username: str | None,
    device: str | None,
    location: str | None,
    event_timestamp: datetime,
) -> dict:
    """
    Calculate ML features automatically from recent security events.
    """

    start_time = event_timestamp - timedelta(minutes=5)

    # Recent events for the same source IP
    ip_query = db.query(SecurityEvent).filter(
        SecurityEvent.timestamp >= start_time,
        SecurityEvent.timestamp <= event_timestamp,
    )

    if source_ip:
        ip_query = ip_query.filter(
            SecurityEvent.source_ip == source_ip
        )

    recent_ip_events = ip_query.all()

    # Failed login count
    failed_login_count = sum(
        1
        for event in recent_ip_events
        if event.event_type == "failed_login"
    )

    # Request frequency
    request_frequency = len(recent_ip_events)

    # Login hour
    login_hour = event_timestamp.hour

    # Check whether IP is new for this username
    new_ip = 0

    if username and source_ip:
        previous_ip_event = (
            db.query(SecurityEvent)
            .filter(
                SecurityEvent.username == username,
                SecurityEvent.source_ip == source_ip,
                SecurityEvent.timestamp < event_timestamp,
            )
            .first()
        )

        if previous_ip_event is None:
            new_ip = 1

    # Check whether device is new for this username
    new_device = 0

    if username and device:
        previous_device_event = (
            db.query(SecurityEvent)
            .filter(
                SecurityEvent.username == username,
                SecurityEvent.device == device,
                SecurityEvent.timestamp < event_timestamp,
            )
            .first()
        )

        if previous_device_event is None:
            new_device = 1

    # Count unique locations
    unique_locations = 1

    if username:
        location_events = (
            db.query(SecurityEvent)
            .filter(
                SecurityEvent.username == username,
                SecurityEvent.timestamp >= start_time,
                SecurityEvent.timestamp <= event_timestamp,
            )
            .all()
        )

        locations = {
            event.location
            for event in location_events
            if event.location
        }

        if locations:
            unique_locations = len(locations)

    return {
        "failed_login_count": failed_login_count,
        "login_hour": login_hour,
        "new_device": new_device,
        "new_ip": new_ip,
        "unique_locations": unique_locations,
        "request_frequency": request_frequency,
    }


@router.post("/")
def create_event(
    event: SecurityEventCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("admin", "analyst")),
):
    # ---------------------------------------------------------
    # 1. Create and store incoming security event
    # ---------------------------------------------------------

    event_timestamp = datetime.now(timezone.utc)

    new_event = SecurityEvent(
        timestamp=event_timestamp,
        event_type=event.event_type,
        source_ip=event.source_ip,
        username=event.username,
        device=event.device,
        location=event.location,
        severity="low",
        risk_score=0,
        status="new",
        raw_data=event.raw_data,
        description=event.description,
    )

    db.add(new_event)
    db.flush()

    # ---------------------------------------------------------
    # 2. Rule-based threat detection
    # ---------------------------------------------------------

    rule_detection = detect_threat(
        db=db,
        source_ip=new_event.source_ip,
        username=new_event.username,
        event_type=new_event.event_type,
    )

    # ---------------------------------------------------------
    # 3. Generate ML features automatically
    # ---------------------------------------------------------

    ml_features = calculate_ml_features(
        db=db,
        source_ip=new_event.source_ip,
        username=new_event.username,
        device=new_event.device,
        location=new_event.location,
        event_timestamp=new_event.timestamp,
    )

    # ---------------------------------------------------------
    # 4. ML anomaly detection
    # ---------------------------------------------------------

    ml_detection = predict_anomaly(
        failed_login_count=ml_features["failed_login_count"],
        login_hour=ml_features["login_hour"],
        new_device=ml_features["new_device"],
        new_ip=ml_features["new_ip"],
        unique_locations=ml_features["unique_locations"],
        request_frequency=ml_features["request_frequency"],
    )

    # ---------------------------------------------------------
    # 5. Combine Rule + ML detection
    # ---------------------------------------------------------

    detection = {
        "detected": False,
        "threat_type": None,
        "risk_score": 0,
        "severity": "low",
        "reason": "No suspicious activity detected.",
        "rule_detection": rule_detection,
        "ml_detection": ml_detection,
        "ml_features": ml_features,
    }

    # Rule detected
    if rule_detection["detected"]:
        detection["detected"] = True
        detection["threat_type"] = rule_detection["threat_type"]
        detection["risk_score"] = rule_detection["risk_score"]
        detection["severity"] = rule_detection["severity"]
        detection["reason"] = rule_detection["reason"]

    # ML detected but rule did not
    elif ml_detection["anomaly"]:
        detection["detected"] = True
        detection["threat_type"] = "ml_anomaly"
        detection["risk_score"] = 70
        detection["severity"] = "high"
        detection["reason"] = ml_detection["message"]

    # Both Rule + ML detected
    if rule_detection["detected"] and ml_detection["anomaly"]:
        detection["risk_score"] = 90
        detection["severity"] = "critical"
        detection["reason"] = (
            "Suspicious activity detected by both Rule-based "
            "detection and Machine Learning."
        )

    # ---------------------------------------------------------
    # 6. Create incident if threat detected
    # ---------------------------------------------------------

    incident = None
    response_action = None

    if detection["detected"]:

        new_event.severity = detection["severity"]
        new_event.risk_score = detection["risk_score"]
        new_event.status = "detected"
        new_event.description = detection["reason"]

        incident = create_incident(
            db=db,
            event_id=new_event.id,
            threat_type=detection["threat_type"],
            source_ip=new_event.source_ip,
            username=new_event.username,
            severity=detection["severity"],
            risk_score=detection["risk_score"],
            description=detection["reason"],
        )

        # -----------------------------------------------------
        # 7. Automatic email notification
        # -----------------------------------------------------

        if incident and detection["severity"] in ["high", "critical"]:

            send_email_notification(
                subject=(
                    f"SentinelX Security Alert - "
                    f"{incident.incident_number}"
                ),
                message=(
                    "SentinelX has detected a high-risk "
                    "security incident.\n\n"
                    f"Incident: {incident.incident_number}\n"
                    f"Threat Type: {incident.threat_type}\n"
                    f"Severity: {incident.severity.upper()}\n"
                    f"Risk Score: {incident.risk_score}\n"
                    f"Source IP: {incident.source_ip}\n"
                    f"Username: {incident.username}\n"
                    f"Status: {incident.status}\n\n"
                    f"Reason:\n{incident.description}\n"
                ),
            )

        # -----------------------------------------------------
        # 8. Automated security response
        # -----------------------------------------------------

        response_action = execute_security_response(
            threat_type=detection["threat_type"],
            source_ip=new_event.source_ip,
            username=new_event.username,
            risk_score=detection["risk_score"],
            severity=detection["severity"],
        )

    # ---------------------------------------------------------
    # 9. Commit everything
    # ---------------------------------------------------------

    db.commit()
    db.refresh(new_event)

    # ---------------------------------------------------------
    # 10. API response
    # ---------------------------------------------------------

    return {
        "message": "Security event processed successfully",

        "event_id": new_event.id,

        "detection": detection,

        "incident": (
            {
                "incident_number": incident.incident_number,
                "threat_type": incident.threat_type,
                "severity": incident.severity,
                "risk_score": incident.risk_score,
                "status": incident.status,
            }
            if incident
            else None
        ),

        "response": response_action,

        "event": {
            "id": new_event.id,
            "timestamp": new_event.timestamp,
            "event_type": new_event.event_type,
            "source_ip": new_event.source_ip,
            "username": new_event.username,
            "severity": new_event.severity,
            "risk_score": new_event.risk_score,
            "status": new_event.status,
            "description": new_event.description,
        },
    }


@router.get("/")
def get_events(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    events = (
        db.query(SecurityEvent)
        .order_by(SecurityEvent.timestamp.desc())
        .limit(100)
        .all()
    )

    return {
        "count": len(events),
        "events": events,
    }