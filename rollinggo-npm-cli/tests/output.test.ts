import { describe, expect, it } from "vitest";

import { renderFlightTable } from "../src/output.js";

describe("flight table rendering", () => {
  it("renders current flightInformationList response shape", () => {
    const output = renderFlightTable({
      flightInformationList: [
        {
          totalAdultPrice: 625,
          currency: "CNY",
          validatingCarrier: "CA",
          fromSegments: [
            {
              flightNumber: "CA4598",
              depTime: "2026-05-10T20:00:00",
              arrTime: "2026-05-10T23:00:00",
              depAirport: "HGH",
              arrAirport: "CTU",
            },
          ],
        },
      ],
    });

    expect(output).toContain("CA4598");
    expect(output).toContain("CA");
    expect(output).toContain("HGH");
    expect(output).toContain("CTU");
    expect(output).toContain("2026-05-10 20:00");
    expect(output).toContain("625");
    expect(output).toContain("CNY");
  });

  it("joins multiple segment flight numbers into one row", () => {
    const output = renderFlightTable({
      flightInformationList: [
        {
          totalAdultPrice: 4096,
          currency: "CNY",
          validatingCarrier: "CZ",
          fromSegments: [
            {
              flightNumber: "CZ3850",
              depTime: "2026-05-10T15:35:00",
              depAirport: "HGH",
              arrAirport: "CAN",
            },
            {
              flightNumber: "CZ3413",
              depTime: "2026-05-10T20:15:00",
              depAirport: "CAN",
              arrAirport: "CTU",
            },
          ],
        },
      ],
    });

    expect(output).toContain("CZ3850 / CZ3413");
    expect(output).toContain("CTU");
    expect(output).toContain("4096");
  });
});
