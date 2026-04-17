import { getLastExecution } from '../agents/execution.agent.js'
import { getPerformance, logPerformance, recordOpportunitySeen, recordRejectedOpportunity, recordTrade } from '../agents/portfolio.agent.js'
import { getLastRiskDecision } from '../agents/risk.agent.js'
import { getLastEvaluatedStrategies } from '../agents/strategy.agent.js'
import { getLogs, log } from './logger.js'
import { detectRegime } from './regime.js'
import { exportState } from './exportState.js'
import { getMarketHistory, pushMarketState } from './history.js'
import { extractSignals } from './signals.js'
import type { MarketRegime, MarketState, Opportunity, TradeResult, RegimeAssessment, SignalSet } from './types.js'
import { latestState } from './state.js'
import { DEMO_MODE } from '../config.js'

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
  evaluatedStrategies: ReturnType<typeof getLastEvaluatedStrategies>,
  signals: SignalSet | null,
  regimeAssessment: RegimeAssessment,
) => {
  const pools = state?.pools ?? []
  const prices = pools.map((p) => p.price)
  const performance = getPerformance()
  const fallbackProfit =
    performance.avgProfit ??
    performance.avgProfitPerTrade ??
    0.0001

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
    strategies: evaluatedStrategies,
    memory: selectedOpportunity
        ? {
          strategy: selectedOpportunity.strategy,
          winRate: performance.winRate ?? 0,
          avgProfit: performance.avgProfit ?? performance.avgProfitPerTrade ?? 0,
          recentMomentum: selectedOpportunity.expectedProfit ?? 0,
          performanceScore: (performance.netProfit ?? 0) / Math.max(performance.totalTrades ?? 1, 1),
        }
        : null,

    simulation: selectedOpportunity
        ? {
          bestCase: selectedOpportunity.expectedProfit * 1.2,
          worstCase: selectedOpportunity.expectedProfit * 0.6,
          avg: selectedOpportunity.expectedProfit,
          riskScore: 1 - (selectedOpportunity.confidence ?? 0),
          confidenceAdjusted: (selectedOpportunity.confidence ?? 0) * 0.9,
        }
        : null,

    decision: selectedOpportunity
        ? {
          regime: regimeAssessment.regime,
          selectedStrategy: selectedOpportunity.strategy,
          baseScore: selectedOpportunity.signalStrength ?? 0,
          memoryScore:
              (performance.netProfit ?? 0) / Math.max(performance.totalTrades ?? 1, 1),
          finalScore: selectedOpportunity.score ?? selectedOpportunity.expectedProfit ?? 0,
          reason: selectedOpportunity.reason ?? regimeAssessment.reason,
        }
        : null,
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
  evaluatedStrategies: ReturnType<typeof getLastEvaluatedStrategies>,
  signals: SignalSet | null,
  regimeAssessment: RegimeAssessment,
) => {
  latestState.temporalSignals = signals
  latestState.regime = regimeAssessment.regime
  latestState.regimeConfidence = regimeAssessment.confidence
  latestState.regimeReason = regimeAssessment.reason
  latestState.runtime.executionDroughtThreshold = EXECUTION_DROUGHT_THRESHOLD
  exportState(buildState(state, opportunity, evaluatedStrategies, signals, regimeAssessment))
}

export async function runPipeline(pipeline: Pipeline): Promise<void> {
  try {
    cycleId += 1
    log('pipeline', `Cycle ${cycleId} start`)
    log('pipeline', DEMO_MODE ? 'DEMO MODE ACTIVE — signal floor applied' : 'LIVE MODE')

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
      flushState(state, null, [], signals, regimeAssessment)
      return
    }

    const opportunity: Opportunity | null = pipeline.strategy(state, signals, regimeAssessment.regime)
    const evaluatedStrategies = getLastEvaluatedStrategies()
    if (!opportunity) {
      log('pipeline', `No opportunity | regime=${regimeAssessment.regime} reason=${regimeAssessment.reason}`)
      flushState(state, null, evaluatedStrategies, signals, regimeAssessment)
      return
    }
    recordOpportunitySeen()

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
        recordRejectedOpportunity()
        flushState(state, opportunity, evaluatedStrategies, signals, regimeAssessment)
        return
      }
    } else {
      latestState.runtime.lastExecutionReason = 'standard'
    }

    const result: TradeResult = await pipeline.execute(execOpportunity)
    recordTrade(result, opportunity)
    logPerformance()

    exportState(buildState(state, opportunity, evaluatedStrategies, signals, regimeAssessment))

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
