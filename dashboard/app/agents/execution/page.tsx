'use client'

import Card from '../../../components/Card'
import { useLiveState } from '../../hooks/useLiveState'
import { ArrowDown, Fuel, ShieldCheck, Zap } from 'lucide-react'

export default function ExecutionPage() {
  const { data } = useLiveState()
  const ex = data?.execution
  const isLive = ex?.mode === 'LIVE'

  return (
    <div className="grid gap-6 xl:grid-cols-5">
      <div className="xl:col-span-3">
        <Card title="Trade Execution Route" glow={isLive}>
          <div className="flex flex-col items-center justify-center space-y-6 px-2 py-6 sm:px-4 sm:py-8">
            <div className="flex w-full flex-col items-center justify-center gap-6">
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 sm:w-24 sm:shrink-0">Input</span>
                <div className="flex min-h-24 w-full flex-col justify-center rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 shadow-inner">
                  <span className="w-full break-all text-center font-mono text-sm font-bold text-slate-200 sm:text-base" title={ex?.tokenIn ?? undefined}>
                    {ex?.tokenIn ?? '—'}
                  </span>
                  <span className="mt-2 w-full break-all text-center font-mono text-xs text-slate-400">{ex?.amountIn ?? '0.00'}</span>
                </div>
              </div>

              <div className="flex items-center text-cyan-400">
                <ArrowDown className="h-8 w-8 animate-pulse drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
              </div>

              <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 sm:w-24 sm:shrink-0">Expected Output</span>
                <div className="flex min-h-24 w-full flex-col justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                  <span
                    className="w-full break-all text-center font-mono text-sm font-bold text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)] sm:text-base"
                    title={ex?.tokenOut ?? undefined}
                  >
                    {ex?.tokenOut ?? '—'}
                  </span>
                  <span className="mt-2 w-full break-all text-center font-mono text-xs text-emerald-400/70">{ex?.amountOutQuote ?? '0.00'}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-6 xl:col-span-2">
        <Card title="Execution Parameters">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-slate-900/40 p-4">
              <div className="flex items-center gap-3 text-slate-400">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-sm font-medium">Min Output</span>
              </div>
              <span className="max-w-[55%] break-all text-right font-mono text-sm text-slate-200" title={ex?.amountOutMin != null ? String(ex.amountOutMin) : undefined}>
                {ex?.amountOutMin ?? '—'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-slate-900/40 p-4">
              <div className="flex items-center gap-3 text-slate-400">
                <Fuel className="h-4 w-4" />
                <span className="text-sm font-medium">Gas Estimate</span>
              </div>
              <span className="max-w-[55%] break-all text-right font-mono text-sm text-slate-200">{ex?.gasEstimate ?? '—'}</span>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/80 p-4">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Engine Mode</span>
              <span className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold tracking-widest ${isLive ? 'border-rose-500/30 bg-rose-500/10 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]' : 'border-amber-500/30 bg-amber-500/10 text-amber-400'}`}>
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
