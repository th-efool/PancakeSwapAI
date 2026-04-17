'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
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

const QUICK_ACTIONS = [
  'What is the best strategy right now?',
  'Why no trade right now?',
  'Show current profit info',
  'What is the current risk status?',
  'What is the current market status?'
]

function formatNumber(value: number | null | undefined, digits = 4) {
  return Number(value ?? 0).toFixed(digits)
}

function formatPercent(value: number | null | undefined, digits = 2) {
  return `${(Number(value ?? 0) * 100).toFixed(digits)}%`
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
  const performance = state?.performance
  const risk = state?.risk
  const opportunity = state?.selectedOpportunity
  const regime = state?.regime ?? 'UNKNOWN'

  switch (intent) {
    case 'BEST_STRATEGY': {
      if (!opportunity?.strategy) {
        return `
There is no active strategy recommendation right now.

The agent is scanning live opportunities,
and it will prioritize a strategy once confidence and risk conditions align.
`.trim()
      }

      const expectedProfit = opportunity.expectedProfit ?? 0
      const confidence = opportunity.confidence ?? 0

      return `
Right now, the system is prioritizing **${opportunity.strategy}**.

Expected profit is around ${formatNumber(expectedProfit)} BNB
with confidence near ${formatPercent(confidence)}.

This suggests a ${confidence > 0.7 ? 'high-quality' : 'moderate'} opportunity,
but execution still depends on risk validation.
`.trim()
    }

    case 'NO_OPPORTUNITY_REASON':
      return `
No trade is being executed at the moment.

Reason:
${risk?.reason || 'The system is not seeing a strong enough edge.'}

The agent is currently observing the market and waiting
for better alignment between signals and risk conditions.
`.trim()

    case 'PROFIT_INFO':
      return `
The system has executed ${performance?.totalTrades ?? 0} trades so far.

Current net profit stands at ${formatNumber(performance?.netProfit)} BNB,
with a win rate of ${formatPercent(performance?.winRate)}.

Performance remains ${(performance?.winRate ?? 0) > 0.7 ? 'strong' : 'moderate'} under current market conditions.
`.trim()

    case 'RISK_STATUS': {
      const riskApproved = Boolean(risk?.approved)

      return `
Risk validation is currently ${riskApproved ? 'approved' : 'not approved'}.

${riskApproved ? 'The system is allowed to execute when an opportunity is selected.' : `Reason: ${risk?.reason ?? 'Risk constraints are currently blocking execution.'}`}

The agent will continue monitoring exposure and market structure before acting.
`.trim()
    }

    case 'MARKET_STATUS':
      return `
The market is currently classified as **${regime}**.

Volatility is at ${formatNumber(state?.temporalSignals?.volatility)},
while price velocity remains ${formatNumber(state?.temporalSignals?.priceVelocity)}.

This suggests ${regime === 'CHAOTIC' ? 'unstable conditions with conflicting signals.' : 'relatively stable conditions.'}
`.trim()

    case 'SIMULATION':
      return `
Simulation mode is not available yet.

The panel can still explain current strategy, risk, and market state
based on the live engine context.
`.trim()

    default:
      return `
I could not map that request to a known command.

Try asking about best strategy, risk, profit, market status,
or why no opportunity is being executed.
`.trim()
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

    setTimeout(() => {
      const intent = parseIntent(userInput)
      const response = resolveIntent(intent, data)

      setHistory((prev) => {
        const next = [...prev, { id: Date.now(), user: userInput, system: response }]
        return next.slice(-8)
      })

      setInput('')
      setSubmitting(false)
    }, 300)
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [history])

  return (
    <Card title="Command Console">
      <form onSubmit={submit} className="space-y-3">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
          <p className="mb-2 text-xs text-gray-500">Quick actions</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((query) => (
              <button
                key={query}
                type="button"
                onClick={() => setInput(query)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 transition-colors hover:border-red-200 hover:text-red-600"
              >
                {query}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            aria-label="Command input"
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about strategy, risk, market behavior..."
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#111111] shadow-sm outline-none ring-0 transition focus:ring-2 focus:ring-red-200"
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
          {submitting ? <p className="text-sm text-gray-500">Analyzing system state...</p> : null}
          {!isLoading && history.length === 0 ? <p className="text-sm text-gray-500">No queries yet.</p> : null}

          <div className="space-y-3">
            {history.map((entry) => (
              <div key={entry.id} className="space-y-1">
                <div className="text-xs text-gray-400">You</div>
                <div className="rounded-lg border bg-white p-2 text-sm">{entry.user}</div>

                <div className="text-xs text-gray-400">System</div>
                <div className="whitespace-pre-line rounded-lg border border-red-100 bg-red-50 p-2 text-sm">
                  {entry.system}
                </div>
              </div>
            ))}
          </div>
          <div ref={endRef} />
        </div>
      </form>
    </Card>
  )
}
