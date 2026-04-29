import { CliValidationError } from "./errors.js";

export function resolveApiKey(
  cliApiKey?: string,
  env: NodeJS.ProcessEnv = process.env,
): string {
  if (cliApiKey) {
    return cliApiKey;
  }

  if (env.ROLLINGGO_API_KEY) {
    return env.ROLLINGGO_API_KEY;
  }

  throw new CliValidationError(
    "Missing API key. Pass --api-key or set ROLLINGGO_API_KEY.",
  );
}
