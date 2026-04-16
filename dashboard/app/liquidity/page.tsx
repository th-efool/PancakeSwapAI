'use client'

import Card from '../../components/Card'
import { useLiveState } from '../hooks/useLiveState'

export default function LiquidityPage() {
  const { data } = useLiveState()
  const pools = data?.market?.pools ?? []

  return (
    <Card title="Liquidity View">
      <div className="space-y-2">
        {pools.map((p) => {
          const depth = p.liquidity ?? 0
          const cls = depth > 1000 ? 'text-emerald-300' : depth > 100 ? 'text-amber-300' : 'text-rose-300'
          return (
            <div key={p.address} className="rounded-xl border border-white/10 bg-slate-900/50 p-3 transition hover:border-blue-300/40">
              <p className="font-semibold">{p.token0?.symbol}/{p.token1?.symbol}</p>
              <p className="text-sm text-slate-300">Depth: <span className={cls}>{depth.toFixed(2)}</span></p>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
