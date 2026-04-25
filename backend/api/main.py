# main.py
# FastAPI server — the brain talks to the world through here

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from api.routes import scores, countries, alerts

app = FastAPI(
    title="Phantom Resilience API",
    description="AI-powered community fragility detection system",
    version="1.0.0"
)

# Allow React frontend to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://phantom-resilience.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(scores.router,    prefix="/api/scores",    tags=["Scores"])
app.include_router(countries.router, prefix="/api/countries", tags=["Countries"])
app.include_router(alerts.router,    prefix="/api/alerts",    tags=["Alerts"])

@app.get("/")
def root():
    return {
        "message": "Phantom Resilience API is running",
        "status":  "online"
    }