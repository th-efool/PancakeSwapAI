'use client'

import Card from '../components/Card.tsx'
import DecisionCard from '../components/DecisionCard.tsx'
import LiveChart from '../components/LiveChart.tsx'
import MemoryCard from '../components/MemoryCard.tsx'
import MetricBox from '../components/MetricBox.tsx'
import SimulationCard from '../components/SimulationCard.tsx'
import TemporalMetric from '../components/TemporalMetric.tsx'
import { type TimelineItem, useLiveState } from './hooks/useLiveState.ts'
import { type MarketRegime, normalizeMarketRegime } from '../lib/market.ts'

const n = (v?: number, d = 2) => (typeof v === 'number' ? v.toFixed(d) : '--')
const signed = (v: number, d = 3) => `${v >= 0 ? '+' : ''}${v.toFixed(d)}`
const safe = <T,>(v: T) => (v === undefined || v === null || (typeof v === 'number' && Number.isNaN(v)) ? '--' : v)

const regimeMap: Record<MarketRegime, { badge: string; glow: string; note: string }> = {
  TRENDING: {
    badge: 'bg-green-50 text-green-600 border-green-200',
    glow: 'shadow-sm',
    note: 'Directional strength detected. Momentum-friendly strategies favored.',
  },
  MEAN_REVERTING: {
    badge: 'bg-red-50 text-red-600 border-red-200',
    glow: 'shadow-sm',
    note: 'Price is stabilizing around local fair value. Reversion favored.',
  },
  VOLATILE: {
    badge: 'bg-gray-100 text-gray-500 border-gray-300',
    glow: 'shadow-sm',
    note: 'Instability elevated. Confidence dampened and risk posture tightened.',
  },
  CHAOTIC: {
    badge: 'bg-red-50 text-red-600 border-red-200',
    glow: 'shadow-sm',
    note: 'High movement without volume confirmation. Signals conflict and quality is unstable.',
  },
  IDLE: {
    badge: 'bg-red-50 text-red-600 border-red-200',
    glow: 'shadow-sm',
    note: 'Participation is muted and momentum is flat. System stays selective and conservative.',
  },
  INSUFFICIENT_DATA: {
    badge: 'bg-gray-100 text-gray-500 border-gray-300',
    glow: 'shadow-sm',
    note: 'Not enough stable observations yet. Holding until minimum signal quality is met.',
  },
  UNKNOWN: {
    badge: 'bg-gray-100 text-gray-500 border-gray-300',
    glow: 'shadow-sm',
    note: 'Signal history still building. System observing before stronger adaptation.',
  },
} as const

const getRegimeUi = (regime: unknown) => regimeMap[normalizeMarketRegime(regime)] ?? regimeMap.UNKNOWN

function statusTag(t: TimelineItem[], strategy?: string, connected?: boolean) {
  if (!connected) return 'waiting'
  if (!t.length) return 'observing'
  if (!strategy || strategy === 'none') return 'observing'
  if (t.length > 1 && (t[t.length - 1].regime !== t[t.length - 2].regime || t[t.length - 1].strategy !== t[t.length - 2].strategy)) return 'adapting'
  return 'executing'
}

export default function Page() {
  const { data, blink, connected, timeline } = useLiveState()
  if (data?.status === 'starting') return <p className="text-lg text-gray-500">Booting system...</p>
  if (!data?.timestamp) return <p className="text-lg text-gray-500">Waiting for first cycle...</p>
  
  const opp = data.selectedOpportunity
  const memory = data.memory ?? {}
  const simulation = data.simulation ?? {}
  const decision = data.decision ?? {}
  const best = data.strategies?.[0]
  const net = data.performance?.netProfit
  const netTone = typeof net === 'number' && net > 0 ? 'text-green-600' : 'text-red-600'

  const s = data.temporalSignals
  const hasSignals = !!s && typeof s.priceDelta === 'number' && typeof s.priceVelocity === 'number' && typeof s.volatility === 'number'

  const delta = s?.priceDelta ?? 0
  const vel = s?.priceVelocity ?? 0
  const vol = s?.volatility ?? 0

  const deltaTone = delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-600' : 'text-[#111111]'
  const velTone = vel > 0 ? 'text-green-600' : vel < 0 ? 'text-red-600' : 'text-gray-500'
  const volTone = vol > 0.015 ? 'text-gray-500' : 'text-red-600'

  const regime = normalizeMarketRegime(data.regime)
  const regimeUi = getRegimeUi(regime)

  const story = (() => {
    if (!hasSignals) return 'System is warming up. Building enough signal depth for confident adaptation.'
    if (!opp?.strategy || opp.strategy === 'none') return `${regime} regime detected. No high-confidence trade passed the current filters.`
    if (regime === 'TRENDING') return `TRENDING regime detected, ${opp.strategy} selected for stronger directional follow-through.`
    if (regime === 'MEAN_REVERTING') return `MEAN_REVERTING regime favored ${opp.strategy} as prices compressed toward equilibrium.`
    if (regime === 'VOLATILE') return `VOLATILE regime reduced confidence globally, but ${opp.strategy} remained highest-ranked.`
    if (regime === 'CHAOTIC') return `CHAOTIC regime detected and signal agreement is weak, so ${opp.strategy} survived only after stricter filtering.`
    if (regime === 'IDLE') return `IDLE regime detected. System remains patient while ${opp.strategy} has limited edge.`
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
          <span className={`h-3 w-3 rounded-full ${connected ? 'bg-green-600' : 'bg-red-600'}`} />
        </div>
        <p className="mt-2 text-sm text-gray-500">Last updated: {new Date(data.timestamp).toLocaleString()}</p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricBox label="Current Opportunity" value={data.status === 'starting' ? 'Booting system...' : noTrade ? 'No opportunity' : safe(opp?.strategy)} />
        <MetricBox label="Best Strategy" value={safe(best?.name)} />
        <MetricBox label="Expected Profit" value={typeof opp?.expectedProfit === 'number' ? `${n(opp.expectedProfit, 4)} BNB` : '--'} />
        <MetricBox label="System Status" value={stateTag.toUpperCase()} tone={stateTag === 'executing' ? 'good' : stateTag === 'adapting' ? 'warn' : 'default'} />
        <MetricBox label="Configured Source" value={safe(data.configuredSource)} />
        <MetricBox label="Used Source" value={safe(data.usedSource)} />
      </div>

      <Card title="Market Regime">
        <div key={regime} className={`rounded-2xl border border-gray-200 bg-[#f8f9fa] p-4 transition-all duration-500 ease-out ${blink ? 'opacity-100 translate-y-0 scale-[1.01]' : 'opacity-95 translate-y-[2px]'} ${regimeUi.glow}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${regimeUi.badge}`}>{regime}</span>
            <p className="text-xs text-gray-500">{new Date(data.timestamp).toLocaleTimeString()}</p>
          </div>
          <p className="mt-3 text-sm text-[#111111]">{regimeUi.note}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <TemporalMetric label="Price Delta" value={signed(delta)} tone={deltaTone} pulse={blink} />
            <TemporalMetric label="Volatility" value={n(vol, 4)} tone={volTone} pulse={blink} />
            <TemporalMetric label="Velocity" value={signed(vel)} tone={velTone} subtle pulse={blink} />
          </div>
        </div>
      </Card>

      <LiveChart state={data} />

      <div className="grid gap-6 lg:grid-cols-3">
        <MemoryCard memory={memory} blink={blink} />
        <SimulationCard simulation={simulation} blink={blink} />
        <DecisionCard decision={decision} blink={blink} />
      </div>

      <Card title="Strategy Timeline">
        <div className="space-y-2">
          {hist.length === 0 ? (
            <p className="text-sm text-gray-500">Waiting for cycle history...</p>
          ) : (
            hist.map((item, i) => {
              const prev = i > 0 ? hist[i - 1] : null
              const switched = !!prev && prev.strategy !== item.strategy
              const regimeFlip = !!prev && prev.regime !== item.regime
              const active = i === hist.length - 1
              const jump = !!prev && Math.abs(item.expectedProfit - prev.expectedProfit) > 0.02

              return (
                <div key={item.cycleId} className={`rounded-xl border p-3 text-sm transition-all ${active ? 'border-red-200 bg-red-50 shadow-sm' : 'border-gray-200 bg-[#f8f9fa] hover:-translate-y-0.5 hover:shadow-lg'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-[#111111]">Cycle #{item.cycleId} {switched ? '↺' : '→'} {item.strategy}</p>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] ${getRegimeUi(item.regime).badge}`}>{item.regime}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">profit {n(item.expectedProfit, 4)} | conf {n(item.confidence, 2)} | score {n(item.score, 4)}</p>
                  <div className="mt-1 flex gap-2 text-[10px]">
                    {switched ? <span className="text-gray-500">strategy flip</span> : null}
                    {regimeFlip ? <span className="text-red-600">regime change</span> : null}
                    {jump ? <span className="text-green-600">profit jump</span> : null}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>

      <Card title="Decision Story">
        <p className="text-sm text-gray-500 transition-all duration-300">{decision.reason ?? story}</p>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-500">Cycle #{safe(data.cycleId)}</p>
          <div className="flex items-center gap-2 text-xs">
            <span className={`h-2 w-2 rounded-full ${connected ? 'bg-green-600' : 'bg-red-600'}`} />
            <span className="text-gray-500">{connected ? 'Live' : 'Disconnected'}</span>
          </div>
        </div>
        <p className={`mt-2 text-3xl font-bold transition-all duration-300 ${netTone}`}>Net Profit: {typeof net === 'number' ? `${n(net)} BNB` : '--'}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <p className="text-sm text-gray-500">Simulation Confidence: {typeof simulation.confidenceAdjusted === 'number' ? `${(simulation.confidenceAdjusted * 100).toFixed(1)}%` : '--'}</p>
          <p className="text-sm text-gray-500">Strategy Performance Score: {n(memory.performanceScore, 3)}</p>
        </div>
        {noTrade ? <p className="mt-3 rounded-lg border border-gray-200 bg-[#f8f9fa] p-3 text-sm text-gray-500">System evaluating conditions — no safe opportunity detected.</p> : null}
        {simRejected ? <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">Trade rejected due to high downside risk.</p> : null}
      </Card>
    </div>
  )
}
