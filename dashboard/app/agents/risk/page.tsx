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
                        ? 'border-green-200 bg-green-50 shadow-sm text-green-600'
                        : 'border-red-200 bg-red-50 shadow-sm text-red-600'
                }`}>
                    {approved ? <ShieldCheck className="h-16 w-16 mb-4 " /> : <ShieldAlert className="h-16 w-16 mb-4 " />}
                    <h3 className="text-2xl font-black uppercase tracking-widest">{approved ? 'Approved' : 'Rejected'}</h3>
                    <p className="mt-2 text-xs font-medium uppercase tracking-widest opacity-60">System Status</p>
                </div>

                <div className="flex-1 flex flex-col justify-center rounded-2xl border border-gray-200 bg-[#f8f9fa] p-8">
                    <div className="flex items-center gap-3 mb-4 text-gray-500">
                        <AlertTriangle className="h-5 w-5" />
                        <h4 className="text-sm font-bold uppercase tracking-widest">Assessment Reason</h4>
                    </div>
                    <p className={`text-lg font-mono leading-relaxed ${approved ? 'text-gray-500' : 'text-red-600'}`}>
                        {data?.risk?.reason ?? 'Awaiting risk evaluation cycle...'}
                    </p>
                </div>

            </div>
        </Card>
    )
}