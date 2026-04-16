'use client'

import Card from '../../../components/Card'
import { useLiveState } from '../../hooks/useLiveState'
import {ArrowDown, ArrowRight, Fuel, ShieldCheck, Zap} from 'lucide-react'

export default function ExecutionPage() {
  const { data } = useLiveState()
  const ex = data?.execution
  const isLive = ex?.mode === 'LIVE'

  return (
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card title="Trade Execution Route" glow={isLive}>
            <div className="flex flex-col items-center justify-center space-y-6 py-8 px-4">
              <div className="flex flex-col md:flex-col items-center justify-center gap-6 w-full">

                {/* Input Box */}
                <div className="flex flex-row items-center gap-2 w-full max-w-[720px]">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Input</span>
                  <div className="flex h-20 w-full flex-col items-center justify-center rounded-2xl border border-white/10 bg-slate-900/50 shadow-inner px-4 overflow-hidden">
                  <span
                      className="text-lg font-black text-slate-200 truncate w-full text-center"
                      title={ex?.tokenIn ?? undefined}
                  >
                    {ex?.tokenIn ?? '—'}
                  </span>
                    <span className="text-xs text-slate-400 mt-1 truncate w-full text-center">{ex?.amountIn ?? '0.00'}</span>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex flex-row items-center text-cyan-400 shrink-0">
                  <ArrowDown className="h-8 w-8 animate-pulse drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] rotate-90 md:rotate-0" />
                </div>

                {/* Output Box */}
                <div className="flex flex-row items-center gap-2 w-full max-w-[720px]">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Expected Output</span>
                  <div className="flex h-20 w-full flex-col items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.1)] px-4 overflow-hidden">
                  <span
                      className="text-lg font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)] truncate w-full text-center"
                      title={ex?.tokenOut ?? undefined}
                  >
                    {ex?.tokenOut ?? '—'}
                  </span>
                    <span className="text-xs text-emerald-400/70 mt-1 truncate w-full text-center">{ex?.amountOutQuote ?? '0.00'}</span>
                  </div>
                </div>

              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card title="Execution Parameters">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-900/40 p-4">
                <div className="flex items-center gap-3 text-slate-400">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-sm font-medium">Min Output</span>
                </div>
                <span
                    className="font-mono text-sm text-slate-200 truncate ml-4"
                    title={ex?.amountOutMin != null ? String(ex.amountOutMin) : undefined}
                >
                {ex?.amountOutMin ?? '—'}
              </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-900/40 p-4">
                <div className="flex items-center gap-3 text-slate-400">
                  <Fuel className="h-4 w-4" />
                  <span className="text-sm font-medium">Gas Estimate</span>
                </div>
                <span className="font-mono text-sm text-slate-200 truncate ml-4">{ex?.gasEstimate ?? '—'}</span>
              </div>

              <div className="mt-6 flex items-center justify-between rounded-xl p-4 bg-slate-900/80 border border-white/10">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Engine Mode</span>
                <span className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold tracking-widest border ${isLive ? 'border-rose-500/30 bg-rose-500/10 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]' : 'border-amber-500/30 bg-amber-500/10 text-amber-400'}`}>
                {isLive ? <Zap className="h-3 w-3" /> : null}
                  {ex?.mode ?? 'DRY_RUN'}
              </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
  )
}