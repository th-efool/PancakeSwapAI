'use client'

import Card from '../../../components/Card.tsx'
import MetricBox from '../../../components/MetricBox.tsx'
import { useLiveState } from '../../hooks/useLiveState.ts'
import { BarChart2, PieChart, TrendingUp, Activity } from 'lucide-react'

const n = (v?: number, d = 2) => (typeof v === 'number' ? v.toFixed(d) : '—')

export default function PortfolioPage() {
  const { data } = useLiveState()
  const p = data?.performance
  const strategyUsage = p?.strategyUsage ?? {}
  const strategyEntries = Object.entries(strategyUsage)
  const maxUsage = strategyEntries.length ? Math.max(...strategyEntries.map(([, count]) => count)) : 0

  return (
      <Card title="Portfolio Performance">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          <MetricBox
              label="Total Executed Trades"
              value={p?.totalTradesExecuted ?? p?.totalTrades ?? '—'}
              icon={<Activity />}
          />
          <MetricBox
              label="Win Rate"
              value={typeof p?.winRate === 'number' ? `${(p.winRate * 100).toFixed(1)}%` : '—'}
              tone={typeof p?.winRate === 'number' && p.winRate > 0.5 ? 'good' : 'warn'}
              icon={<PieChart />}
          />
          <MetricBox
              label="Opportunity Conversion"
              value={typeof p?.conversionRate === 'number' ? `${(p.conversionRate * 100).toFixed(1)}%` : '—'}
              icon={<BarChart2 />}
          />
          <MetricBox
              label="System Selectivity"
              value={typeof p?.selectivity === 'number' ? `${(p.selectivity * 100).toFixed(1)}%` : '—'}
              icon={<Activity />}
          />
          <MetricBox
              label="Gross Profit"
              value={`${n(p?.totalProfit)} BNB`}
              tone="good"
              icon={<BarChart2 />}
          />
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <MetricBox
              label="Net Profit"
              value={`${n(p?.netProfit)} BNB`}
              tone={typeof p?.netProfit === 'number' && p.netProfit > 0 ? 'good' : 'danger'}
              icon={<TrendingUp />}
          />
          <MetricBox
              label="Opportunities Seen / Rejected"
              value={
                typeof p?.totalOpportunitiesSeen === 'number'
                  ? `${p.totalOpportunitiesSeen} / ${p?.totalRejected ?? p?.rejectedOpportunities ?? 0}`
                  : '—'
              }
              tone={typeof p?.totalRejected === 'number' && p.totalRejected > 0 ? 'warn' : undefined}
              icon={<PieChart />}
          />
        </div>
        <div className="mt-6 rounded-xl border border-gray-200 bg-white/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Strategy Distribution</p>
          <div className="mt-3 space-y-3">
            {strategyEntries.length === 0 ? (
              <p className="text-sm text-gray-500">No executed strategies yet.</p>
            ) : (
              strategyEntries.map(([name, count]) => {
                const width = maxUsage ? Math.max((count / maxUsage) * 100, 5) : 0
                return (
                  <div key={name}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-[#111111]">{name}</span>
                      <span className="font-mono text-gray-600">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-red-500/80" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </Card>
  )
}
