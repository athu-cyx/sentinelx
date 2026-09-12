from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.events import router as events_router

from app.api.dashboard import router as dashboard_router
from app.api.incidents import router as incidents_router
from app.api.auth import router as auth_router
from app.api.integrations import router as integrations_router

app = FastAPI(
    title="SentinelX API",
    description="AI-Powered Enterprise Threat Detection & Response Platform",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(events_router)
app.include_router(dashboard_router)
app.include_router(incidents_router)
app.include_router(auth_router)
app.include_router(integrations_router)

@app.get("/")
def root():
    return {
        "name": "SentinelX",
        "status": "operational",
        "message": "Security platform API is running",
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "sentinelx-api",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }