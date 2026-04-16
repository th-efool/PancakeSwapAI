'use client'

import { useEffect, useRef } from 'react'
import Card from '../../components/Card'
import { useLiveState } from '../hooks/useLiveState'

const c: Record<string, string> = {
  market: 'text-cyan-300',
  strategy: 'text-violet-300',
  risk: 'text-amber-300',
  execution: 'text-emerald-300',
  portfolio: 'text-fuchsia-300',
  liquidity: 'text-blue-300',
  pipeline: 'text-slate-200',
}

export default function LogsPage() {
  const { data } = useLiveState()
  const box = useRef<HTMLDivElement>(null)
  const items = [...(data?.logs ?? [])].reverse()

  useEffect(() => {
    if (box.current) box.current.scrollTop = 0
  }, [data?.timestamp])

  return (
    <Card title="Logs">
      <div ref={box} className="max-h-[70vh] space-y-2 overflow-auto rounded-2xl border border-white/10 bg-slate-950/50 p-3">
        {items.map((l, i) => (
          <div key={`${l.time}-${i}`} className="rounded-xl border border-white/10 bg-slate-900/60 p-3 text-sm transition hover:border-white/30">
            <div className="flex items-center justify-between">
              <span className={`font-semibold uppercase ${c[l.agent] ?? 'text-slate-200'}`}>{l.agent}</span>
              <span className="text-xs text-slate-400">{new Date(l.time).toLocaleTimeString()}</span>
            </div>
            <p className="mt-1 text-slate-200">{l.message}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}
