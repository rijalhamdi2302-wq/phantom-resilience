# score_predictor.py
# Uses the trained model to predict fragility score for any country/year

import pandas as pd
import numpy as np
import pickle
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import RAW_DATA_PATH, SCORE_SAFE, SCORE_WATCH, SCORE_DANGER

MODEL_PATH  = "models/fragility_model.pkl"
SCALER_PATH = "models/scaler.pkl"


def load_model():
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)
    with open(SCALER_PATH, "rb") as f:
        scaler = pickle.load(f)
    return model, scaler


def get_risk_label(score):
    if score < SCORE_SAFE:
        return "SAFE"
    elif score < SCORE_WATCH:
        return "WATCH"
    elif score < SCORE_DANGER:
        return "DANGER"
    else:
        return "CRITICAL"


def predict_country(country_code):
    """
    Returns the latest fragility score for a given country
    """
    model, scaler = load_model()

    df = pd.read_csv(os.path.join(RAW_DATA_PATH, "cleaned_data.csv"))
    country_df = df[df["country"] == country_code]

    if country_df.empty:
        return {"error": f"No data found for country: {country_code}"}

    # Get the most recent year
    latest = country_df.sort_values("year").tail(1)
    year = int(latest["year"].values[0])

    drop_cols = ["country", "year"]
    feature_cols = [c for c in latest.columns if c not in drop_cols]

    X = latest[feature_cols].values
    X_scaled = scaler.transform(X)
    score = float(model.predict(X_scaled)[0])
    score = round(min(max(score, 0), 100), 2)

    return {
        "country":      country_code,
        "year":         year,
        "score":        score,
        "risk_level":   get_risk_label(score),
        "message":      f"{country_code} has a fragility score of {score}/100 — {get_risk_label(score)}"
    }


def predict_all_countries():
    """
    Returns fragility scores for all countries in the dataset
    """
    model, scaler = load_model()
    df = pd.read_csv(os.path.join(RAW_DATA_PATH, "cleaned_data.csv"))

    results = []
    for country in df["country"].unique():
        result = predict_country(country)
        if "error" not in result:
            results.append(result)
            print(f"  {result['country']} — Score: {result['score']} — {result['risk_level']}")

    return results


if __name__ == "__main__":
    print("Predicting fragility scores for all countries...\n")
    predict_all_countries()