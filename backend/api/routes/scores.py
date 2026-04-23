# scores.py
# Endpoints for fragility scores

from fastapi import APIRouter, HTTPException
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(
    os.path.dirname(os.path.abspath(__file__)))))
from models.score_predictor import predict_country, predict_all_countries

router = APIRouter()


@router.get("/all")
def get_all_scores():
    """
    Returns fragility scores for all countries
    """
    try:
        results = predict_all_countries()
        return {"status": "success", "data": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{country_code}")
def get_country_score(country_code: str):
    """
    Returns fragility score for one country
    Example: /api/scores/MY
    """
    try:
        result = predict_country(country_code.upper())
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        return {"status": "success", "data": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))