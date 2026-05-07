import os

BASE_URL_STAGING = "https://travelportal-api-staging.aigohotel.com"
BASE_URL_PRODUCTION = "https://mcp.rollinggo.cn"
DEFAULT_BASE_URL = os.getenv("ROLLINGGO_API_BASE_URL", BASE_URL_PRODUCTION)

CABIN_GRADES = (
    "ECONOMY",
    "PREMIUM_ECONOMY",
    "BUSINESS",
    "FIRST",
)

TRIP_TYPES = (
    "ONE_WAY",
    "ROUND_TRIP",
)

AIRPORT_TABLE_COLUMNS = [
    ("airportCode", "airportCode"),
    ("airportName", "airportName"),
    ("cityCode", "cityCode"),
    ("cityName", "cityName"),
    ("countryCode", "countryCode"),
    ("countryName", "countryName"),
]

FLIGHT_TABLE_COLUMNS = [
    ("flightNo", "flightNo"),
    ("airlineName", "airlineName"),
    ("fromAirport", "fromAirport"),
    ("toAirport", "toAirport"),
    ("fromDate", "fromDate"),
    ("price", "price"),
    ("currency", "currency"),
]
