'use client'

import Card from '../../components/Card.tsx'
import { useLiveState } from '../hooks/useLiveState.ts'

export default function LiquidityPage() {
  const { data } = useLiveState()
  const pools = data?.market?.pools ?? []

  return (
    <Card title="Liquidity View">
      <div className="space-y-2">
        {pools.map((p) => {
          const depth = p.liquidity ?? 0
          const cls = depth > 1000 ? 'text-green-600' : depth > 100 ? 'text-gray-500' : 'text-red-600'
          return (
            <div key={p.address} className="rounded-xl border border-gray-200 bg-[#f8f9fa] p-3 transition hover:border-red-200">
              <p className="font-semibold">{p.token0?.symbol}/{p.token1?.symbol}</p>
              <p className="text-sm text-gray-500">Depth: <span className={cls}>{depth.toFixed(2)}</span></p>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
