'use client'

import { useEffect, useRef } from 'react'
import Card from '../../components/Card.tsx'
import { useLiveState } from '../hooks/useLiveState.ts'
import { Terminal } from 'lucide-react'

const c: Record<string, string> = {
  market: 'text-cyan-400 border-cyan-400/20 bg-cyan-400/10',
  strategy: 'text-violet-400 border-violet-400/20 bg-violet-400/10',
  risk: 'text-amber-400 border-amber-400/20 bg-amber-400/10',
  execution: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10',
  portfolio: 'text-fuchsia-400 border-fuchsia-400/20 bg-fuchsia-400/10',
  liquidity: 'text-blue-400 border-blue-400/20 bg-blue-400/10',
  pipeline: 'text-slate-300 border-slate-500/20 bg-slate-500/10',
  memory: 'text-purple-300 border-purple-400/30 bg-purple-500/10',
  simulation: 'text-orange-300 border-orange-400/30 bg-orange-500/10',
  decision: 'text-cyan-300 border-cyan-400/30 bg-cyan-500/10',
}

const tagMap: Record<string, string> = {
  memory: 'memory',
  simulation: 'simulation',
  decision: 'decision',
}

export default function LogsPage() {
  const { data } = useLiveState()
  const box = useRef<HTMLDivElement>(null)
  const items = [...(data?.logs ?? [])].reverse()

  useEffect(() => {
    if (box.current) box.current.scrollTop = 0
  }, [data?.timestamp])

  return (
      <Card className="!p-0 border-none bg-black/80">
        <div className="flex items-center gap-3 border-b border-white/10 bg-slate-950 px-6 py-4">
          <Terminal className="h-5 w-5 text-slate-400" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-300">System Stream</h2>
        </div>

        <div
            ref={box}
            className="max-h-[75vh] space-y-1.5 overflow-auto p-4 font-mono text-[13px] relative"
            style={{
              backgroundImage: 'linear-gradient(transparent 50%, rgba(0, 0, 0, 0.25) 50%)',
              backgroundSize: '100% 4px',
            }}
        >
          {items.map((l, i) => {
            const t = tagMap[l.agent]
            return (
              <div
                  key={`${l.time}-${i}`}
                  className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4 rounded hover:bg-white/[0.02] p-1.5 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-[180px]">
              <span className="text-xs text-slate-500/80 shrink-0">
                [{new Date(l.time).toLocaleTimeString(undefined, { hour12: false, fractionalSecondDigits: 3 })}]
              </span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${c[l.agent] ?? 'text-slate-400 border-slate-700 bg-slate-800'}`}>
                {l.agent}
              </span>
                  {t ? <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${c[t]}`}>[{t}]</span> : null}
                </div>
                <p className="text-slate-300 leading-relaxed break-words flex-1">
                  {l.message}
                </p>
              </div>
            )
          })}
          {items.length === 0 && (
              <p className="text-slate-500 italic p-4 text-center">Awaiting log stream...</p>
          )}
        </div>
      </Card>
  )
}
