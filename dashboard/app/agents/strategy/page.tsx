'use client'

import Card from '../../../components/Card'
import { useLiveState } from '../../hooks/useLiveState'

export default function StrategyPage() {
  const { data } = useLiveState()
  const rows = data?.strategies ?? []

  return (
    <Card title="Strategy Scores">
      <div className="space-y-2">
        {rows.map((s) => (
          <div key={s.name} className="grid grid-cols-4 rounded-xl border border-white/10 bg-slate-900/50 p-3 transition hover:border-violet-300/40">
            <p className="font-semibold">{s.name}</p>
            <p>{s.expectedProfit?.toFixed(4)} BNB</p>
            <p>{(s.confidence * 100).toFixed(1)}%</p>
            <p>{s.score?.toFixed(6)}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}
