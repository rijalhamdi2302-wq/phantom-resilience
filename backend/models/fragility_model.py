# fragility_model.py
# Builds and trains the fragility score AI model

import pandas as pd
import numpy as np
import os
import sys
import pickle

from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import RAW_DATA_PATH

MODEL_PATH = "models/fragility_model.pkl"
SCALER_PATH = "models/scaler.pkl"

def build_fragility_labels(df):
    """
    Since we don't have real 'collapse' labels,
    we build a fragility score from the data itself.
    Higher = more fragile.
    """
    score = pd.Series(np.zeros(len(df)), index=df.index)

    # High unemployment = bad
    if "unemployment_rate" in df.columns:
        score += df["unemployment_rate"].fillna(0) * 1.5

    # Dropping school enrollment = bad
    if "school_enrollment_change" in df.columns:
        score -= df["school_enrollment_change"].fillna(0) * 1.2

    # Dropping GDP = bad
    if "gdp_per_capita_change" in df.columns:
        score -= df["gdp_per_capita_change"].fillna(0) * 1.0

    # High poverty = bad
    if "poverty_headcount" in df.columns:
        score += df["poverty_headcount"].fillna(0) * 2.0

    # Dropping agriculture = bad
    if "agriculture_value_change" in df.columns:
        score -= df["agriculture_value_change"].fillna(0) * 0.8

    # Normalize to 0-100
    min_val = score.min()
    max_val = score.max()
    if max_val - min_val == 0:
        return pd.Series(np.zeros(len(df)), index=df.index)

    normalized = ((score - min_val) / (max_val - min_val)) * 100
    return normalized


def train():
    print("Loading cleaned data...")
    df = pd.read_csv(os.path.join(RAW_DATA_PATH, "cleaned_data.csv"))
    print(f"  Rows loaded: {len(df)}")

    # Build fragility labels
    print("Building fragility scores...")
    df["fragility_score"] = build_fragility_labels(df)

    # Select feature columns (drop non-numeric and target)
    drop_cols = ["country", "year", "fragility_score"]
    feature_cols = [c for c in df.columns if c not in drop_cols]

    df[feature_cols] = df[feature_cols].replace([np.inf, -np.inf], np.nan)
    df[feature_cols] = df[feature_cols].fillna(0)
    X = df[feature_cols].values
    y = df["fragility_score"].values

    # Scale features
    scaler = MinMaxScaler()
    X_scaled = scaler.fit_transform(X)

    # Split into train and test
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42
    )

    # Train Random Forest
    print("Training Random Forest model...")
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=10,
        random_state=42
    )
    model.fit(X_train, y_train)

    # Evaluate
    predictions = model.predict(X_test)
    mae = mean_absolute_error(y_test, predictions)
    print(f"  Model trained! Mean Absolute Error: {mae:.2f} points")

    # Save model and scaler
    os.makedirs("models", exist_ok=True)
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    with open(SCALER_PATH, "wb") as f:
        pickle.dump(scaler, f)

    print(f"  Model saved to {MODEL_PATH}")
    print(f"  Scaler saved to {SCALER_PATH}")

    # Show sample predictions
    df["predicted_score"] = model.predict(scaler.transform(X))
    sample = df[["country", "year", "fragility_score", "predicted_score"]].tail(10)
    print("\n Sample predictions:")
    print(sample.to_string(index=False))


if __name__ == "__main__":
    train()