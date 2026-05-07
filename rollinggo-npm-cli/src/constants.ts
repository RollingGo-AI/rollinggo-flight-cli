export const BASE_URL_STAGING = "https://travelportal-api-staging.aigohotel.com";
export const BASE_URL_PRODUCTION = "https://mcp.rollinggo.cn";
export const DEFAULT_BASE_URL = process.env.ROLLINGGO_API_BASE_URL || BASE_URL_PRODUCTION;

export const CABIN_GRADES = [
  "ECONOMY",
  "PREMIUM_ECONOMY",
  "BUSINESS",
  "FIRST",
] as const;

export const TRIP_TYPES = ["ONE_WAY", "ROUND_TRIP"] as const;

export const AIRPORT_TABLE_COLUMNS = [
  ["airportCode", "airportCode"],
  ["airportName", "airportName"],
  ["cityCode", "cityCode"],
  ["cityName", "cityName"],
  ["countryCode", "countryCode"],
  ["countryName", "countryName"],
] as const;

export const FLIGHT_TABLE_COLUMNS = [
  ["flightNo", "flightNo"],
  ["airlineName", "airlineName"],
  ["fromAirport", "fromAirport"],
  ["toAirport", "toAirport"],
  ["fromDate", "fromDate"],
  ["price", "price"],
  ["currency", "currency"],
] as const;
