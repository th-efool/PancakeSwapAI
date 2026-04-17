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

const QUICK_QUERIES = ['best strategy right now', 'why no opportunity?', 'profit update', 'risk status', 'market status', 'simulate next trade']

const formatNumber = (value?: number, digits = 4) => (typeof value === 'number' ? value.toFixed(digits) : '--')
const formatPercent = (value?: number, digits = 1) => (typeof value === 'number' ? `${(value * 100).toFixed(digits)}%` : '--')

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
  const opp = state?.selectedOpportunity
  const performance = state?.performance
  const risk = state?.risk
  const regime = state?.regime ?? 'UNKNOWN'
  const confidence = opp?.confidence
  const expectedProfit = opp?.expectedProfit

  switch (intent) {
    case 'BEST_STRATEGY':
      if (!opp?.strategy || opp.strategy === 'none') return 'No active opportunity right now — system is still filtering for a safer edge.'
      return `Current best strategy is ${opp.strategy}. Expected profit is ${formatNumber(expectedProfit)} BNB with confidence ${formatPercent(confidence)}.`

    case 'NO_OPPORTUNITY_REASON':
      return risk?.reason
        ? `No execution yet because ${risk.reason}.`
        : `No clear opportunity detected in ${regime} conditions. Monitoring for stronger confirmations.`

    case 'PROFIT_INFO':
      return `Net profit is ${formatNumber(performance?.netProfit, 3)} BNB across ${performance?.totalTrades ?? 0} trades (win rate ${formatPercent(performance?.winRate)}).`

    case 'RISK_STATUS':
      return risk?.approved
        ? `Risk approved. Downside controls passed for ${opp?.strategy ?? 'the current setup'}.`
        : `Risk rejected: ${risk?.reason ?? 'unknown reason.'} Current risk score: ${formatNumber(state?.simulation?.riskScore, 3)}.`

    case 'MARKET_STATUS':
      return `Market regime is ${regime}. Volatility: ${formatNumber(state?.temporalSignals?.volatility, 4)}, velocity: ${formatNumber(state?.temporalSignals?.priceVelocity, 3)}.`

    case 'SIMULATION':
      return `Simulation snapshot — best: ${formatNumber(state?.simulation?.bestCase)} BNB, avg: ${formatNumber(state?.simulation?.avg)} BNB, worst: ${formatNumber(state?.simulation?.worstCase)} BNB.`

    default:
      return 'Command not recognized. Try one of the quick prompts below for live insights.'
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

  const runQuickQuery = (query: string) => {
    if (isLoading || submitting) return
    setInput(query)
    const intent = parseIntent(query)
    const response = resolveIntent(intent, data)
    setHistory((prev) => {
      const next = [...prev, { id: Date.now(), user: query, system: response }]
      return next.slice(-5)
    })
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

        <div className="flex flex-wrap gap-2">
          {QUICK_QUERIES.map((query) => (
            <button
              key={query}
              type="button"
              onClick={() => runQuickQuery(query)}
              disabled={isLoading || submitting}
              className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-500 transition-colors hover:border-red-200 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {query}
            </button>
          ))}
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
