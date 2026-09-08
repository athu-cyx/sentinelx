from datetime import datetime, timezone


def execute_security_response(
    threat_type: str,
    source_ip: str | None,
    username: str | None,
    risk_score: int,
    severity: str,
) -> dict:
    """
    Execute a predefined security response for a detected threat.

    This initial version uses a SAFE DEMO response.
    It records what SentinelX would do without modifying
    the actual operating system or network.
    """

    response = {
        "executed": False,
        "action": None,
        "target": None,
        "reason": None,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    # High-risk brute-force attack
    if threat_type == "brute_force_login" and risk_score >= 80:
        response["executed"] = True
        response["action"] = "IP_BLOCK_REQUESTED"
        response["target"] = source_ip
        response["reason"] = (
            "Source IP identified as a high-risk brute-force attacker."
        )

    # High-risk suspicious activity
    elif severity == "critical":
        response["executed"] = True
        response["action"] = "ACCOUNT_REVIEW_REQUESTED"
        response["target"] = username
        response["reason"] = (
            "Critical security event detected. "
            "Account requires security review."
        )

    else:
        response["action"] = "NO_ACTION"
        response["reason"] = "No automated response required."

    return response