'use client'

import Card from '../components/Card'
import DecisionCard from '../components/DecisionCard'
import MemoryCard from '../components/MemoryCard'
import MetricBox from '../components/MetricBox'
import SimulationCard from '../components/SimulationCard'
import TemporalMetric from '../components/TemporalMetric'
import { type TimelineItem, useLiveState } from './hooks/useLiveState'

const n = (v?: number, d = 2) => (typeof v === 'number' ? v.toFixed(d) : '--')
const signed = (v: number, d = 3) => `${v >= 0 ? '+' : ''}${v.toFixed(d)}`

const regimeMap = {
  TRENDING: {
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    glow: 'shadow-[0_0_32px_rgba(16,185,129,0.25)]',
    note: 'Directional strength detected. Momentum-friendly strategies favored.',
  },
  MEAN_REVERTING: {
    badge: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
    glow: 'shadow-[0_0_32px_rgba(56,189,248,0.2)]',
    note: 'Price is stabilizing around local fair value. Reversion favored.',
  },
  VOLATILE: {
    badge: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    glow: 'shadow-[0_0_32px_rgba(245,158,11,0.28)]',
    note: 'Instability elevated. Confidence dampened and risk posture tightened.',
  },
  UNKNOWN: {
    badge: 'bg-slate-500/20 text-slate-300 border-slate-400/40',
    glow: 'shadow-[0_0_20px_rgba(148,163,184,0.18)]',
    note: 'Signal history still building. System observing before stronger adaptation.',
  },
} as const

function statusTag(t: TimelineItem[], strategy?: string, connected?: boolean) {
  if (!connected) return 'waiting'
  if (!t.length) return 'observing'
  if (!strategy || strategy === 'none') return 'observing'
  if (t.length > 1 && (t[t.length - 1].regime !== t[t.length - 2].regime || t[t.length - 1].strategy !== t[t.length - 2].strategy)) return 'adapting'
  return 'executing'
}

export default function Page() {
  const { data, blink, connected, timeline } = useLiveState()
  if (!data?.timestamp) return <p className="text-lg text-slate-300">Waiting for first cycle...</p>

  const opp = data.selectedOpportunity
  const best = data.strategies?.[0]
  const net = data.performance?.netProfit
  const netTone = typeof net === 'number' && net > 0 ? 'text-emerald-300' : 'text-rose-300'

  const s = data.temporalSignals
  const hasSignals = !!s && typeof s.priceDelta === 'number' && typeof s.priceVelocity === 'number' && typeof s.volatility === 'number'

  const delta = s?.priceDelta ?? 0
  const vel = s?.priceVelocity ?? 0
  const vol = s?.volatility ?? 0

  const deltaTone = delta > 0 ? 'text-emerald-300' : delta < 0 ? 'text-rose-300' : 'text-slate-200'
  const velTone = vel > 0 ? 'text-emerald-300' : vel < 0 ? 'text-rose-300' : 'text-slate-300'
  const volTone = vol > 0.015 ? 'text-amber-300' : 'text-sky-300'

  const regime = data.regime ?? 'UNKNOWN'
  const regimeUi = regimeMap[regime]

  const story = (() => {
    if (!hasSignals) return 'System is warming up. Building enough signal depth for confident adaptation.'
    if (!opp?.strategy || opp.strategy === 'none') return `${regime} regime detected. No high-confidence trade passed the current filters.`
    if (regime === 'TRENDING') return `TRENDING regime detected, ${opp.strategy} selected for stronger directional follow-through.`
    if (regime === 'MEAN_REVERTING') return `MEAN_REVERTING regime favored ${opp.strategy} as prices compressed toward equilibrium.`
    if (regime === 'VOLATILE') return `VOLATILE regime reduced confidence globally, but ${opp.strategy} remained highest-ranked.`
    return `${opp.strategy} selected while market state remains UNKNOWN.`
  })()

  const hist = timeline.slice(-6)
  const stateTag = statusTag(timeline, opp?.strategy, connected)
  const noTrade = !opp?.strategy || opp.strategy === 'none'
  const simRejected = data.risk?.approved === false && (data.risk.reason ?? '').toLowerCase().includes('downside')

  return (
    <div className="grid gap-6">
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Live Monitor</h2>
          <span className={`h-3 w-3 rounded-full ${connected ? (blink ? 'animate-ping bg-emerald-300' : 'bg-emerald-400') : 'bg-rose-400'}`} />
        </div>
        <p className="mt-2 text-sm text-slate-400">Last updated: {new Date(data.timestamp).toLocaleString()}</p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricBox label="Current Opportunity" value={noTrade ? 'No opportunity' : opp.strategy} />
        <MetricBox label="Best Strategy" value={best?.name ?? '--'} />
        <MetricBox label="Expected Profit" value={typeof opp?.expectedProfit === 'number' ? `${n(opp.expectedProfit, 4)} BNB` : '--'} />
        <MetricBox label="System Status" value={stateTag.toUpperCase()} tone={stateTag === 'executing' ? 'good' : stateTag === 'adapting' ? 'warn' : 'default'} />
        <MetricBox label="Configured Source" value={data.configuredSource ?? '--'} />
        <MetricBox label="Used Source" value={data.usedSource ?? '--'} />
      </div>

      <Card title="Market Regime">
        <div key={regime} className={`rounded-2xl border border-white/10 bg-slate-900/50 p-4 transition-all duration-500 ease-out ${blink ? 'opacity-100 translate-y-0 scale-[1.01]' : 'opacity-95 translate-y-[2px]'} ${regimeUi.glow}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${regimeUi.badge}`}>{regime}</span>
            <p className="text-xs text-slate-400">{new Date(data.timestamp).toLocaleTimeString()}</p>
          </div>
          <p className="mt-3 text-sm text-slate-200">{regimeUi.note}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <TemporalMetric label="Price Delta" value={signed(delta)} tone={deltaTone} pulse={blink} />
            <TemporalMetric label="Volatility" value={n(vol, 4)} tone={volTone} pulse={blink} />
            <TemporalMetric label="Velocity" value={signed(vel)} tone={velTone} subtle pulse={blink} />
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <MemoryCard memory={data.memory} blink={blink} />
        <SimulationCard simulation={data.simulation} blink={blink} />
        <DecisionCard decision={data.decision} blink={blink} />
      </div>

      <Card title="Strategy Timeline">
        <div className="space-y-2">
          {hist.length === 0 ? (
            <p className="text-sm text-slate-400">Waiting for cycle history...</p>
          ) : (
            hist.map((item, i) => {
              const prev = i > 0 ? hist[i - 1] : null
              const switched = !!prev && prev.strategy !== item.strategy
              const regimeFlip = !!prev && prev.regime !== item.regime
              const active = i === hist.length - 1
              const jump = !!prev && Math.abs(item.expectedProfit - prev.expectedProfit) > 0.02

              return (
                <div key={item.cycleId} className={`rounded-xl border p-3 text-sm transition-all ${active ? 'border-cyan-300/50 bg-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.2)]' : 'border-white/10 bg-slate-900/50 hover:-translate-y-0.5 hover:shadow-lg'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-100">Cycle #{item.cycleId} {switched ? '↺' : '→'} {item.strategy}</p>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] ${regimeMap[item.regime].badge}`}>{item.regime}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-300">profit {n(item.expectedProfit, 4)} | conf {n(item.confidence, 2)} | score {n(item.score, 4)}</p>
                  <div className="mt-1 flex gap-2 text-[10px]">
                    {switched ? <span className="text-amber-300">strategy flip</span> : null}
                    {regimeFlip ? <span className="text-sky-300">regime change</span> : null}
                    {jump ? <span className="text-emerald-300">profit jump</span> : null}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>

      <Card title="Decision Story">
        <p className="text-sm text-slate-300 transition-all duration-300">{data.decision?.reason ?? story}</p>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-400">Cycle #{data.cycleId ?? '--'}</p>
          <div className="flex items-center gap-2 text-xs">
            <span className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            <span className="text-slate-300">{connected ? 'Live' : 'Disconnected'}</span>
          </div>
        </div>
        <p className={`mt-2 text-3xl font-bold transition-all duration-300 ${netTone}`}>Net Profit: {typeof net === 'number' ? `${n(net)} BNB` : '--'}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <p className="text-sm text-slate-300">Simulation Confidence: {typeof data.simulation?.confidenceAdjusted === 'number' ? `${(data.simulation.confidenceAdjusted * 100).toFixed(1)}%` : '--'}</p>
          <p className="text-sm text-slate-300">Strategy Performance Score: {n(data.memory?.performanceScore, 3)}</p>
        </div>
        {noTrade ? <p className="mt-3 rounded-lg border border-white/10 bg-slate-900/50 p-3 text-sm text-slate-300">System evaluating conditions — no safe opportunity detected.</p> : null}
        {simRejected ? <p className="mt-3 rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">Trade rejected due to high downside risk.</p> : null}
      </Card>
    </div>
  )
}
