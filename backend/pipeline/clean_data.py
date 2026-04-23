# clean_data.py
# Reads raw data, cleans it, and prepares it for the AI model

import pandas as pd
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import RAW_DATA_PATH

def clean():
    input_path  = os.path.join(RAW_DATA_PATH, "worldbank_data.csv")
    output_path = os.path.join(RAW_DATA_PATH, "cleaned_data.csv")

    print("Loading raw data...")
    df = pd.read_csv(input_path)
    print(f"  Raw rows: {len(df)}")

    # Remove duplicate rows
    df = df.drop_duplicates()

    # Only keep years from 2000 onwards
    df = df[df["year"] >= 2000]

    # Pivot: one row per country per year, one column per indicator
    pivoted = df.pivot_table(
        index   = ["country", "year"],
        columns = "indicator",
        values  = "value"
    ).reset_index()

    # Flatten column names
    pivoted.columns.name = None

    # Fill missing values with the column average (simple approach)
    numeric_cols = pivoted.select_dtypes(include="number").columns
    pivoted[numeric_cols] = pivoted[numeric_cols].fillna(
        pivoted[numeric_cols].mean()
    )

    # Add year-over-year change columns for each indicator
    indicators = [c for c in pivoted.columns if c not in ["country", "year"]]
    for col in indicators:
        pivoted[f"{col}_change"] = pivoted.groupby("country")[col].pct_change() * 100

    # Fill NaN changes (first year has no change)
    pivoted = pivoted.fillna(0)

    # Sort
    pivoted = pivoted.sort_values(["country", "year"])

    # Save
    pivoted.to_csv(output_path, index=False)
    print(f"  Cleaned rows: {len(pivoted)}")
    print(f"  Saved to {output_path}")
    print(pivoted.head())


if __name__ == "__main__":
    clean()