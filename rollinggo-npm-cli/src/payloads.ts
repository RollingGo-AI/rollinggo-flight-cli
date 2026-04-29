import { z } from "zod";

import { CABIN_GRADES, TRIP_TYPES } from "./constants.js";
import { CliValidationError } from "./errors.js";

export const outputFormatSchema = z.enum(["json", "table"]);
export type OutputFormat = z.infer<typeof outputFormatSchema>;

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD.");

function formatZodError(error: z.ZodError): string {
  const issue = error.issues[0];
  const path = issue.path.join(".") || "input";
  return `Invalid value for ${path}: ${issue.message}`;
}

const airportSearchInputSchema = z.object({
  keyword: z.string().min(1),
});

const flightSearchInputSchema = z
  .object({
    adultNumber: z.number().int().min(1),
    childNumber: z.number().int().min(0),
    cabinGrade: z.enum(CABIN_GRADES),
    fromDate: isoDateSchema,
    tripType: z.enum(TRIP_TYPES),
    retDate: isoDateSchema.optional(),
    fromCity: z.string().optional(),
    fromAirport: z.string().optional(),
    toCity: z.string().optional(),
    toAirport: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.tripType === "ROUND_TRIP" && !value.retDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "retDate is required when tripType is ROUND_TRIP.",
        path: ["retDate"],
      });
    }

    if (!value.fromCity && !value.fromAirport) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide either fromCity or fromAirport.",
        path: ["fromCity"],
      });
    }

    if (!value.toCity && !value.toAirport) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide either toCity or toAirport.",
        path: ["toCity"],
      });
    }
  });

export function buildAirportSearchPayload(input: {
  keyword: string;
}): Record<string, unknown> {
  const parsed = airportSearchInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new CliValidationError(formatZodError(parsed.error));
  }

  return { keyword: parsed.data.keyword };
}

export function buildFlightSearchPayload(input: {
  adultNumber: number;
  childNumber: number;
  cabinGrade: string;
  fromDate: string;
  tripType: string;
  retDate?: string;
  fromCity?: string;
  fromAirport?: string;
  toCity?: string;
  toAirport?: string;
}): Record<string, unknown> {
  const parsed = flightSearchInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new CliValidationError(formatZodError(parsed.error));
  }

  const value = parsed.data;
  const payload: Record<string, unknown> = {
    adultNumber: value.adultNumber,
    childNumber: value.childNumber,
    cabinGrade: value.cabinGrade,
    fromDate: value.fromDate,
    tripType: value.tripType,
  };

  if (value.retDate) {
    payload.retDate = value.retDate;
  }
  if (value.fromCity) {
    payload.fromCity = value.fromCity;
  }
  if (value.fromAirport) {
    payload.fromAirport = value.fromAirport;
  }
  if (value.toCity) {
    payload.toCity = value.toCity;
  }
  if (value.toAirport) {
    payload.toAirport = value.toAirport;
  }

  return payload;
}
