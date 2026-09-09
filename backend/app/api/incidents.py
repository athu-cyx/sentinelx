from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.incident import Incident
from app.services.ai_service import analyze_security_incident


router = APIRouter(
    prefix="/api/incidents",
    tags=["Incidents"],
)


# ---------------------------------------------------------
# Get recent incidents
# ---------------------------------------------------------

@router.get("/")
def get_incidents(
    db: Session = Depends(get_db),
):
    incidents = (
        db.query(Incident)
        .order_by(Incident.created_at.desc())
        .limit(10)
        .all()
    )

    return {
        "count": len(incidents),
        "incidents": incidents,
    }


# ---------------------------------------------------------
# Get single incident
# ---------------------------------------------------------

@router.get("/{incident_number}")
def get_incident(
    incident_number: str,
    db: Session = Depends(get_db),
):
    incident = (
        db.query(Incident)
        .filter(Incident.incident_number == incident_number)
        .first()
    )

    if not incident:
        raise HTTPException(
            status_code=404,
            detail="Incident not found.",
        )

    return {
        "incident_number": incident.incident_number,
        "event_id": incident.event_id,
        "threat_type": incident.threat_type,
        "source_ip": incident.source_ip,
        "username": incident.username,
        "severity": incident.severity,
        "risk_score": incident.risk_score,
        "status": incident.status,
        "description": incident.description,
        "created_at": incident.created_at,
    }


# ---------------------------------------------------------
# AI Security Copilot
# ---------------------------------------------------------

@router.post("/{incident_number}/analyze")
def analyze_incident(
    incident_number: str,
    db: Session = Depends(get_db),
):
    incident = (
        db.query(Incident)
        .filter(Incident.incident_number == incident_number)
        .first()
    )

    if not incident:
        raise HTTPException(
            status_code=404,
            detail="Incident not found.",
        )

    analysis = analyze_security_incident(
        threat_type=incident.threat_type,
        severity=incident.severity,
        risk_score=incident.risk_score,
        source_ip=incident.source_ip,
        username=incident.username,
        description=incident.description,
    )

    return {
        "incident_number": incident.incident_number,
        "risk_score": incident.risk_score,
        "severity": incident.severity,
        "ai_analysis": analysis,
    }