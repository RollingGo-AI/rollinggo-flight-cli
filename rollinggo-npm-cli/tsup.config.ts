import { defineConfig } from "tsup";

export default defineConfig([
  {
    // ESM bundle for npm/npx distribution
    clean: true,
    entry: ["src/cli.ts"],
    format: ["esm"],
    outDir: "dist",
    platform: "node",
    target: "node18",
    banner: {
      js: "#!/usr/bin/env node",
    },
  },
  {
    // CJS bundle for pkg standalone binary packaging
    entry: ["src/cli.ts"],
    format: ["cjs"],
    outDir: "dist",
    platform: "node",
    target: "node18",
    outExtension: () => ({ js: ".cjs" }),
    noExternal: [/.*/],
  },
]);
