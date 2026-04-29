# RollingGo Flight CLI

RollingGo flight search CLI for uvx.

## Install

```bash
uvx rollinggo-flight search-airports --keyword Hangzhou
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
