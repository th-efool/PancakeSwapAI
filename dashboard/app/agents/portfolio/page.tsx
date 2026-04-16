'use client'

import Card from '../../../../components/Card'
import MetricBox from '../../../../components/MetricBox'
import { useLiveState } from '../../../hooks/useLiveState'

const n = (v?: number, d = 2) => (typeof v === 'number' ? v.toFixed(d) : '—')

export default function PortfolioPage() {
  const { data } = useLiveState()
  const p = data?.performance

  return (
    <Card title="Portfolio Agent">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricBox label="Total Trades" value={p?.totalTrades ?? '—'} />
        <MetricBox label="Win Rate" value={typeof p?.winRate === 'number' ? `${(p.winRate * 100).toFixed(1)}%` : '—'} tone="good" />
        <MetricBox label="Total Profit" value={`${n(p?.totalProfit)} BNB`} tone="good" />
        <MetricBox label="Net Profit" value={`${n(p?.netProfit)} BNB`} tone={typeof p?.netProfit === 'number' && p.netProfit > 0 ? 'good' : 'warn'} />
      </div>
    </Card>
  )
}
