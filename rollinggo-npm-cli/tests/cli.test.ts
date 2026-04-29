import { CommanderError } from "commander";
import { describe, expect, it, vi } from "vitest";

import { ApiRequestError } from "../src/errors.js";
import { createProgram } from "../src/program.js";

async function runProgram(argv: string[], requestApiImpl = vi.fn()) {
  const stdout: string[] = [];
  const stderr: string[] = [];

  const program = createProgram({
    stdout: (text) => {
      stdout.push(text);
    },
    stderr: (text) => {
      stderr.push(text);
    },
    requestApiImpl: requestApiImpl as any,
  });

  try {
    await program.parseAsync(argv, { from: "user" });
    return { stdout: stdout.join(""), stderr: stderr.join(""), code: 0 };
  } catch (error) {
    if (error instanceof CommanderError) {
      return {
        stdout: stdout.join(""),
        stderr: stderr.join(""),
        code: error.exitCode,
        message: error.message,
      };
    }
    throw error;
  }
}

describe("CLI", () => {
  it("renders top-level help", async () => {
    const result = await runProgram(["--help"]);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("search-airports");
    expect(result.stdout).toContain("search-flights");
    expect(result.stdout).toContain("Recommended for AI agents");
  });

  it("renders help when no args are provided", async () => {
    const result = await runProgram([]);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("RollingGo flight search CLI.");
    expect(result.stdout).toContain("search-airports");
  });

  it("renders detailed search-airports help", async () => {
    const result = await runProgram(["search-airports", "--help"]);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("Minimal example");
    expect(result.stdout).toContain("rollinggo-flight search-airports");
    expect(result.stdout).toContain("--keyword");
  });

  it("renders detailed search-flights help", async () => {
    const result = await runProgram(["search-flights", "--help"]);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("--from-date");
    expect(result.stdout).toContain("--trip-type");
    expect(result.stdout).toContain("--cabin-grade");
    expect(result.stdout).toContain("ROUND_TRIP");
  });

  it("returns exit code 2 for missing required search-airports args", async () => {
    const result = await runProgram(["search-airports", "--api-key", "cli-key"]);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("--keyword");
  });

  it("returns exit code 2 for missing required search-flights args", async () => {
    const result = await runProgram(["search-flights", "--api-key", "cli-key"]);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("--from-date");
  });

  it("prints pure JSON to stdout by default", async () => {
    const requestApiImpl = vi.fn().mockResolvedValue({
      airPortInformationList: [
        { airportCode: "HGH", airportName: "Hangzhou" },
      ],
    });

    const result = await runProgram(
      ["search-airports", "--api-key", "cli-key", "--keyword", "Hangzhou"],
      requestApiImpl,
    );

    expect(result.code).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("HGH");
    expect(result.stdout).toContain("Hangzhou");
  });

  it("renders airport table output", async () => {
    const requestApiImpl = vi.fn().mockResolvedValue({
      airPortInformationList: [
        { airportCode: "HGH", airportName: "Hangzhou" },
      ],
    });

    const result = await runProgram(
      ["search-airports", "--api-key", "cli-key", "--keyword", "Hangzhou", "--format", "table"],
      requestApiImpl,
    );

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("HGH");
  });

  it("returns exit code 1 for API failures", async () => {
    const result = await runProgram(
      ["search-airports", "--api-key", "cli-key", "--keyword", "Hangzhou"],
      vi.fn().mockRejectedValue(new ApiRequestError("server down")),
    );

    expect(result.code).toBe(1);
    expect(result.stderr).toContain("server down");
  });
});
