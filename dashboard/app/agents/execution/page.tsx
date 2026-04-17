'use client'

import Card from '../../../components/Card.tsx'
import { useLiveState } from '../../hooks/useLiveState.ts'
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
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 sm:w-24 sm:shrink-0">Input</span>
                <div className="flex min-h-24 w-full flex-col justify-center rounded-2xl border border-gray-200 bg-[#f8f9fa] px-4 py-3 shadow-sm">
                  <span className="w-full break-all text-center font-mono text-sm font-bold text-[#111111] sm:text-base" title={ex?.tokenIn ?? undefined}>
                    {ex?.tokenIn ?? '—'}
                  </span>
                  <span className="mt-2 w-full break-all text-center font-mono text-xs text-gray-500">{ex?.amountIn ?? '0.00'}</span>
                </div>
              </div>

              <div className="flex items-center text-red-600">
                <ArrowDown className="h-8 w-8" />
              </div>

              <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 sm:w-24 sm:shrink-0">Expected Output</span>
                <div className="flex min-h-24 w-full flex-col justify-center rounded-2xl border border-green-200 bg-green-50 px-4 py-3 shadow-sm">
                  <span
                    className="w-full break-all text-center font-mono text-sm font-bold text-green-600 sm:text-base"
                    title={ex?.tokenOut ?? undefined}
                  >
                    {ex?.tokenOut ?? '—'}
                  </span>
                  <span className="mt-2 w-full break-all text-center font-mono text-xs text-green-600">{ex?.amountOutQuote ?? '0.00'}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-6 xl:col-span-2">
        <Card title="Execution Parameters">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-[#f8f9fa] p-4">
              <div className="flex items-center gap-3 text-gray-500">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-sm font-medium">Min Output</span>
              </div>
              <span className="max-w-[55%] break-all text-right font-mono text-sm text-[#111111]" title={ex?.amountOutMin != null ? String(ex.amountOutMin) : undefined}>
                {ex?.amountOutMin ?? '—'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-[#f8f9fa] p-4">
              <div className="flex items-center gap-3 text-gray-500">
                <Fuel className="h-4 w-4" />
                <span className="text-sm font-medium">Gas Estimate</span>
              </div>
              <span className="max-w-[55%] break-all text-right font-mono text-sm text-[#111111]">{ex?.gasEstimate ?? '—'}</span>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Engine Mode</span>
              <span className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold tracking-widest ${isLive ? 'border-red-200 bg-red-50 text-red-600 ' : 'border-gray-300 bg-gray-100 text-gray-500'}`}>
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
