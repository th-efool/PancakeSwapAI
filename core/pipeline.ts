import { getLastExecution } from '../agents/execution.agent.js'
import { getPerformance, logPerformance, recordTrade } from '../agents/portfolio.agent.js'
import { getLastRiskDecision } from '../agents/risk.agent.js'
import { getLogs, log } from './logger.js'
import { detectRegime } from './regime.js'
import { exportState } from './exportState.js'
import { getMarketHistory, pushMarketState } from './history.js'
import { extractSignals } from './signals.js'
import type { MarketRegime, MarketState, Opportunity, TradeResult, RegimeAssessment, SignalSet } from './types.js'
import { latestState } from './state.js'

export type Pipeline = {
  market: () => Promise<MarketState>
  strategy: (state: MarketState, signals: SignalSet | null, regime: MarketRegime) => Opportunity | null
  risk: (opportunity: Opportunity) => boolean
  execute: (opportunity: Opportunity) => Promise<TradeResult>
}

let cycleId = 0
const EXECUTION_DROUGHT_THRESHOLD = 3

const buildState = (
  state: MarketState | null,
  selectedOpportunity: Opportunity | null,
  signals: SignalSet | null,
  regimeAssessment: RegimeAssessment,
) => {
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
            signalStrength: selectedOpportunity.signalStrength ?? signals?.aggregate.signalStrength ?? 0,
            reason: selectedOpportunity.reason ?? regimeAssessment.reason,
            score: selectedOpportunity.score ?? 0,
          },
        ]
      : [],
    selectedOpportunity,
    signals,
    temporalSignals: signals?.temporal ?? null,
    regime: regimeAssessment.regime,
    regimeConfidence: regimeAssessment.confidence,
    regimeReason: regimeAssessment.reason,
    risk: getLastRiskDecision(),
    execution: getLastExecution(),
    performance,
    logs: getLogs(),
    configuredSource: latestState.marketData.configuredSource,
    usedSource: latestState.marketData.usedSource,
    runtime: latestState.runtime,
  }
}

const flushState = (
  state: MarketState | null,
  opportunity: Opportunity | null,
  signals: SignalSet | null,
  regimeAssessment: RegimeAssessment,
) => {
  latestState.temporalSignals = signals
  latestState.regime = regimeAssessment.regime
  latestState.regimeConfidence = regimeAssessment.confidence
  latestState.regimeReason = regimeAssessment.reason
  latestState.runtime.executionDroughtThreshold = EXECUTION_DROUGHT_THRESHOLD
  exportState(buildState(state, opportunity, signals, regimeAssessment))
}

export async function runPipeline(pipeline: Pipeline): Promise<void> {
  try {
    cycleId += 1
    log('pipeline', `Cycle ${cycleId} start`)

    const state = await pipeline.market()
    pushMarketState(state)
    const history = getMarketHistory().slice(0, -1)
    const signals = extractSignals(state, history)
    const regimeAssessment = detectRegime(signals)
    console.log('Market regime:', regimeAssessment.regime)
    log(
      'pipeline',
      `Market regime=${regimeAssessment.regime} confidence=${regimeAssessment.confidence.toFixed(3)} reason=${regimeAssessment.reason}`,
    )
    log(
      'pipeline',
      `Signal aggregate=${JSON.stringify(signals?.aggregate ?? null)} poolCount=${signals?.poolCount ?? 0} historyLength=${signals?.historyLength ?? 0} source=${signals?.source ?? 'none'}`,
    )

    latestState.temporalSignals = signals
    latestState.regime = regimeAssessment.regime
    latestState.regimeConfidence = regimeAssessment.confidence
    latestState.regimeReason = regimeAssessment.reason
    latestState.runtime.executionDroughtThreshold = EXECUTION_DROUGHT_THRESHOLD

    if (!state || !state.pools.length) {
      log('pipeline', 'No market data')
      flushState(state, null, signals, regimeAssessment)
      return
    }

    const opportunity: Opportunity | null = pipeline.strategy(state, signals, regimeAssessment.regime)
    if (!opportunity) {
      log('pipeline', `No opportunity | regime=${regimeAssessment.regime} reason=${regimeAssessment.reason}`)
      flushState(state, null, signals, regimeAssessment)
      return
    }

    log(
      'pipeline',
      `Opportunity strategy=${opportunity.strategy} signalStrength=${(opportunity.signalStrength ?? 0).toFixed(3)} reason=${opportunity.reason ?? 'n/a'}`,
    )

    let shouldExecute = pipeline.risk(opportunity)
    let execOpportunity = opportunity

    if (!shouldExecute) {
      latestState.runtime.executionDroughtCount += 1
      const canBootstrap =
        latestState.runtime.executionDroughtCount >= EXECUTION_DROUGHT_THRESHOLD && opportunity.expectedProfit > 0
      if (canBootstrap) {
        execOpportunity = { ...opportunity, executionReason: 'bootstrap' }
        latestState.runtime.lastExecutionReason = 'bootstrap'
        log(
          'pipeline',
          `Risk rejected; bootstrap execution enabled drought=${latestState.runtime.executionDroughtCount} expectedProfit=${opportunity.expectedProfit}`,
        )
        shouldExecute = true
      } else {
        log('pipeline', 'Risk rejected')
        flushState(state, opportunity, signals, regimeAssessment)
        return
      }
    } else {
      latestState.runtime.lastExecutionReason = 'standard'
    }

    const result: TradeResult = await pipeline.execute(execOpportunity)
    recordTrade(result, opportunity)
    logPerformance()

    exportState(buildState(state, opportunity, signals, regimeAssessment))

    if (!result.success) {
      log('pipeline', `Trade failed${result.error ? `: ${result.error}` : ''}`)
      return
    }

    latestState.runtime.executionDroughtCount = 0
    log('pipeline', `Trade success${typeof result.actualProfit === 'number' ? ` | profit: ${result.actualProfit}` : ''}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`Pipeline error: ${message}`)
    log('pipeline', `Pipeline error: ${message}`)
  }
}
