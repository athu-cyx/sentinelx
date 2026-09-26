from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import get_current_user, require_role
from app.models.incident import Incident
from app.services.ai_service import analyze_security_incident

router = APIRouter(
    prefix="/api/incidents",
    tags=["Incidents"]
)


# ---------------------------------------------------------
# GET ALL INCIDENTS
# ORGANIZATION ISOLATED
# ---------------------------------------------------------
@router.get("/")
def get_incidents(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):

    organization_name = current_user.get("organization_name")

    query = db.query(Incident)

    # Tenant / organization isolation
    if organization_name:
        query = query.filter(
            Incident.organization_name == organization_name
        )

    incidents = (
        query
        .order_by(Incident.created_at.desc())
        .limit(10)
        .all()
    )

    return {
        "count": len(incidents),
        "incidents": incidents
    }


# ---------------------------------------------------------
# GET SINGLE INCIDENT
# ORGANIZATION ISOLATED
# ---------------------------------------------------------
@router.get("/{incident_number}")
def get_incident(
    incident_number: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):

    organization_name = current_user.get("organization_name")

    query = (
        db.query(Incident)
        .filter(
            Incident.incident_number == incident_number
        )
    )

    # Tenant / organization isolation
    if organization_name:
        query = query.filter(
            Incident.organization_name == organization_name
        )

    incident = query.first()

    if not incident:
        raise HTTPException(
            status_code=404,
            detail="Incident not found."
        )

    return {
        "incident_number": incident.incident_number,
        "event_id": incident.event_id,
        "organization_name": incident.organization_name,
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
# UPDATE INCIDENT STATUS
# ORGANIZATION ISOLATED
# ---------------------------------------------------------
@router.patch("/{incident_number}/status")
def update_incident_status(
    incident_number: str,
    status: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_role("admin", "analyst")
    ),
):

    allowed_statuses = {
        "open",
        "investigating",
        "contained",
        "resolved"
    }

    status = status.lower().strip()

    if status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Invalid incident status.",
                "allowed_statuses": list(allowed_statuses)
            }
        )

    organization_name = current_user.get("organization_name")

    query = (
        db.query(Incident)
        .filter(
            Incident.incident_number == incident_number
        )
    )

    # Tenant / organization isolation
    if organization_name:
        query = query.filter(
            Incident.organization_name == organization_name
        )

    incident = query.first()

    if not incident:
        raise HTTPException(
            status_code=404,
            detail="Incident not found."
        )

    incident.status = status

    db.commit()
    db.refresh(incident)

    return {
        "success": True,
        "message": "Incident status updated successfully.",
        "incident_number": incident.incident_number,
        "status": incident.status
    }


# ---------------------------------------------------------
# AI INCIDENT ANALYSIS
# ORGANIZATION ISOLATED
# ---------------------------------------------------------
@router.post("/{incident_number}/analyze")
def analyze_incident(
    incident_number: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_role("admin", "analyst")
    ),
):

    organization_name = current_user.get("organization_name")

    query = (
        db.query(Incident)
        .filter(
            Incident.incident_number == incident_number
        )
    )

    # Tenant / organization isolation
    if organization_name:
        query = query.filter(
            Incident.organization_name == organization_name
        )

    incident = query.first()

    if not incident:
        raise HTTPException(
            status_code=404,
            detail="Incident not found."
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
        "organization_name": incident.organization_name,
        "risk_score": incident.risk_score,
        "severity": incident.severity,
        "ai_analysis": analysis,
    }