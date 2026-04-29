from __future__ import annotations

import re
from datetime import date
from typing import Any, Literal

from pydantic import BaseModel, Field, ValidationError, field_validator, model_validator

from .constants import CABIN_GRADES, TRIP_TYPES
from .errors import CliValidationError

OutputFormat = Literal["json", "table"]

DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def _error_message(exc: ValidationError) -> str:
    first_error = exc.errors()[0]
    location = ".".join(str(part) for part in first_error["loc"])
    return f"Invalid value for {location}: {first_error['msg']}"


def _validate_date(value: str, field_name: str) -> None:
    if not DATE_RE.fullmatch(value):
        raise CliValidationError(f"{field_name} must use YYYY-MM-DD format.")


class AirportSearchInput(BaseModel):
    keyword: str = Field(min_length=1)

    def to_payload(self) -> dict[str, Any]:
        return {"keyword": self.keyword}


class FlightSearchInput(BaseModel):
    adult_number: int = Field(ge=1)
    child_number: int = Field(ge=0)
    cabin_grade: Literal["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"]
    from_date: str
    trip_type: Literal["ONE_WAY", "ROUND_TRIP"]
    ret_date: str | None = None
    from_city: str | None = None
    from_airport: str | None = None
    to_city: str | None = None
    to_airport: str | None = None

    @field_validator("from_date", "ret_date", mode="before")
    @classmethod
    def validate_date_format(cls, value: str | None) -> str | None:
        if value is not None:
            _validate_date(value, "date")
        return value

    @model_validator(mode="after")
    def validate_flight_search(self) -> "FlightSearchInput":
        if self.trip_type == "ROUND_TRIP" and not self.ret_date:
            raise ValueError("retDate is required when tripType is ROUND_TRIP.")
        if not self.from_city and not self.from_airport:
            raise ValueError("Provide either from_city or from_airport.")
        if not self.to_city and not self.to_airport:
            raise ValueError("Provide either to_city or to_airport.")
        return self

    def to_payload(self) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "adultNumber": self.adult_number,
            "childNumber": self.child_number,
            "cabinGrade": self.cabin_grade,
            "fromDate": self.from_date,
            "tripType": self.trip_type,
        }

        if self.ret_date:
            payload["retDate"] = self.ret_date
        if self.from_city:
            payload["fromCity"] = self.from_city
        if self.from_airport:
            payload["fromAirport"] = self.from_airport
        if self.to_city:
            payload["toCity"] = self.to_city
        if self.to_airport:
            payload["toAirport"] = self.to_airport

        return payload


def build_airport_search_payload(**kwargs: Any) -> dict[str, Any]:
    try:
        payload = AirportSearchInput(**kwargs)
    except ValidationError as exc:
        raise CliValidationError(_error_message(exc)) from exc
    return payload.to_payload()


def build_flight_search_payload(**kwargs: Any) -> dict[str, Any]:
    try:
        payload = FlightSearchInput(**kwargs)
    except ValidationError as exc:
        raise CliValidationError(_error_message(exc)) from exc
    return payload.to_payload()
