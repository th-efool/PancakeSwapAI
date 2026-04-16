'use client'

import { useEffect, useRef, useState } from 'react'
import { isDataSource, normalizeMarketRegime, type DataSource, type MarketRegime } from '../../lib/market'

export type LiveState = {
  timestamp?: string
  cycleId?: number
  regime?: MarketRegime
  market?: {
    pools?: Array<{
      address: string
      token0?: { symbol?: string }
      token1?: { symbol?: string }
      price?: number
      liquidity?: number
    }>
    summary?: {
      poolCount?: number
      avgPrice?: number
      totalLiquidity?: number
    }
  }
  strategies?: Array<{
    name: string
    expectedProfit: number
    confidence: number
    score: number
  }>
  selectedOpportunity?: {
    strategy?: string
    expectedProfit?: number
    confidence?: number
    score?: number
  } | null
  temporalSignals?: {
    priceDelta?: number
    priceVelocity?: number
    volatility?: number
  } | null
  risk?: { approved?: boolean; reason?: string }
  execution?: {
    tokenIn?: string | null
    tokenOut?: string | null
    amountIn?: number | null
    amountOutQuote?: number | null
    amountOutMin?: number | null
    gasEstimate?: string | null
    mode?: string
  }
  performance?: {
    totalTrades?: number
    netProfit?: number
    winRate?: number
    totalProfit?: number
  }

  memory?: {
    strategy?: string
    winRate?: number
    avgProfit?: number
    recentMomentum?: number
    performanceScore?: number
  }
  simulation?: {
    bestProfit?: number
    worstProfit?: number
    avgProfit?: number
    riskScore?: number
    confidenceAdjusted?: number
  }
  decision?: {
    selectedStrategy?: string
    baseScore?: number
    performanceScore?: number
    finalScore?: number
    regime?: string
    reason?: string
  }
  logs?: Array<{ agent: string; message: string; time: number }>

  configuredSource?: DataSource
  usedSource?: DataSource | null
}

export type TimelineItem = {
  cycleId: number
  regime: NonNullable<LiveState['regime']>
  strategy: string
  expectedProfit: number
  confidence: number
  score: number
}

function normalizeLiveState(input: unknown): LiveState | null {
  if (!input || typeof input !== 'object') return null
  const raw = input as LiveState

  return {
    ...raw,
    regime: normalizeMarketRegime(raw.regime),
    configuredSource: isDataSource(raw.configuredSource) ? raw.configuredSource : undefined,
    usedSource: raw.usedSource == null ? null : isDataSource(raw.usedSource) ? raw.usedSource : null,
  }
}

export function useLiveState() {
  const [data, setData] = useState<LiveState | null>(null)
  const [blink, setBlink] = useState(false)
  const [connected, setConnected] = useState(false)
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const last = useRef<string | undefined>(undefined)

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null

    const fetchData = async () => {
      try {
        const res = await fetch('/latest_state.json', { cache: 'no-store' })
        const json = normalizeLiveState(await res.json())
        if (!json) return
        setData(json)
        setConnected(true)
        if (json.timestamp && json.timestamp !== last.current) {
          last.current = json.timestamp
          setBlink(true)
          if (t) clearTimeout(t)
          t = setTimeout(() => setBlink(false), 700)

          if (typeof json.cycleId === 'number') {
            const strategy = json.selectedOpportunity?.strategy ?? 'none'
            setTimeline((prev) => {
              const next: TimelineItem = {
                cycleId: json.cycleId ?? 0,
                regime: json.regime ?? 'UNKNOWN',
                strategy,
                expectedProfit: json.selectedOpportunity?.expectedProfit ?? 0,
                confidence: json.selectedOpportunity?.confidence ?? 0,
                score: json.selectedOpportunity?.score ?? 0,
              }
              const merged = [...prev.filter((p) => p.cycleId !== next.cycleId), next]
              return merged.slice(-8)
            })
          }
        }
      } catch {
        setConnected(false)
        setData(null)
      }
    }

    fetchData()
    const i = setInterval(fetchData, 2000)
    return () => {
      if (t) clearTimeout(t)
      clearInterval(i)
    }
  }, [])

  return { data, blink, connected, timeline }
}
