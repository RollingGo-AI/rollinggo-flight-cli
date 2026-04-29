import Table from "cli-table3";

import { AIRPORT_TABLE_COLUMNS, FLIGHT_TABLE_COLUMNS } from "./constants.js";

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

  for (const row of findRows(data, ["flightNo", "airlineName"])) {
    table.push(FLIGHT_TABLE_COLUMNS.map(([, key]) => String(row[key] ?? "")));
  }

  return `${table.toString()}\n`;
}
