# RollingGo Flight CLI (Node.js / npm)

RollingGo flight search CLI for npm and npx.

## Install

```bash
# Run directly (recommended)
npx rollinggo-flight --help

# Or install globally
npm install -g rollinggo-flight
```

## Usage

Set your API key via environment variable or `--api-key` flag:

```bash
export ROLLINGGO_API_KEY=your_key   # Linux/macOS
$env:ROLLINGGO_API_KEY="your_key"   # Windows PowerShell
```

## Commands

### search-airports

Search airports by keyword.

```bash
rollinggo-flight search-airports --api-key <key> --keyword "Hangzhou"
```

### search-flights

Search flights with structured filters.

```bash
rollinggo-flight search-flights --api-key <key> \
  --from-city HGH --to-city CTU \
  --from-date 2026-05-01 --trip-type ONE_WAY \
  --adult-number 1 --child-number 0 --cabin-grade ECONOMY
```
