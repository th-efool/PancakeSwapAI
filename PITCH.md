# PancakeSwap AI Dashboard Pitch

## 60-Second Demo Pitch
This is a multi-agent autonomous trading system for PancakeSwap, built to show decision quality in real time, not just outputs. The dashboard streams live market intelligence from `latest_state.json`: temporal signals, market regime, active strategy, risk posture, execution plan, and portfolio impact. You can watch the bot adapt cycle-by-cycle as regime changes from trending to mean-reverting to volatile, and see confidence and strategy selection shift immediately. Dry-run mode is intentional: it proves full decision flow, safety controls, and explainability before real capital deployment.

## 2-Minute Technical Explanation
The system runs as a pipeline of specialized agents: market ingestion, temporal signal analysis, regime detection, strategy selection, risk checks, execution planning, and portfolio accounting. Each cycle writes one structured snapshot to `latest_state.json`. The frontend polls every 2 seconds and renders the full decision graph: current regime, temporal metrics, strategy timeline, and decision story.

Temporal intelligence is derived from rolling market history: price delta, velocity, and volatility. Regime detection classifies current conditions into TRENDING, MEAN_REVERTING, VOLATILE, or UNKNOWN. Strategy behavior adapts per regime through confidence multipliers, so the system doesn’t just score opportunities; it changes behavior according to market structure. Risk and execution agents expose explicit outputs, and the log stream provides traceability for every major step.

This architecture is demo-safe and production-oriented: deterministic snapshots, auditable state, explainable transitions, no hidden backend channels, and clear extension points for live execution once controls are validated.

## 3 One-Line Demo Claims
- We show the bot thinking in real time, not only reporting trades.
- Strategy selection adapts automatically to detected market regime.
- Every decision is auditable through structured state, logs, and timeline history.

## Closing Line
Safe-by-design today, execution-ready tomorrow.
