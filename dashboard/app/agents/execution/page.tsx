'use client'

import Card from '../../../../components/Card'
import { useLiveState } from '../../../hooks/useLiveState'

export default function ExecutionPage() {
  const { data } = useLiveState()
  const ex = data?.execution

  return (
    <Card title="Execution Agent">
      <div className="grid gap-2 rounded-2xl border border-white/10 bg-slate-900/50 p-4 text-sm">
        <p>tokenIn: {ex?.tokenIn ?? '—'}</p>
        <p>tokenOut: {ex?.tokenOut ?? '—'}</p>
        <p>amountIn: {ex?.amountIn ?? '—'}</p>
        <p>amountOutQuote: {ex?.amountOutQuote ?? '—'}</p>
        <p>amountOutMin: {ex?.amountOutMin ?? '—'}</p>
        <p>gasEstimate: {ex?.gasEstimate ?? '—'}</p>
        <p>mode: {ex?.mode ?? '—'}</p>
      </div>
    </Card>
  )
}
