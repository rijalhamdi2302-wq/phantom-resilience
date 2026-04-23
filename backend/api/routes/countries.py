# countries.py
# Endpoints for country data and trends

from fastapi import APIRouter, HTTPException
import pandas as pd
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(
    os.path.dirname(os.path.abspath(__file__)))))
from config import RAW_DATA_PATH

router = APIRouter()


@router.get("/list")
def get_country_list():
    """
    Returns list of all tracked countries
    """
    try:
        df = pd.read_csv(os.path.join(RAW_DATA_PATH, "cleaned_data.csv"))
        countries = df["country"].unique().tolist()
        return {"status": "success", "countries": countries}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{country_code}/trends")
def get_country_trends(country_code: str):
    """
    Returns year by year data for a country
    Example: /api/countries/MY/trends
    """
    try:
        df = pd.read_csv(os.path.join(RAW_DATA_PATH, "cleaned_data.csv"))
        country_df = df[df["country"] == country_code.upper()]

        if country_df.empty:
            raise HTTPException(
                status_code=404,
                detail=f"No data found for {country_code}"
            )

        country_df = country_df.sort_values("year")
        return {
            "status":  "success",
            "country": country_code.upper(),
            "data":    country_df.to_dict(orient="records")
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))