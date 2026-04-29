import pytest

from rollinggo_cli.models import (
    build_airport_search_payload,
    build_flight_search_payload,
)


def test_airport_search_payload():
    payload = build_airport_search_payload(keyword="Hangzhou")
    assert payload == {"keyword": "Hangzhou"}


def test_airport_search_payload_empty_keyword():
    with pytest.raises(Exception):
        build_airport_search_payload(keyword="")


def test_flight_search_one_way():
    payload = build_flight_search_payload(
        adult_number=1,
        child_number=0,
        cabin_grade="ECONOMY",
        from_date="2026-05-01",
        trip_type="ONE_WAY",
        from_city="HGH",
        to_city="CTU",
    )
    assert payload["adultNumber"] == 1
    assert payload["childNumber"] == 0
    assert payload["cabinGrade"] == "ECONOMY"
    assert payload["fromDate"] == "2026-05-01"
    assert payload["tripType"] == "ONE_WAY"
    assert payload["fromCity"] == "HGH"
    assert payload["toCity"] == "CTU"
    assert "retDate" not in payload


def test_flight_search_round_trip():
    payload = build_flight_search_payload(
        adult_number=2,
        child_number=1,
        cabin_grade="BUSINESS",
        from_date="2026-05-01",
        trip_type="ROUND_TRIP",
        ret_date="2026-05-10",
        from_airport="HGH",
        to_airport="TFU",
    )
    assert payload["retDate"] == "2026-05-10"
    assert payload["fromAirport"] == "HGH"
    assert payload["toAirport"] == "TFU"


def test_flight_search_round_trip_missing_ret_date():
    with pytest.raises(Exception):
        build_flight_search_payload(
            adult_number=1,
            child_number=0,
            cabin_grade="ECONOMY",
            from_date="2026-05-01",
            trip_type="ROUND_TRIP",
            from_city="HGH",
            to_city="CTU",
        )


def test_flight_search_missing_origin():
    with pytest.raises(Exception):
        build_flight_search_payload(
            adult_number=1,
            child_number=0,
            cabin_grade="ECONOMY",
            from_date="2026-05-01",
            trip_type="ONE_WAY",
            to_city="CTU",
        )


def test_flight_search_missing_destination():
    with pytest.raises(Exception):
        build_flight_search_payload(
            adult_number=1,
            child_number=0,
            cabin_grade="ECONOMY",
            from_date="2026-05-01",
            trip_type="ONE_WAY",
            from_city="HGH",
        )


def test_flight_search_invalid_date():
    with pytest.raises(Exception):
        build_flight_search_payload(
            adult_number=1,
            child_number=0,
            cabin_grade="ECONOMY",
            from_date="2026/05/01",
            trip_type="ONE_WAY",
            from_city="HGH",
            to_city="CTU",
        )
