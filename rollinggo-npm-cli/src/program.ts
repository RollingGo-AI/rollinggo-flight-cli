import { Command, CommanderError, Option } from "commander";

import { resolveApiKey } from "./auth.js";
import { requestApi } from "./client.js";
import { CABIN_GRADES, DEFAULT_BASE_URL, TRIP_TYPES } from "./constants.js";
import { ApiRequestError, CliValidationError } from "./errors.js";
import {
  type OutputFormat,
  buildAirportSearchPayload,
  buildFlightSearchPayload,
  outputFormatSchema,
} from "./payloads.js";
import { renderAirportTable, renderFlightTable, renderJson } from "./output.js";

const AI_HELP_TEXT = [
  "Recommended for AI agents: call standard subcommands with structured options,",
  "for example `rollinggo-flight search-airports --keyword ...`.",
  "Results are written to stdout as JSON by default.",
  "",
  "Parameter discovery: use `rollinggo-flight <command> --help` to inspect required options,",
  "accepted value formats, and command examples.",
].join("\n");

const SEARCH_AIRPORTS_EXAMPLE = [
  "Minimal example:",
  '  rollinggo-flight search-airports --api-key <key> --keyword "Hangzhou"',
].join("\n");

const SEARCH_FLIGHTS_EXAMPLE = [
  "Minimal example:",
  '  rollinggo-flight search-flights --api-key <key> --from-city HGH --to-city CTU --from-date 2026-05-01 --trip-type ONE_WAY --adult-number 1 --child-number 0 --cabin-grade ECONOMY',
].join("\n");

const COMMANDER_VALIDATION_CODES = new Set([
  "commander.missingMandatoryOptionValue",
  "commander.missingArgument",
  "commander.optionMissingArgument",
  "commander.unknownOption",
  "commander.excessArguments",
  "commander.unknownCommand",
  "commander.invalidArgument",
]);

export type ProgramDeps = {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
  requestApiImpl: typeof requestApi;
};

function parseInteger(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new CliValidationError(`Expected an integer but received ${value}.`);
  }
  return parsed;
}

function fail(message: string, exitCode: number): never {
  throw new CommanderError(exitCode, "rollinggo.error", message);
}

function ensureFormat(format: string, allowTable: boolean): OutputFormat {
  const parsed = outputFormatSchema.safeParse(format);
  if (!parsed.success) {
    throw new CliValidationError("Output format must be json or table.");
  }
  if (parsed.data === "table" && !allowTable) {
    throw new CliValidationError("--format table is only supported by search-airports and search-flights.");
  }
  return parsed.data;
}

function sharedOptions(command: Command): Command {
  return command
    .addOption(
      new Option(
        "--api-key <apiKey>",
        "RollingGo API key. If omitted, the CLI falls back to ROLLINGGO_API_KEY.",
      ),
    )
    .addOption(
      new Option(
        "--base-url <url>",
        "Base URL for the RollingGo flight API. Override only for testing or private deployments.",
      ).default(DEFAULT_BASE_URL),
    )
    .addOption(
      new Option(
        "--format <format>",
        "Output format. Use json for machine parsing.",
      ).default("json"),
    );
}

export function createProgram(
  deps: Partial<ProgramDeps> = {},
): Command {
  const stdout = deps.stdout ?? ((text: string) => process.stdout.write(text));
  const stderr = deps.stderr ?? ((text: string) => process.stderr.write(text));
  const requestApiImpl = deps.requestApiImpl ?? requestApi;

  const program = new Command();
  program
    .name("rollinggo-flight")
    .description("RollingGo flight search CLI.")
    .addHelpText("after", `\n${AI_HELP_TEXT}\n`)
    .showHelpAfterError()
    .exitOverride((error) => {
      if (COMMANDER_VALIDATION_CODES.has(error.code)) {
        throw new CommanderError(2, error.code, error.message);
      }
      throw error;
    })
    .action(() => {
      stdout(program.helpInformation());
      throw new CommanderError(0, "commander.helpDisplayed", "(outputHelp)");
    });

  sharedOptions(
    program
      .command("search-airports")
      .description("Search airports by keyword.")
      .addHelpText("after", `\n${SEARCH_AIRPORTS_EXAMPLE}\n`)
      .requiredOption(
        "--keyword <keyword>",
        "Search keyword. Use English city name, airport name, or IATA code. Examples: Hangzhou, HGH.",
      )
      .action(async (options) => {
        try {
          const format = ensureFormat(options.format, true);
          const payload = buildAirportSearchPayload({
            keyword: options.keyword,
          });
          const response = await requestApiImpl(
            "POST",
            "/mcp/airportsearch",
            resolveApiKey(options.apiKey),
            { baseUrl: options.baseUrl, payload },
          );
          stdout(format === "table" ? renderAirportTable(response) : renderJson(response));
        } catch (error) {
          if (error instanceof CliValidationError) {
            stderr(`${error.message}\n`);
            fail(error.message, 2);
          }
          if (error instanceof ApiRequestError) {
            stderr(`${error.message}\n`);
            fail(error.message, 1);
          }
          throw error;
        }
      }),
  );

  sharedOptions(
    program
      .command("search-flights")
      .description("Search flights with structured filters.")
      .addHelpText("after", `\n${SEARCH_FLIGHTS_EXAMPLE}\n`)
      .requiredOption(
        "--from-date <date>",
        "Departure date in YYYY-MM-DD format.",
      )
      .requiredOption(
        "--trip-type <type>",
        `Trip type. Supported values: ${TRIP_TYPES.join(", ")}.`,
      )
      .requiredOption(
        "--adult-number <count>",
        "Number of adults. Integer >= 1.",
        parseInteger,
      )
      .requiredOption(
        "--child-number <count>",
        "Number of children. Integer >= 0.",
        parseInteger,
      )
      .requiredOption(
        "--cabin-grade <grade>",
        `Cabin class. Supported values: ${CABIN_GRADES.join(", ")}.`,
      )
      .option(
        "--ret-date <date>",
        "Return date in YYYY-MM-DD format. Required when --trip-type is ROUND_TRIP.",
      )
      .option(
        "--from-city <code>",
        "Departure city code. Mutually exclusive with --from-airport.",
      )
      .option(
        "--from-airport <code>",
        "Departure airport code (IATA). Mutually exclusive with --from-city.",
      )
      .option(
        "--to-city <code>",
        "Arrival city code. Mutually exclusive with --to-airport.",
      )
      .option(
        "--to-airport <code>",
        "Arrival airport code (IATA). Mutually exclusive with --to-city.",
      )
      .action(async (options) => {
        try {
          const format = ensureFormat(options.format, true);
          const payload = buildFlightSearchPayload({
            adultNumber: options.adultNumber,
            childNumber: options.childNumber,
            cabinGrade: options.cabinGrade,
            fromDate: options.fromDate,
            tripType: options.tripType,
            retDate: options.retDate,
            fromCity: options.fromCity,
            fromAirport: options.fromAirport,
            toCity: options.toCity,
            toAirport: options.toAirport,
          });
          const response = await requestApiImpl(
            "POST",
            "/mcp/flightsearch",
            resolveApiKey(options.apiKey),
            { baseUrl: options.baseUrl, payload },
          );
          stdout(format === "table" ? renderFlightTable(response) : renderJson(response));
        } catch (error) {
          if (error instanceof CliValidationError) {
            stderr(`${error.message}\n`);
            fail(error.message, 2);
          }
          if (error instanceof ApiRequestError) {
            stderr(`${error.message}\n`);
            fail(error.message, 1);
          }
          throw error;
        }
      }),
  );

  program.configureOutput({
    writeOut: (text) => stdout(text),
    writeErr: (text) => stderr(text),
  });

  return program;
}
