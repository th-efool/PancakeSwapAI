'use client'

import Card from '../../../components/Card'
import { useLiveState } from '../../hooks/useLiveState'

export default function MarketPage() {
  const { data } = useLiveState()
  const pools = data?.market?.pools ?? []

  return (
    <div className="grid gap-6">
      <Card title="Market Summary">
        <div className="grid gap-4 md:grid-cols-3">
          <p>Pool Count: {data?.market?.summary?.poolCount ?? 0}</p>
          <p>Avg Price: {data?.market?.summary?.avgPrice?.toFixed(6) ?? '0.000000'}</p>
          <p>Total Liquidity: {data?.market?.summary?.totalLiquidity?.toFixed(2) ?? '0.00'}</p>
        </div>
      </Card>
      <Card title="Pools + Prices">
        <div className="space-y-2">
          {pools.map((p) => (
            <div key={p.address} className="rounded-xl border border-white/10 bg-slate-900/50 p-3 transition hover:border-cyan-300/40">
              <p className="font-semibold">{p.token0?.symbol}/{p.token1?.symbol}</p>
              <p className="text-sm text-slate-300">{p.address}</p>
              <p className="text-sm text-cyan-300">Price: {p.price?.toFixed(8) ?? '—'}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
