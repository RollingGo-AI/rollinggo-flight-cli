import { describe, expect, it } from "vitest";

import {
  buildAirportSearchPayload,
  buildFlightSearchPayload,
} from "../src/payloads.js";

describe("payload builders", () => {
  it("builds airport search payload", () => {
    expect(buildAirportSearchPayload({ keyword: "Hangzhou" })).toEqual({
      keyword: "Hangzhou",
    });
  });

  it("rejects empty keyword", () => {
    expect(() => buildAirportSearchPayload({ keyword: "" })).toThrow();
  });

  it("builds one-way flight search payload", () => {
    const payload = buildFlightSearchPayload({
      adultNumber: 1,
      childNumber: 0,
      cabinGrade: "ECONOMY",
      fromDate: "2026-05-01",
      tripType: "ONE_WAY",
      fromCity: "HGH",
      toCity: "CTU",
    });
    expect(payload).toEqual({
      adultNumber: 1,
      childNumber: 0,
      cabinGrade: "ECONOMY",
      fromDate: "2026-05-01",
      tripType: "ONE_WAY",
      fromCity: "HGH",
      toCity: "CTU",
    });
  });

  it("builds round-trip flight search payload", () => {
    const payload = buildFlightSearchPayload({
      adultNumber: 2,
      childNumber: 1,
      cabinGrade: "BUSINESS",
      fromDate: "2026-05-01",
      tripType: "ROUND_TRIP",
      retDate: "2026-05-10",
      fromAirport: "HGH",
      toAirport: "TFU",
    });
    expect(payload.retDate).toBe("2026-05-10");
    expect(payload.fromAirport).toBe("HGH");
    expect(payload.toAirport).toBe("TFU");
  });

  it("rejects round-trip without retDate", () => {
    expect(() =>
      buildFlightSearchPayload({
        adultNumber: 1,
        childNumber: 0,
        cabinGrade: "ECONOMY",
        fromDate: "2026-05-01",
        tripType: "ROUND_TRIP",
        fromCity: "HGH",
        toCity: "CTU",
      }),
    ).toThrow(/retDate/);
  });

  it("rejects missing origin", () => {
    expect(() =>
      buildFlightSearchPayload({
        adultNumber: 1,
        childNumber: 0,
        cabinGrade: "ECONOMY",
        fromDate: "2026-05-01",
        tripType: "ONE_WAY",
        toCity: "CTU",
      }),
    ).toThrow(/fromCity/);
  });

  it("rejects missing destination", () => {
    expect(() =>
      buildFlightSearchPayload({
        adultNumber: 1,
        childNumber: 0,
        cabinGrade: "ECONOMY",
        fromDate: "2026-05-01",
        tripType: "ONE_WAY",
        fromCity: "HGH",
      }),
    ).toThrow(/toCity/);
  });

  it("rejects invalid date format", () => {
    expect(() =>
      buildFlightSearchPayload({
        adultNumber: 1,
        childNumber: 0,
        cabinGrade: "ECONOMY",
        fromDate: "2026/05/01",
        tripType: "ONE_WAY",
        fromCity: "HGH",
        toCity: "CTU",
      }),
    ).toThrow();
  });
});
