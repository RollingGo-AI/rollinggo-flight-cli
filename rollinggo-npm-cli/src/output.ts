import Table from "cli-table3";

import { AIRPORT_TABLE_COLUMNS, FLIGHT_TABLE_COLUMNS } from "./constants.js";

type OutputRow = Record<string, unknown>;

export function removeField(data: unknown, fieldName: string): unknown {
  if (Array.isArray(data)) {
    return data.map((item) => removeField(item, fieldName));
  }

  if (data && typeof data === "object") {
    return Object.fromEntries(
      Object.entries(data as Record<string, unknown>)
        .filter(([key]) => key !== fieldName)
        .map(([key, value]) => [key, removeField(value, fieldName)]),
    );
  }

  return data;
}

export function renderJson(data: unknown): string {
  return `${JSON.stringify(data, null, 2)}\n`;
}

function findRows(data: unknown, identifierKeys: string[]): Record<string, unknown>[] {
  if (Array.isArray(data)) {
    return data.filter((item): item is Record<string, unknown> => !!item && typeof item === "object");
  }

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (identifierKeys.some((key) => key in record)) {
      return [record];
    }

    for (const key of ["data", "airPortInformationList", "flightInformationList", "items", "results", "list"]) {
      const value = record[key];
      if (Array.isArray(value)) {
        return value.filter((item): item is Record<string, unknown> => !!item && typeof item === "object");
      }
      if (value && typeof value === "object") {
        const nested = findRows(value, identifierKeys);
        if (nested.length > 0) {
          return nested;
        }
      }
    }

    for (const value of Object.values(record)) {
      const nested = findRows(value, identifierKeys);
      if (nested.length > 0) {
        return nested;
      }
    }
  }

  return [];
}

function asRecord(value: unknown): OutputRow | null {
  return value && typeof value === "object" ? (value as OutputRow) : null;
}

function formatDateTime(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.includes("T") ? value.replace("T", " ").slice(0, 16) : value;
}

function normalizeFlightRow(row: OutputRow): OutputRow {
  if ("flightNo" in row || "airlineName" in row || "price" in row) {
    return row;
  }

  const fromSegments = Array.isArray(row.fromSegments)
    ? row.fromSegments.map(asRecord).filter((segment): segment is OutputRow => segment !== null)
    : [];
  const firstSegment = fromSegments[0];
  const lastSegment = fromSegments[fromSegments.length - 1] ?? firstSegment;
  const flightNumbers = fromSegments
    .map((segment) => segment.flightNumber)
    .filter((flightNumber): flightNumber is string => typeof flightNumber === "string" && flightNumber.length > 0)
    .join(" / ");

  return {
    flightNo: flightNumbers,
    airlineName:
      row.validatingCarrier ??
      firstSegment?.airlineName ??
      firstSegment?.carrierCode ??
      "",
    fromAirport: firstSegment?.depAirport ?? row.fromAirport ?? row.fromCity ?? "",
    toAirport: lastSegment?.arrAirport ?? row.toAirport ?? row.toCity ?? "",
    fromDate: formatDateTime(firstSegment?.depTime ?? row.fromDate),
    price: row.totalAdultPrice ?? row.price ?? row.totalPrice ?? "",
    currency: row.currency ?? "",
  };
}

export function renderAirportTable(data: unknown): string {
  const table = new Table({
    head: AIRPORT_TABLE_COLUMNS.map(([header]) => header),
  });

  for (const row of findRows(data, ["airportCode", "airportName"])) {
    table.push(AIRPORT_TABLE_COLUMNS.map(([, key]) => String(row[key] ?? "")));
  }

  return `${table.toString()}\n`;
}

export function renderFlightTable(data: unknown): string {
  const table = new Table({
    head: FLIGHT_TABLE_COLUMNS.map(([header]) => header),
  });

  for (const row of findRows(data, ["flightNo", "airlineName", "fromSegments", "validatingCarrier"])) {
    const normalizedRow = normalizeFlightRow(row);
    table.push(FLIGHT_TABLE_COLUMNS.map(([, key]) => String(normalizedRow[key] ?? "")));
  }

  return `${table.toString()}\n`;
}
