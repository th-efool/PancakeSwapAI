'use client'

import { useEffect, useRef } from 'react'
import Card from '../../components/Card.tsx'
import { useLiveState } from '../hooks/useLiveState.ts'
import { Terminal } from 'lucide-react'

const c: Record<string, string> = {
  market: 'text-red-600 border-red-200 bg-red-50',
  strategy: 'text-red-600 border-red-200 bg-red-50',
  risk: 'text-gray-500 border-gray-300 bg-gray-100',
  execution: 'text-green-600 border-green-200 bg-green-50',
  portfolio: 'text-red-600 border-red-200 bg-red-50',
  liquidity: 'text-red-600 border-red-200 bg-red-50',
  pipeline: 'text-gray-500 border-gray-300 bg-gray-100',
  memory: 'text-red-600 border-red-200 bg-red-50',
  simulation: 'text-red-600 border-red-200 bg-red-50',
  decision: 'text-red-600 border-red-200 bg-red-50',
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
      <Card className="!p-0 border-none bg-white">
        <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-6 py-4">
          <Terminal className="h-5 w-5 text-gray-500" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">System Stream</h2>
        </div>

        <div
            ref={box}
            className="max-h-[75vh] space-y-1.5 overflow-auto p-4 font-mono text-[13px] relative bg-white"
        >
          {items.map((l, i) => {
            const t = tagMap[l.agent]
            return (
              <div
                  key={`${l.time}-${i}`}
                  className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4 rounded hover:bg-gray-50 p-1.5 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-[180px]">
              <span className="text-xs text-gray-500 shrink-0">
                [{new Date(l.time).toLocaleTimeString(undefined, { hour12: false, fractionalSecondDigits: 3 })}]
              </span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${c[l.agent] ?? 'text-gray-500 border-gray-200 bg-[#f8f9fa]'}`}>
                {l.agent}
              </span>
                  {t ? <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${c[t]}`}>[{t}]</span> : null}
                </div>
                <p className="text-gray-500 leading-relaxed break-words flex-1">
                  {l.message}
                </p>
              </div>
            )
          })}
          {items.length === 0 && (
              <p className="text-gray-500 italic p-4 text-center">Awaiting log stream...</p>
          )}
        </div>
      </Card>
  )
}
