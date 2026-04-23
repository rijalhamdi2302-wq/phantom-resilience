# alerts.py
# Endpoints for danger alerts

from fastapi import APIRouter, HTTPException
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(
    os.path.dirname(os.path.abspath(__file__)))))
from models.score_predictor import predict_all_countries
from config import SCORE_WATCH, SCORE_DANGER

router = APIRouter()


@router.get("/all")
def get_all_alerts():
    """
    Returns all countries that are in WATCH, DANGER or CRITICAL
    """
    try:
        all_scores = predict_all_countries()
        alerts = [c for c in all_scores if c["score"] >= SCORE_WATCH]
        alerts = sorted(alerts, key=lambda x: x["score"], reverse=True)

        return {
            "status":      "success",
            "total_alerts": len(alerts),
            "data":        alerts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/critical")
def get_critical_alerts():
    """
    Returns only DANGER and CRITICAL countries
    """
    try:
        all_scores = predict_all_countries()
        critical = [c for c in all_scores if c["score"] >= SCORE_DANGER]
        critical = sorted(critical, key=lambda x: x["score"], reverse=True)

        return {
            "status":   "success",
            "total":    len(critical),
            "data":     critical
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))