'use client';

import { useEffect, useMemo, useState } from 'react';
import Card from '../components/Card';
import MetricBox from '../components/MetricBox';

type Strategy = {
  name: string;
  profit: number;
  confidence: number;
  score: number;
};

type DashboardData = {
  opportunity?: {
    strategy?: string;
    confidence?: number;
    expectedProfit?: number;
    tokenIn?: string;
    tokenOut?: string;
    amountIn?: number;
    score?: number;
  } | null;
  performance?: {
    totalTrades?: number;
    winRate?: number;
    totalProfit?: number;
    netProfit?: number;
    gasEfficiency?: number;
    sharpe?: number;
  } | null;
  strategies?: Strategy[];
  timestamp?: number;
};

const mock: Strategy[] = [
  { name: 'Arbitrage', profit: 0, confidence: 0, score: 0 },
  { name: 'Mean Reversion', profit: 0, confidence: 0, score: 0 },
  { name: 'Liquidity Imbalance', profit: 0, confidence: 0, score: 0 },
];

const n = (v?: number, d = 2) => (typeof v === 'number' ? v.toFixed(d) : '—');

export default function Page() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    let on = true;

    const load = async () => {
      try {
        const r = await fetch('/latest_state.json', { cache: 'no-store' });
        if (!r.ok) return;
        const json = (await r.json()) as DashboardData;
        if (on) setData(json);
      } catch {}
    };

    load();
    const id = setInterval(load, 2000);
    return () => {
      on = false;
      clearInterval(id);
    };
  }, []);

  const opp = data?.opportunity;
  const perf = data?.performance;
  const strategies = useMemo(() => {
    if (data?.strategies?.length) return data.strategies;
    if (opp?.strategy) {
      return [
        {
          name: opp.strategy,
          profit: opp.expectedProfit ?? 0,
          confidence: opp.confidence ?? 0,
          score: opp.score ?? 0,
        },
        ...mock.filter((s) => s.name !== opp.strategy),
      ];
    }
    return mock;
  }, [data?.strategies, opp]);

  if (!data) {
    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-200">
          <p className="text-xl font-semibold">Waiting for bot data...</p>
        </main>
    );
  }

  if (!data?.opportunity) return 'Waiting...';

  return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 text-slate-100">
        <div className="mx-auto grid h-full w-full max-w-7xl grid-cols-1 gap-6 lg:grid-cols-12">
          <Card className="lg:col-span-12">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-2xl font-bold md:text-3xl">AI Trading Agent Dashboard</h1>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1 text-sm font-semibold text-emerald-300">
              ACTIVE
            </span>
            </div>
          </Card>

          <Card title="Current Trade" className="lg:col-span-5">
            <div className="grid grid-cols-2 gap-4">
              <MetricBox label="Strategy" value={data.opportunity.strategy ?? '—'} tone="good" />
              <MetricBox
                  label="Confidence"
                  value={
                    typeof data.opportunity.confidence === 'number'
                        ? `${(data.opportunity.confidence * 100).toFixed(1)}%`
                        : '—'
                  }
              />
              <MetricBox
                  label="Expected Profit"
                  value={
                    typeof data.opportunity.expectedProfit === 'number'
                        ? `${data.opportunity.expectedProfit.toFixed(4)} BNB`
                        : '—'
                  }
                  tone="good"
              />
              <MetricBox
                  label="Token Pair"
                  value={
                    data.opportunity.tokenIn && data.opportunity.tokenOut
                        ? `${data.opportunity.tokenIn.slice(0, 6)} → ${data.opportunity.tokenOut.slice(0, 6)}`
                        : '—'
                  }
              />
              <MetricBox label="Amount In" value={data.opportunity.amountIn ?? '—'} />
              <MetricBox
                  label="Score"
                  value={typeof data.opportunity.score === 'number' ? data.opportunity.score.toFixed(4) : '—'}
              />
            </div>
          </Card>

          <Card title="Strategy Comparison" className="lg:col-span-7">
            <div className="space-y-3">
              {strategies.map((s) => (
                  <div
                      key={s.name}
                      className="grid grid-cols-4 items-center rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm"
                  >
                    <p className="font-semibold text-slate-100">{s.name}</p>
                    <p className="text-emerald-300">{n(s.profit)} BNB</p>
                    <p className="text-cyan-300">{n(s.confidence, 1)}%</p>
                    <p className="text-slate-300">{n(s.score)}</p>
                  </div>
              ))}
            </div>
          </Card>

          <Card title="Performance Panel" className="lg:col-span-8">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <MetricBox label="Total Trades" value={perf?.totalTrades ?? '—'} />
              <MetricBox label="Win Rate" value={`${n(perf?.winRate, 1)}%`} tone="good" />
              <MetricBox label="Total Profit" value={`${n(perf?.totalProfit)} BNB`} tone="good" />
              <MetricBox label="Net Profit" value={`${n(perf?.netProfit)} BNB`} tone="good" />
              <MetricBox label="Gas Efficiency" value={`${n(perf?.gasEfficiency, 1)}%`} />
              <MetricBox label="Sharpe Ratio" value={n(perf?.sharpe)} />
            </div>
          </Card>

          <Card title="System Status" className="lg:col-span-4">
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Last Update</p>
                <p className="mt-2 text-lg font-semibold text-slate-100">
                  {data?.timestamp ? new Date(data.timestamp).toLocaleString() : '—'}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-center">
                <p className="text-xs uppercase tracking-wide text-amber-300">Mode</p>
                <p className="mt-2 text-xl font-bold text-amber-200">DRY RUN MODE</p>
              </div>
            </div>
          </Card>
        </div>
      </main>
  );
}
