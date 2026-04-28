# score_predictor.py
import pandas as pd
import numpy as np
import pickle
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import RAW_DATA_PATH, SCORE_STABLE, SCORE_WATCH, SCORE_ELEVATED, SCORE_DANGER

MODEL_PATH  = "models/fragility_model.pkl"
SCALER_PATH = "models/scaler.pkl"


def load_model():
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)
    with open(SCALER_PATH, "rb") as f:
        scaler = pickle.load(f)
    return model, scaler


def get_risk_label(score):
    if score < SCORE_STABLE:
        return "STABLE"
    elif score < SCORE_WATCH:
        return "WATCH"
    elif score < SCORE_ELEVATED:
        return "ELEVATED"
    elif score < SCORE_DANGER:
        return "DANGER"
    else:
        return "CRITICAL"


def get_causes(row):
    """
    Analyses the indicator values for a country row
    and returns the top 3 fragility causes
    """
    causes = []

    if "unemployment_rate" in row and pd.notna(row["unemployment_rate"]):
        if row["unemployment_rate"] > 15:
            causes.append({"icon": "💼", "label": "Severe unemployment", "value": f"{row['unemployment_rate']:.1f}%"})
        elif row["unemployment_rate"] > 8:
            causes.append({"icon": "💼", "label": "High unemployment rate", "value": f"{row['unemployment_rate']:.1f}%"})

    if "poverty_headcount" in row and pd.notna(row["poverty_headcount"]):
        if row["poverty_headcount"] > 30:
            causes.append({"icon": "📉", "label": "Extreme poverty levels", "value": f"{row['poverty_headcount']:.1f}%"})
        elif row["poverty_headcount"] > 10:
            causes.append({"icon": "📉", "label": "Elevated poverty rate", "value": f"{row['poverty_headcount']:.1f}%"})

    if "school_enrollment_change" in row and pd.notna(row["school_enrollment_change"]):
        if row["school_enrollment_change"] < -5:
            causes.append({"icon": "🏫", "label": "Sharp drop in school enrollment", "value": f"{row['school_enrollment_change']:.1f}%/yr"})
        elif row["school_enrollment_change"] < -1:
            causes.append({"icon": "🏫", "label": "Declining school enrollment", "value": f"{row['school_enrollment_change']:.1f}%/yr"})

    if "gdp_per_capita_change" in row and pd.notna(row["gdp_per_capita_change"]):
        if row["gdp_per_capita_change"] < -5:
            causes.append({"icon": "🏦", "label": "Economy rapidly shrinking", "value": f"{row['gdp_per_capita_change']:.1f}%/yr"})
        elif row["gdp_per_capita_change"] < -1:
            causes.append({"icon": "🏦", "label": "Declining GDP per capita", "value": f"{row['gdp_per_capita_change']:.1f}%/yr"})

    if "agriculture_value_change" in row and pd.notna(row["agriculture_value_change"]):
        if row["agriculture_value_change"] < -5:
            causes.append({"icon": "🌾", "label": "Severe agricultural decline", "value": f"{row['agriculture_value_change']:.1f}%/yr"})
        elif row["agriculture_value_change"] < -2:
            causes.append({"icon": "🌾", "label": "Falling agricultural output", "value": f"{row['agriculture_value_change']:.1f}%/yr"})

    if "population" in row and pd.notna(row["population"]):
        if "population_change" in row and pd.notna(row["population_change"]):
            if row["population_change"] < -1:
                causes.append({"icon": "👥", "label": "Population exodus detected", "value": f"{row['population_change']:.1f}%/yr"})

    if not causes:
        causes.append({"icon": "⚠️", "label": "Multiple compounding stress factors", "value": "Combined"})

    return causes[:3]


def get_trend(country_code, df):
    """
    Returns whether fragility is improving or worsening
    based on GDP and unemployment change direction
    """
    country_df = df[df["country"] == country_code].sort_values("year")
    if len(country_df) < 2:
        return "UNKNOWN"

    latest = country_df.tail(1).iloc[0]
    gdp_change = latest.get("gdp_per_capita_change", 0) or 0
    unem_change = latest.get("unemployment_rate_change", 0) or 0

    if gdp_change > 1 and unem_change < 0:
        return "IMPROVING"
    elif gdp_change < -1 or unem_change > 2:
        return "WORSENING"
    else:
        return "STABLE"


def predict_country(country_code):
    model, scaler = load_model()
    df = pd.read_csv(os.path.join(RAW_DATA_PATH, "cleaned_data.csv"))
    country_df = df[df["country"] == country_code]

    if country_df.empty:
        return {"error": f"No data found for country: {country_code}"}

    latest = country_df.sort_values("year").tail(1)
    year   = int(latest["year"].values[0])

    drop_cols   = ["country", "year"]
    feature_cols = [c for c in latest.columns if c not in drop_cols]

    # Clean infinities
    latest_clean = latest[feature_cols].replace([np.inf, -np.inf], np.nan).fillna(0)
    X            = latest_clean.values
    X_scaled     = scaler.transform(X)
    score        = float(model.predict(X_scaled)[0])
    score        = round(min(max(score, 0), 100), 2)

    row    = latest.iloc[0].to_dict()
    causes = get_causes(row)
    trend  = get_trend(country_code, df)

    population = row.get("population", None)
    pop_display = None
    if population and pd.notna(population):
        if population >= 1_000_000:
            pop_display = f"{population / 1_000_000:.1f}M"
        else:
            pop_display = f"{int(population):,}"

    return {
        "country":     country_code,
        "year":        year,
        "score":       score,
        "risk_level":  get_risk_label(score),
        "trend":       trend,
        "causes":      causes,
        "population":  pop_display,
        "message":     f"{country_code} has a fragility score of {score}/100 — {get_risk_label(score)}"
    }


def predict_all_countries():
    model, scaler = load_model()
    df = pd.read_csv(os.path.join(RAW_DATA_PATH, "cleaned_data.csv"))
    results = []
    for country in df["country"].unique():
        result = predict_country(country)
        if "error" not in result:
            results.append(result)
            print(f"  {result['country']} — {result['score']} — {result['risk_level']}")
    return results


if __name__ == "__main__":
    predict_all_countries()