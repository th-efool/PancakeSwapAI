import { getLastExecution } from '../agents/execution.agent'
import { getPerformance, logPerformance, recordTrade } from '../agents/portfolio.agent'
import { getLastRiskDecision } from '../agents/risk.agent'
import { getLogs, log } from './logger'
import { detectRegime } from './regime'
import { exportState } from './exportState'
import { pushMarketState } from './history'
import { computeSignals, pushState } from './temporal'
import type { MarketRegime, MarketState, Opportunity, TradeResult } from './types'
import { latestState } from './state'

export type Pipeline = {
  market: () => Promise<MarketState>
  strategy: (state: MarketState, signals: any, regime: MarketRegime) => Opportunity | null
  risk: (opportunity: Opportunity) => boolean
  execute: (opportunity: Opportunity) => Promise<TradeResult>
}

let cycleId = 0

const buildState = (state: MarketState | null, selectedOpportunity: Opportunity | null, signals: any, regime: MarketRegime) => {
  const pools = state?.pools ?? []
  const prices = pools.map((p) => p.price)
  const performance = getPerformance()

  return {
    timestamp: new Date().toISOString(),
    cycleId,
    market: {
      pools,
      summary: {
        poolCount: pools.length,
        avgPrice: prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
        totalLiquidity: pools.reduce((a, p) => a + p.liquidity, 0),
      },
    },
    strategies: selectedOpportunity
      ? [
          {
            name: selectedOpportunity.strategy,
            expectedProfit: selectedOpportunity.expectedProfit,
            confidence: selectedOpportunity.confidence,
            score: selectedOpportunity.score ?? selectedOpportunity.expectedProfit * selectedOpportunity.confidence,
          },
        ]
      : [],
    selectedOpportunity,
    temporalSignals: signals,
    regime,
    risk: getLastRiskDecision(),
    execution: getLastExecution(),
    performance,
    logs: getLogs(),
    configuredSource: latestState.marketData.configuredSource,
    usedSource: latestState.marketData.usedSource,
  }
}

const flushState = (state: MarketState | null, opportunity: Opportunity | null, signals: any, regime: MarketRegime) => {
  latestState.temporalSignals = signals
  latestState.regime = regime
  exportState(buildState(state, opportunity, signals, regime))
}

export async function runPipeline(pipeline: Pipeline): Promise<void> {
  try {
    cycleId += 1
    log('pipeline', `Cycle ${cycleId} start`)

    const state = await pipeline.market()
    pushMarketState(state)
    pushState(state)
    const signals = computeSignals()
    const regime = detectRegime(signals)
    console.log('Market regime:', regime)
    log('pipeline', `Market regime: ${regime}`)

    latestState.temporalSignals = signals
    latestState.regime = regime
    log('pipeline', `Temporal signal: ${JSON.stringify(signals)}`)

    if (!state || !state.pools.length) {
      log('pipeline', 'No market data')
      flushState(state, null, signals, regime)
      return
    }

    const opportunity: Opportunity | null = pipeline.strategy(state, signals, regime)
    if (!opportunity) {
      log('pipeline', 'No opportunity')
      flushState(state, null, signals, regime)
      return
    }

    if (!pipeline.risk(opportunity)) {
      log('pipeline', 'Risk rejected')
      flushState(state, opportunity, signals, regime)
      return
    }

    const result: TradeResult = await pipeline.execute(opportunity)
    recordTrade(result, opportunity)
    logPerformance()

    exportState(buildState(state, opportunity, signals, regime))

    if (!result.success) {
      log('pipeline', `Trade failed${result.error ? `: ${result.error}` : ''}`)
      return
    }

    log('pipeline', `Trade success${typeof result.actualProfit === 'number' ? ` | profit: ${result.actualProfit}` : ''}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`Pipeline error: ${message}`)
    log('pipeline', `Pipeline error: ${message}`)
  }
}
