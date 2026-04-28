# config.py
# Central settings for the whole backend

COUNTRIES = [
    "MY",  # Malaysia
    "PH",  # Philippines
    "ID",  # Indonesia
    "BD",  # Bangladesh
    "KE",  # Kenya
    "NG",  # Nigeria
    "ET",  # Ethiopia
    "PK",  # Pakistan
    "MM",  # Myanmar
    "KH",  # Cambodia
    "VN",  # Vietnam
    "TZ",  # Tanzania
    "UG",  # Uganda
    "MZ",  # Mozambique
    "ZM",  # Zambia
    "SD",  # Sudan
    "YE",  # Yemen
    "HT",  # Haiti
    "NP",  # Nepal
    "LA",  # Laos
    "SN",  # Senegal
    "MG",  # Madagascar
    "ML",  # Mali
    "GH",  # Ghana
    "ZW",  # Zimbabwe
]

# World Bank indicator codes
INDICATORS = {
    "school_enrollment":   "SE.PRM.NENR",
    "unemployment_rate":   "SL.UEM.TOTL.ZS",
    "gdp_per_capita":      "NY.GDP.PCAP.CD",
    "poverty_headcount":   "SI.POV.DDAY",
    "population":          "SP.POP.TOTL",
    "agriculture_value":   "NV.AGR.TOTL.ZS",
}

# How many years of history to pull
YEARS_BACK = 10

# Fragility score thresholds
SCORE_STABLE   = 20
SCORE_WATCH    = 40
SCORE_ELEVATED = 60
SCORE_DANGER   = 80

# Folder paths
RAW_DATA_PATH = "data/raw"