from uuid import uuid4

from sqlalchemy.orm import Session

from app.models.incident import Incident


def create_incident(
    db: Session,
    event_id: str,
    threat_type: str,
    source_ip: str | None,
    username: str | None,
    severity: str,
    risk_score: int,
    description: str | None,
) -> Incident:
    """
    Create an incident for a detected security threat.
    """

    incident_number = f"INC-{str(uuid4())[:8].upper()}"

    incident = Incident(
        incident_number=incident_number,
        event_id=event_id,
        threat_type=threat_type,
        source_ip=source_ip,
        username=username,
        severity=severity,
        risk_score=risk_score,
        status="open",
        description=description,
    )

    db.add(incident)
    db.flush()

    return incident