from __future__ import annotations

from typing import Annotated

import typer

from .api import request_api, resolve_api_key
from .constants import CABIN_GRADES, DEFAULT_BASE_URL, TRIP_TYPES
from .errors import ApiRequestError, CliValidationError
from .models import build_airport_search_payload, build_flight_search_payload
from .output import print_airport_table, print_flight_table, print_json

AI_HELP_TEXT = (
    "RollingGo flight CLI.\n\n"
    "Recommended for AI agents: call standard subcommands with structured options, "
    "for example `rollinggo-flight search-airports --keyword ...`. "
    "Results are written to stdout as JSON by default.\n\n"
    "Parameter discovery: use `rollinggo-flight <command> --help` to inspect required options, "
    "accepted value formats, and command examples."
)

SEARCH_AIRPORTS_EXAMPLE = (
    "Minimal example:\n"
    '  rollinggo-flight search-airports --api-key <key> --keyword "Hangzhou"'
)

SEARCH_FLIGHTS_EXAMPLE = (
    "Minimal example:\n"
    '  rollinggo-flight search-flights --api-key <key> --from-city HGH --to-city CTU '
    '--from-date 2026-05-01 --trip-type ONE_WAY --adult-number 1 --child-number 0 --cabin-grade ECONOMY'
)

app = typer.Typer(
    no_args_is_help=True,
    add_completion=False,
    help=AI_HELP_TEXT,
)


def _handle_error(exc: Exception, exit_code: int) -> None:
    typer.echo(str(exc), err=True)
    raise typer.Exit(code=exit_code) from exc


def _resolve_format(output_format: str, *, allow_table: bool) -> str:
    if output_format not in ("json", "table"):
        raise CliValidationError("Output format must be json or table.")
    if output_format == "table" and not allow_table:
        raise CliValidationError("--format table is only supported by search-airports and search-flights.")
    return output_format


@app.command(
    "search-airports",
    help="Search airports by keyword.",
    epilog=SEARCH_AIRPORTS_EXAMPLE,
)
def search_airports(
    keyword: Annotated[
        str,
        typer.Option(
            "--keyword",
            help="Search keyword. Use English city name, airport name, or IATA code. Examples: Hangzhou, HGH.",
        ),
    ],
    api_key: Annotated[
        str | None,
        typer.Option(
            "--api-key",
            help="RollingGo API key. If omitted, the CLI falls back to ROLLINGGO_API_KEY.",
        ),
    ] = None,
    base_url: Annotated[
        str,
        typer.Option(
            "--base-url",
            help="Base URL for the RollingGo flight API. Override only for testing or private deployments.",
        ),
    ] = DEFAULT_BASE_URL,
    output_format: Annotated[
        str,
        typer.Option(
            "--format",
            help="Output format. Use json for machine parsing.",
        ),
    ] = "json",
) -> None:
    try:
        output_format = _resolve_format(output_format, allow_table=True)
        payload = build_airport_search_payload(keyword=keyword)
        result = request_api(
            "POST",
            "/mcp/airportsearch",
            resolve_api_key(api_key),
            base_url=base_url,
            payload=payload,
        )
        if output_format == "table":
            print_airport_table(result)
        else:
            print_json(result)
    except CliValidationError as exc:
        _handle_error(exc, 2)
    except ApiRequestError as exc:
        _handle_error(exc, 1)


@app.command(
    "search-flights",
    help="Search flights with structured filters.",
    epilog=SEARCH_FLIGHTS_EXAMPLE,
)
def search_flights(
    from_date: Annotated[
        str,
        typer.Option(
            "--from-date",
            help="Departure date in YYYY-MM-DD format.",
        ),
    ],
    trip_type: Annotated[
        str,
        typer.Option(
            "--trip-type",
            help=f"Trip type. Supported values: {', '.join(TRIP_TYPES)}.",
        ),
    ],
    adult_number: Annotated[
        int,
        typer.Option(
            "--adult-number",
            help="Number of adults. Integer >= 1.",
        ),
    ],
    child_number: Annotated[
        int,
        typer.Option(
            "--child-number",
            help="Number of children. Integer >= 0.",
        ),
    ],
    cabin_grade: Annotated[
        str,
        typer.Option(
            "--cabin-grade",
            help=f"Cabin class. Supported values: {', '.join(CABIN_GRADES)}.",
        ),
    ],
    api_key: Annotated[
        str | None,
        typer.Option(
            "--api-key",
            help="RollingGo API key. If omitted, the CLI falls back to ROLLINGGO_API_KEY.",
        ),
    ] = None,
    base_url: Annotated[
        str,
        typer.Option(
            "--base-url",
            help="Base URL for the RollingGo flight API. Override only for testing or private deployments.",
        ),
    ] = DEFAULT_BASE_URL,
    output_format: Annotated[
        str,
        typer.Option(
            "--format",
            help="Output format. Use json for machine parsing.",
        ),
    ] = "json",
    ret_date: Annotated[
        str | None,
        typer.Option(
            "--ret-date",
            help="Return date in YYYY-MM-DD format. Required when --trip-type is ROUND_TRIP.",
        ),
    ] = None,
    from_city: Annotated[
        str | None,
        typer.Option(
            "--from-city",
            help="Departure city code. Mutually exclusive with --from-airport.",
        ),
    ] = None,
    from_airport: Annotated[
        str | None,
        typer.Option(
            "--from-airport",
            help="Departure airport code (IATA). Mutually exclusive with --from-city.",
        ),
    ] = None,
    to_city: Annotated[
        str | None,
        typer.Option(
            "--to-city",
            help="Arrival city code. Mutually exclusive with --to-airport.",
        ),
    ] = None,
    to_airport: Annotated[
        str | None,
        typer.Option(
            "--to-airport",
            help="Arrival airport code (IATA). Mutually exclusive with --to-city.",
        ),
    ] = None,
) -> None:
    try:
        output_format = _resolve_format(output_format, allow_table=True)
        payload = build_flight_search_payload(
            adult_number=adult_number,
            child_number=child_number,
            cabin_grade=cabin_grade,
            from_date=from_date,
            trip_type=trip_type,
            ret_date=ret_date,
            from_city=from_city,
            from_airport=from_airport,
            to_city=to_city,
            to_airport=to_airport,
        )
        result = request_api(
            "POST",
            "/mcp/flightsearch",
            resolve_api_key(api_key),
            base_url=base_url,
            payload=payload,
        )
        if output_format == "table":
            print_flight_table(result)
        else:
            print_json(result)
    except CliValidationError as exc:
        _handle_error(exc, 2)
    except ApiRequestError as exc:
        _handle_error(exc, 1)


def main() -> None:
    app()


if __name__ == "__main__":
    main()
