# PancakeSwapAI

![Node.js](https://img.shields.io/badge/Build-Node.js%2020%2B-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/Build-TypeScript-3178C6?logo=typescript&logoColor=white)
![Next.js Dashboard](https://img.shields.io/badge/Dashboard-Next.js%20App%20Router-000000?logo=nextdotjs&logoColor=white)
![Mode](https://img.shields.io/badge/Mode-Simulation%20%2F%20Dry%20Run-1E40AF)
![Data Source](https://img.shields.io/badge/Data-DEX%20%2B%20On--chain-0F766E)
![Status](https://img.shields.io/badge/Status-Active%20%2F%20Experimental-F59E0B)

## Overview

PancakeSwapAI is an intelligent, adaptive multi-agent trading system designed to operate in real-time DeFi environments like PancakeSwap. The system continuously ingests market state, interprets changing conditions, selects opportunities with explicit confidence, applies risk gates, and produces transparent execution plans in simulation-first mode.

It is engineered as a decision system, not a signal script: each cycle combines market context, temporal behavior, regime interpretation, strategy competition, and risk adjudication before any action is proposed.

---

## Why this matters

DeFi markets are fast, fragmented, and noisy. Liquidity shifts quickly, volatility regimes change intraday, and static rule sets degrade under new conditions.

A resilient system must adapt in real time, avoid forcing low-quality trades, and make its internal reasoning observable. PancakeSwapAI is built around that principle.

---

## System architecture

### Backend decision engine (Node.js + TypeScript)

The backend runs a continuous cycle and executes a deliberate multi-stage decision process:

1. **Market Agent** normalizes market state from configured sources and provides a coherent snapshot for downstream reasoning.
2. **Signal Layer** updates rolling history and extracts cross-pool and temporal features from recent behavior.
3. **Regime Detector** classifies the active market context (`TRENDING`, `MEAN_REVERTING`, `VOLATILE`, etc.) to condition strategy behavior.
4. **Strategy Agent** evaluates competing hypotheses across strategy modules and selects the highest expected-value candidate.
5. **Risk Agent** validates position quality against constraints (size, slippage, confidence, and safety checks) and can veto execution.
6. **Execution Agent** emits a simulated or executable trade plan with full context for review.
7. **State Export Layer** publishes structured state to in-memory and file-backed channels for APIs and UI observability.

### Frontend observability application (Next.js App Router)

The dashboard polls backend state on a 2-second cadence and exposes:

- live cycle status and system health
- current regime and temporal metrics
- selected strategy with confidence/profit context
- per-agent pages (market, strategy, risk, execution, portfolio)
- decision timeline and logs for auditability
- market-data source settings controls

### Repository layout

```text
.
├── agents/                 # market/strategy/risk/execution/portfolio agent logic
├── core/                   # pipeline, signals, regime, history, export, adapters
├── strategies/             # pluggable strategy modules
├── shared/                 # shared domain types
├── server.ts               # Express server + /state endpoint
├── index.ts                # bootstrap + continuous pipeline loop
├── config.ts               # runtime defaults + source sync
└── dashboard/              # Next.js observability interface
```

### PancakeSwap alignment

The architecture is designed for AMM-style environments, optimized for pool-based liquidity behavior, and compatible with PancakeSwap-style markets without claiming official integration.

---

## Intelligence layers

### Adaptive learning

The system adjusts behavior from observed outcomes over time. Strategy confidence and selection priority evolve as new cycle evidence accumulates.

### Natural language interface

Operators can query system state and interpret why decisions were taken, reducing dependence on raw log inspection alone.

### What-if simulation engine

Trade paths can be evaluated in simulation-first mode before execution. This supports counterfactual analysis and safer strategy iteration.

---

## Decision pipeline

```text
Market State
   ↓
Signal Extraction
   ↓
Regime Classification
   ↓
Strategy Selection
   ↓
Risk Adjudication
   ↓
Execution Planning (Sim/Dry Run)
   ↓
Feedback + State Export
```

This flow prioritizes selective action: no-trade outcomes are valid when expected value or risk quality is insufficient.

---

## Dashboard (Observability layer)

The dashboard is the system’s observability layer, focused on decision transparency rather than output-only reporting.

It surfaces live system thinking: regime interpretation, strategy rationale, risk approvals/rejections, and execution context across recent cycles.

Primary routes:

- `/` live monitor
- `/logs`
- `/agents/market`
- `/agents/strategy`
- `/agents/risk`
- `/agents/execution`
- `/agents/portfolio`
- `/liquidity`
- `/settings`

> Local development note: the live-state hook currently targets `https://pancakeswapai-production.up.railway.app/state`. For local backend integration, update `dashboard/app/hooks/useLiveState.ts`.

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

### 3) Start backend

```bash
npm start
```

Backend default bind: `0.0.0.0:${PORT:-3000}`.

### 4) Start dashboard (development)

```bash
npm run dev:frontend
```

### 5) Run backend + frontend together

```bash
npm run dev
```

> `npm run dev` starts compiled backend (`dist/index.js`) and Next.js dev server concurrently. Build first (`npm run build`) or use `npm run dev:full`.

---

## Configuration

### Environment variables

| Variable | Required | Purpose |
|---|---:|---|
| `PRIVATE_KEY` | Optional in demo mode | Wallet key for real execution paths |
| `PORT` | Optional | Backend listen port (default `3000`) |
| `MARKET_DATA_SOURCE` | Optional | Initial source (`ON_CHAIN`, `DEXSCREENER`, `SUBGRAPH`) |
| `SIGNAL_NOISE_SEED` | Optional | Deterministic noise seed for temporal signals |
| `RAILWAY_GIT_COMMIT_SHA` / `GITHUB_SHA` / `VERCEL_GIT_COMMIT_SHA` | Optional | Commit metadata for boot logs |

### Runtime defaults

`config.ts` includes defaults for chain/RPC (BSC), slippage, gas, sizing, poll interval, temporal signal noise, and market-data fallback order.

### Market-data source config sync

The backend reads preference from disk:

- `dashboard/public/market_data_config.json`
- fallback: `public/market_data_config.json`

Dashboard settings API endpoints:

- `GET /api/market-data`
- `POST /api/market-data`

### System characteristics

- **Adaptive**: behavior changes with observed market outcomes.
- **Selective**: the system can intentionally abstain from trading.
- **Transparent**: decisions are exported for operator visibility.
- **Modular**: strategy modules are plug-and-play within the strategy agent.

---

## API

### `GET /`

Returns health text:

- `Backend alive`

### `GET /state`

Returns, in order:

1. latest valid in-memory exported state
2. fallback `latest_state.json` payload
3. default boot response:

```json
{ "status": "starting" }
```

---

## Roadmap

- Move dashboard state endpoint to environment-driven configuration.
- Expand automated tests for regime detection and strategy ranking.
- Add structured metrics endpoints for monitoring and alerting.
- Introduce persistent paper-trade ledger + replay tooling.
- Add CI checks for backend build and dashboard lint/build.
