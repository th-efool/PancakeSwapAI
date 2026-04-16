'use client'

import Card from '../../../components/Card.tsx'
import MetricBox from '../../../components/MetricBox.tsx'
import { useLiveState } from '../../hooks/useLiveState.ts'
import { BarChart2, PieChart, TrendingUp, Activity } from 'lucide-react'

const n = (v?: number, d = 2) => (typeof v === 'number' ? v.toFixed(d) : '—')

export default function PortfolioPage() {
  const { data } = useLiveState()
  const p = data?.performance

  return (
      <Card title="Portfolio Performance">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricBox
              label="Total Trades"
              value={p?.totalTrades ?? '—'}
              icon={<Activity />}
          />
          <MetricBox
              label="Win Rate"
              value={typeof p?.winRate === 'number' ? `${(p.winRate * 100).toFixed(1)}%` : '—'}
              tone={typeof p?.winRate === 'number' && p.winRate > 0.5 ? 'good' : 'warn'}
              icon={<PieChart />}
          />
          <MetricBox
              label="Gross Profit"
              value={`${n(p?.totalProfit)} BNB`}
              tone="good"
              icon={<BarChart2 />}
          />
          <MetricBox
              label="Net Profit"
              value={`${n(p?.netProfit)} BNB`}
              tone={typeof p?.netProfit === 'number' && p.netProfit > 0 ? 'good' : 'danger'}
              icon={<TrendingUp />}
          />
        </div>
      </Card>
  )
}