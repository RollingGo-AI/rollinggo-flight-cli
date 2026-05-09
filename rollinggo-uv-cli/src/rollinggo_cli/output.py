from __future__ import annotations

import json
import sys
from typing import Any

from rich.console import Console
from rich.table import Table

from .constants import AIRPORT_TABLE_COLUMNS, FLIGHT_TABLE_COLUMNS


def remove_field(data: Any, field_name: str) -> Any:
    if isinstance(data, dict):
        return {
            key: remove_field(value, field_name)
            for key, value in data.items()
            if key != field_name
        }
    if isinstance(data, list):
        return [remove_field(item, field_name) for item in data]
    return data


def print_json(data: Any) -> None:
    sys.stdout.write(json.dumps(data, ensure_ascii=False, indent=2))
    sys.stdout.write("\n")


def _find_rows(data: Any, identifier_keys: tuple[str, ...]) -> list[dict[str, Any]]:
    if isinstance(data, list):
        return [row for row in data if isinstance(row, dict)]

    if isinstance(data, dict):
        if any(key in data for key in identifier_keys):
            return [data]

        for key in ("data", "airPortInformationList", "flightInformationList", "items", "results", "list"):
            value = data.get(key)
            if isinstance(value, list):
                return [row for row in value if isinstance(row, dict)]
            if isinstance(value, dict):
                nested_rows = _find_rows(value, identifier_keys)
                if nested_rows:
                    return nested_rows

        for value in data.values():
            nested_rows = _find_rows(value, identifier_keys)
            if nested_rows:
                return nested_rows

    return []


def _as_record(value: Any) -> dict[str, Any] | None:
    return value if isinstance(value, dict) else None


def _format_datetime(value: Any) -> str:
    if not isinstance(value, str):
        return ""
    if "T" in value:
        return value.replace("T", " ")[:16]
    return value


def _coalesce(*values: Any) -> Any:
    for value in values:
        if value is not None:
            return value
    return ""


def _normalize_flight_row(row: dict[str, Any]) -> dict[str, Any]:
    if any(key in row for key in ("flightNo", "airlineName", "price")):
        return row

    from_segments = []
    if isinstance(row.get("fromSegments"), list):
        from_segments = [segment for segment in (_as_record(item) for item in row["fromSegments"]) if segment is not None]

    first_segment = from_segments[0] if from_segments else {}
    last_segment = from_segments[-1] if from_segments else first_segment
    flight_numbers = " / ".join(
        flight_number
        for flight_number in (segment.get("flightNumber") for segment in from_segments)
        if isinstance(flight_number, str) and flight_number
    )

    return {
        "flightNo": flight_numbers,
        "airlineName": row.get("validatingCarrier")
        or first_segment.get("airlineName")
        or first_segment.get("carrierCode")
        or "",
        "fromAirport": first_segment.get("depAirport") or row.get("fromAirport") or row.get("fromCity") or "",
        "toAirport": last_segment.get("arrAirport") or row.get("toAirport") or row.get("toCity") or "",
        "fromDate": _format_datetime(first_segment.get("depTime") or row.get("fromDate")),
        "price": _coalesce(row.get("totalAdultPrice"), row.get("price"), row.get("totalPrice")),
        "currency": row.get("currency") or "",
    }


def print_airport_table(data: Any) -> None:
    table = Table()
    for header, _ in AIRPORT_TABLE_COLUMNS:
        table.add_column(header)

    for row in _find_rows(data, ("airportCode", "airportName")):
        table.add_row(*[str(row.get(key, "")) for _, key in AIRPORT_TABLE_COLUMNS])

    console = Console(file=sys.stdout, width=120)
    console.print(table)


def print_flight_table(data: Any) -> None:
    table = Table()
    for header, _ in FLIGHT_TABLE_COLUMNS:
        table.add_column(header)

    for row in _find_rows(data, ("flightNo", "airlineName", "fromSegments", "validatingCarrier")):
        normalized_row = _normalize_flight_row(row)
        table.add_row(*[str(normalized_row.get(key, "")) for _, key in FLIGHT_TABLE_COLUMNS])

    console = Console(file=sys.stdout, width=120)
    console.print(table)
