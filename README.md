# PancakeSwapAI

A TypeScript monorepo for an **AI-driven, multi-agent PancakeSwap trading system** with a real-time observability dashboard.

- **Backend:** market ingestion, signal extraction, regime detection, strategy selection, risk gating, and execution simulation.
- **Frontend (Next.js):** live monitor for regime, strategy decisions, temporal signals, risk/execution outputs, and historical timeline.
- **Mode:** currently demo-safe focused (dry-run style behavior and transparent state exports).

---

## Table of contents

- [Project goals](#project-goals)
- [System architecture](#system-architecture)
- [Repository structure](#repository-structure)
- [How data flows](#how-data-flows)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [API](#api)
- [Dashboard](#dashboard)
- [Build and deployment notes](#build-and-deployment-notes)
- [Troubleshooting](#troubleshooting)
- [Roadmap ideas](#roadmap-ideas)

---

## Project goals

This repo is designed to make algorithmic decision-making observable end-to-end:

1. Collect market state from configurable sources.
2. Compute cross-pool + temporal signals.
3. Detect market regime (for adaptive behavior).
4. Choose strategy opportunities.
5. Apply risk checks.
6. Simulate/plan execution.
7. Export structured state for UI + auditability.

The priority is **decision quality and explainability** before live-capital execution.

---

## System architecture

### Backend pipeline (Node + TypeScript)

The backend runs an infinite loop and executes this sequence each cycle:

1. `market` agent returns normalized market state.
2. History is updated and temporal/cross-pool signals are extracted.
3. Regime is detected (`TRENDING`, `MEAN_REVERTING`, `VOLATILE`, etc.).
4. `strategy` agent chooses the best opportunity across strategy modules.
5. `risk` agent approves/rejects.
6. `execution` agent simulates/executes trade output.
7. State is exported for dashboard and `/state` consumers.

### Frontend dashboard (Next.js App Router)

The dashboard polls backend state every 2 seconds and renders:

- Live monitor status
- Current regime + temporal metrics
- Selected strategy and confidence/profit metrics
- Memory/simulation/decision cards
- Timeline of recent cycle decisions
- Per-agent pages, logs page, and settings page

---

## Repository structure

```text
.
├── agents/                 # market/strategy/risk/execution/portfolio logic
├── core/                   # pipeline, signals, regime, history, export, market-data adapters
├── strategies/             # strategy modules used by strategy agent
├── shared/                 # shared domain types
├── server.ts               # Express server + /state endpoint
├── index.ts                # process bootstrap + pipeline loop
├── config.ts               # runtime defaults + market-data config sync
└── dashboard/              # Next.js dashboard application
    ├── app/                # routes/pages and API route
    ├── components/         # UI building blocks
    └── public/             # default JSON config + static assets
```

---

## How data flows

1. Backend cycle runs (`runPipeline`).
2. In-memory latest state is updated.
3. Snapshot is exported to `latest_state.json`.
4. `GET /state` serves in-memory state first; falls back to file.
5. Dashboard hook fetches remote `/state` on 2-second intervals.
6. UI normalizes data and visualizes regime, strategy, and risk/execution context.

This design gives both:

- **Low-latency UI updates** (in-memory path)
- **Durable fallback** (`latest_state.json`)

---

## Getting started

### Prerequisites

- Node.js 20+
- npm 10+

### 1) Install dependencies

```bash
npm install
npm --prefix dashboard install
```

### 2) Build backend

```bash
npm run build
```

### 3) Start backend only

```bash
npm start
```

By default backend binds to `0.0.0.0:${PORT:-3000}`.

### 4) Run dashboard in development

In another terminal:

```bash
npm run dev:frontend
```

Dashboard default URL is typically `http://localhost:3000` for Next.js dev server, unless port is occupied.

### 5) Run backend + frontend together

```bash
npm run dev
```

> Note: `dev` starts compiled backend (`dist/index.js`) and Next.js dev server concurrently. Ensure backend was built first (`npm run build`) or use `npm run dev:full`.

---

## Configuration

### Environment variables

| Variable | Required | Purpose |
|---|---:|---|
| `PRIVATE_KEY` | Optional in demo mode | Wallet key for real execution paths |
| `PORT` | Optional | Backend listen port (default `3000`) |
| `MARKET_DATA_SOURCE` | Optional | Initial source (`ON_CHAIN`, `DEXSCREENER`, `SUBGRAPH`) |
| `SIGNAL_NOISE_SEED` | Optional | Seed used for deterministic signal noise |
| `RAILWAY_GIT_COMMIT_SHA` / `GITHUB_SHA` / `VERCEL_GIT_COMMIT_SHA` | Optional | Commit metadata shown in boot logs |

### Runtime defaults

`config.ts` defines defaults for:

- chain/RPC (BSC)
- slippage, gas, trade sizing
- temporal-signal noise settings
- poll interval
- market-data fallback order

### Market data source config file

The backend can sync data-source preferences from disk:

- `dashboard/public/market_data_config.json`
- fallback: `public/market_data_config.json`

Dashboard settings API writes to dashboard public config via:

- `GET /api/market-data`
- `POST /api/market-data`

---

## API

### `GET /`

Health text response:

- `Backend alive`

### `GET /state`

Returns:

1. Latest in-memory exported state, if valid.
2. Fallback JSON from `latest_state.json`, if valid.
3. Otherwise:

```json
{ "status": "starting" }
```

---

## Dashboard

The dashboard includes these primary routes:

- `/` live monitor
- `/logs`
- `/agents/market`
- `/agents/strategy`
- `/agents/risk`
- `/agents/execution`
- `/agents/portfolio`
- `/liquidity`
- `/settings`

### Important note for local development

The current live-state hook fetch target is hardcoded to:

- `https://pancakeswapai-production.up.railway.app/state`

If you want local dashboard + local backend integration, update that URL in:

- `dashboard/app/hooks/useLiveState.ts`

---

## Build and deployment notes

This project expects a strict backend start contract:

1. `npm run build`
2. `npm start`

`npm start` launches `node dist/index.js`, and `prestart` enforces fresh build generation.

Additional resiliency behavior:

- fatal handlers for `uncaughtException` and `unhandledRejection`
- fatal exit on server listen errors (useful for managed platform restart loops)

---

## Troubleshooting

### Dashboard shows "Waiting for first cycle..."

- Confirm backend loop is running and not crashing.
- Check `/state` response directly.
- Verify state export path permissions for `latest_state.json`.

### Dashboard does not reflect local backend

- Update hardcoded remote URL in `useLiveState.ts` to local backend URL.

### Backend returns `{ "status": "starting" }`

- In-memory state may not be initialized yet.
- `latest_state.json` may be missing or malformed.

---

## Roadmap ideas

- Switch dashboard fetch URL to environment-driven base URL.
- Add test suites around regime detection and strategy ranking.
- Add structured metrics endpoint for monitoring/alerting.
- Introduce paper-trade ledger persistence and replay tooling.
- Add CI checks for backend build + dashboard lint/build.

---

If you want, I can also add:

- architecture diagram (`docs/architecture.md` + Mermaid)
- `.env.example`
- contributor section with local dev workflows and release process
