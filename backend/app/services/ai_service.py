import os
import requests


OLLAMA_URL = os.getenv(
    "OLLAMA_URL",
    "http://127.0.0.1:11434/api/generate"
)

OLLAMA_MODEL = os.getenv(
    "OLLAMA_MODEL",
    "gemma3:4b"
)


def analyze_security_incident(
    threat_type: str,
    severity: str,
    risk_score: int,
    source_ip: str | None,
    username: str | None,
    description: str | None,
) -> dict:
    """
    Analyze a security incident using a local Ollama LLM.
    """

    prompt = f"""
You are SentinelX AI Security Copilot.

Analyze the following security incident.

Threat Type: {threat_type}
Severity: {severity}
Risk Score: {risk_score}/100
Source IP: {source_ip}
Username: {username}
Description: {description}

Provide a concise security analysis with exactly these sections:

1. Threat Summary
2. Why It Is Risky
3. Investigation Steps
4. Recommended Action

Do not claim that an action was actually performed unless it is explicitly provided in the incident data.
"""

    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
            },
            timeout=180,
        )

        response.raise_for_status()

        data = response.json()

        return {
            "success": True,
            "model": OLLAMA_MODEL,
            "analysis": data.get("response", "").strip(),
        }

    except Exception as error:
        return {
            "success": False,
            "model": OLLAMA_MODEL,
            "analysis": "AI Security Copilot is currently unavailable.",
            "error": str(error),
        }