'use client'

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'
import Card from './Card.tsx'
import { type LiveState, useLiveState } from '../app/hooks/useLiveState.ts'

type Intent =
  | 'BEST_STRATEGY'
  | 'NO_OPPORTUNITY_REASON'
  | 'PROFIT_INFO'
  | 'RISK_STATUS'
  | 'MARKET_STATUS'
  | 'SIMULATION'
  | 'UNKNOWN'

type HistoryEntry = {
  id: number
  user: string
  system: string
}

function parseIntent(input: string): Intent {
  const q = input.toLowerCase()

  if (q.includes('best strategy')) return 'BEST_STRATEGY'
  if (q.includes('why no')) return 'NO_OPPORTUNITY_REASON'
  if (q.includes('profit')) return 'PROFIT_INFO'
  if (q.includes('risk')) return 'RISK_STATUS'
  if (q.includes('market')) return 'MARKET_STATUS'
  if (q.includes('simulate')) return 'SIMULATION'
  return 'UNKNOWN'
}

function resolveIntent(intent: Intent, state: LiveState | null) {
  switch (intent) {
    case 'BEST_STRATEGY':
      return state?.selectedOpportunity?.strategy
        ? `Best strategy is ${state.selectedOpportunity.strategy} with expected profit ${state.selectedOpportunity.expectedProfit ?? 0}`
        : 'No active opportunity.'

    case 'NO_OPPORTUNITY_REASON':
      return state?.risk?.reason || 'No clear opportunity detected.'

    case 'PROFIT_INFO':
      return `Net profit: ${state?.performance?.netProfit || 0}`

    case 'RISK_STATUS':
      return state?.risk?.approved ? 'Risk approved.' : `Risk rejected: ${state?.risk?.reason ?? 'unknown reason.'}`

    case 'MARKET_STATUS':
      return `Market regime: ${state?.regime ?? 'UNKNOWN'}`

    case 'SIMULATION':
      return 'Simulation feature coming soon.'

    default:
      return 'Command not recognized.'
  }
}

export default function CommandConsole() {
  const { data } = useLiveState()
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [submitting, setSubmitting] = useState(false)
  const endRef = useRef<HTMLDivElement | null>(null)

  const isLoading = useMemo(() => !data, [data])

  const submit = (event?: FormEvent) => {
    event?.preventDefault()
    const userInput = input.trim()
    if (!userInput || isLoading || submitting) return

    setSubmitting(true)
    const intent = parseIntent(userInput)
    const response = resolveIntent(intent, data)

    setHistory((prev) => {
      const next = [...prev, { id: Date.now(), user: userInput, system: response }]
      return next.slice(-5)
    })

    setInput('')
    setSubmitting(false)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') submit()
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [history])

  return (
    <Card title="Command Console">
      <form onSubmit={submit} className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            aria-label="Command input"
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Try: best strategy, risk, market status"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#111111] outline-none ring-0 transition-colors focus:border-red-200"
          />
          <button
            type="submit"
            disabled={isLoading || submitting || !input.trim()}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>

        <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-gray-200 bg-[#f8f9fa] p-3">
          {isLoading ? <p className="text-sm text-gray-500">Loading live state...</p> : null}
          {!isLoading && history.length === 0 ? <p className="text-sm text-gray-500">No queries yet.</p> : null}

          {history.map((entry) => (
            <div key={entry.id} className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
              <p className="font-medium text-[#111111]">User: {entry.user}</p>
              <p className="mt-1 text-gray-500">System: {entry.system}</p>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </form>
    </Card>
  )
}
