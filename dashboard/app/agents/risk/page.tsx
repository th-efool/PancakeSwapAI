'use client'

import Card from '../../../components/Card.tsx'
import { useLiveState } from '../../hooks/useLiveState.ts'
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react'

export default function RiskPage() {
    const { data } = useLiveState()
    const approved = !!data?.risk?.approved

    return (
        <Card title="Risk Assessment" glow={!approved}>
            <div className="flex flex-col md:flex-row gap-6 items-stretch">

                <div className={`flex flex-col items-center justify-center w-full md:w-1/3 rounded-2xl border p-8 transition-all ${
                    approved
                        ? 'border-emerald-500/20 bg-emerald-500/5 shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)] text-emerald-400'
                        : 'border-rose-500/30 bg-rose-500/10 shadow-[0_0_30px_-5px_rgba(244,63,94,0.2)] text-rose-400'
                }`}>
                    {approved ? <ShieldCheck className="h-16 w-16 mb-4 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" /> : <ShieldAlert className="h-16 w-16 mb-4 drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]" />}
                    <h3 className="text-2xl font-black uppercase tracking-widest">{approved ? 'Approved' : 'Rejected'}</h3>
                    <p className="mt-2 text-xs font-medium uppercase tracking-widest opacity-60">System Status</p>
                </div>

                <div className="flex-1 flex flex-col justify-center rounded-2xl border border-white/5 bg-slate-900/40 p-8">
                    <div className="flex items-center gap-3 mb-4 text-slate-400">
                        <AlertTriangle className="h-5 w-5" />
                        <h4 className="text-sm font-bold uppercase tracking-widest">Assessment Reason</h4>
                    </div>
                    <p className={`text-lg font-mono leading-relaxed ${approved ? 'text-slate-300' : 'text-rose-300'}`}>
                        {data?.risk?.reason ?? 'Awaiting risk evaluation cycle...'}
                    </p>
                </div>

            </div>
        </Card>
    )
}