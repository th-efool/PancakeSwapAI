'use client'

import Card from '../../../components/Card.tsx'
import { useLiveState } from '../../hooks/useLiveState.ts'
import { Target, Trophy } from 'lucide-react'

export default function StrategyPage() {
    const { data } = useLiveState()
    const rows = data?.strategies ?? []

    return (
        <Card title="Strategy Matrix">
            <div className="space-y-4">
                {rows.map((s, idx) => {
                    const isTop = idx === 0;
                    const conf = (s.confidence * 100);

                    return (
                        <div
                            key={s.name}
                            className={`relative overflow-hidden rounded-xl border p-5 transition-all duration-300 ${
                                isTop
                                    ? 'border-red-200 bg-red-50 shadow-sm scale-[1.01]'
                                    : 'border-gray-200 bg-[#f8f9fa] hover:border-gray-200'
                            }`}
                        >
                            {isTop && (
                                                            )}

                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4 min-w-[200px]">
                                    {isTop ? <Trophy className="h-5 w-5 text-red-600 " /> : <Target className="h-5 w-5 text-gray-500" />}
                                    <div>
                                        <p className={`font-bold tracking-wide ${isTop ? 'text-red-600' : 'text-[#111111]'}`}>{s.name}</p>
                                        <p className="text-[10px] font-mono text-gray-500">SCORE: {s.score?.toFixed(6)}</p>
                                    </div>
                                </div>

                                <div className="flex-1 max-w-md w-full">
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="text-gray-500 uppercase tracking-widest text-[9px]">Confidence</span>
                                        <span className="text-[#111111] font-mono">{conf.toFixed(1)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full rounded-full bg-[#f8f9fa] overflow-hidden border border-gray-200">
                                        <div
                                            className={`h-full rounded-full ${isTop ? 'bg-red-600' : 'bg-gray-300'}`}
                                            style={{ width: `${conf}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="text-right min-w-[120px]">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Expected</p>
                                    <p className="text-lg font-black text-green-600 ">
                                        {s.expectedProfit?.toFixed(4)} <span className="text-xs text-green-600">BNB</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </Card>
    )
}