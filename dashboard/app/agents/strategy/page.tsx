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
                                    ? 'border-violet-500/40 bg-violet-500/5 shadow-[0_0_30px_-5px_rgba(139,92,246,0.15)] scale-[1.01]'
                                    : 'border-white/5 bg-slate-900/40 hover:border-white/10'
                            }`}
                        >
                            {isTop && (
                                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-violet-500/20 blur-2xl pointer-events-none" />
                            )}

                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4 min-w-[200px]">
                                    {isTop ? <Trophy className="h-5 w-5 text-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]" /> : <Target className="h-5 w-5 text-slate-600" />}
                                    <div>
                                        <p className={`font-bold tracking-wide ${isTop ? 'text-violet-300' : 'text-slate-200'}`}>{s.name}</p>
                                        <p className="text-[10px] font-mono text-slate-500">SCORE: {s.score?.toFixed(6)}</p>
                                    </div>
                                </div>

                                <div className="flex-1 max-w-md w-full">
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="text-slate-400 uppercase tracking-widest text-[9px]">Confidence</span>
                                        <span className="text-slate-200 font-mono">{conf.toFixed(1)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full rounded-full bg-slate-900 overflow-hidden border border-white/5">
                                        <div
                                            className={`h-full rounded-full ${isTop ? 'bg-gradient-to-r from-violet-600 to-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.8)]' : 'bg-slate-600'}`}
                                            style={{ width: `${conf}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="text-right min-w-[120px]">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Expected</p>
                                    <p className="text-lg font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">
                                        {s.expectedProfit?.toFixed(4)} <span className="text-xs text-emerald-400/50">BNB</span>
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