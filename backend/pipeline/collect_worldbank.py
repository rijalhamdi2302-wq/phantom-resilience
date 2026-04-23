# collect_worldbank.py
# Downloads data from World Bank API and saves as CSV

import requests
import pandas as pd
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import COUNTRIES, INDICATORS, YEARS_BACK, RAW_DATA_PATH

def fetch_indicator(country_code, indicator_code, indicator_name):
    """
    Fetch one indicator for one country from World Bank API
    """
    url = (
        f"https://api.worldbank.org/v2/country/{country_code}"
        f"/indicator/{indicator_code}"
        f"?format=json&per_page=100"
    )

    print(f"  Fetching {indicator_name} for {country_code}...")

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()

        # World Bank wraps data in [metadata, actual_data]
        if len(data) < 2 or not data[1]:
            print(f"  No data found for {indicator_name} / {country_code}")
            return None

        records = []
        for entry in data[1]:
            if entry["value"] is not None:
                records.append({
                    "country":   country_code,
                    "indicator": indicator_name,
                    "year":      int(entry["date"]),
                    "value":     float(entry["value"])
                })

        return pd.DataFrame(records)

    except Exception as e:
        print(f"  ERROR fetching {indicator_name} for {country_code}: {e}")
        return None


def collect_all():
    """
    Loop through all countries and all indicators, save each as CSV
    """
    os.makedirs(RAW_DATA_PATH, exist_ok=True)

    all_frames = []

    for country in COUNTRIES:
        print(f"\n Country: {country}")
        for name, code in INDICATORS.items():
            df = fetch_indicator(country, code, name)
            if df is not None:
                all_frames.append(df)

    if not all_frames:
        print("\n No data was collected. Check your internet connection.")
        return

    # Combine everything into one big dataframe
    combined = pd.concat(all_frames, ignore_index=True)

    # Sort nicely
    combined = combined.sort_values(["country", "indicator", "year"])

    # Save to CSV
    output_path = os.path.join(RAW_DATA_PATH, "worldbank_data.csv")
    combined.to_csv(output_path, index=False)

    print(f"\n Done! Saved {len(combined)} rows to {output_path}")
    print(combined.head(10))


if __name__ == "__main__":
    collect_all()