'use client'

import Card from '../../../components/Card'
import MetricBox from '../../../components/MetricBox'
import { useLiveState } from '../../hooks/useLiveState'
import { Layers, CandlestickChart, Waves } from 'lucide-react'

export default function MarketPage() {
    const { data } = useLiveState()
    const pools = data?.market?.pools ?? []

    return (
        <div className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-3">
                <MetricBox
                    label="Active Pools"
                    value={data?.market?.summary?.poolCount ?? 0}
                    icon={<Layers />}
                />
                <MetricBox
                    label="Global Avg Price"
                    value={data?.market?.summary?.avgPrice?.toFixed(6) ?? '0.000000'}
                    icon={<CandlestickChart />}
                />
                <MetricBox
                    label="Total Liquidity"
                    value={`$${data?.market?.summary?.totalLiquidity?.toFixed(2) ?? '0.00'}`}
                    icon={<Waves />}
                    tone="good"
                />
            </div>

            <Card title="Liquidity Pools & Depth">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {pools.map((p) => (
                        <div key={p.address} className="group relative overflow-hidden rounded-xl border border-white/5 bg-slate-900/40 p-4 transition-all hover:border-cyan-500/30 hover:bg-slate-900/60 hover:shadow-[0_0_20px_-5px_rgba(34,211,238,0.15)]">
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="flex -space-x-2">
                                        <div className="h-6 w-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[8px] font-bold">{p.token0?.symbol?.[0]}</div>
                                        <div className="h-6 w-6 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-[8px] font-bold">{p.token1?.symbol?.[0]}</div>
                                    </div>
                                    <p className="font-bold tracking-wide text-slate-200">{p.token0?.symbol}/{p.token1?.symbol}</p>
                                </div>
                                <p className="text-xs font-mono text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
                                    {p.price?.toFixed(8) ?? '—'}
                                </p>
                            </div>
                            <p className="text-[10px] font-mono text-slate-500 truncate">{p.address}</p>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    )
}