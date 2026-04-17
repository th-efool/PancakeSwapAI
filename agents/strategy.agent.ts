import { computePerformanceScore, getStrategyStats } from '../core/memory/strategyMemory.js'
import { log } from '../core/logger.js'
import type { MarketRegime, MarketState, Opportunity, SignalSet } from '../core/types.js'
import config from '../config.js'

export type StrategyFn = (state: MarketState, signals: SignalSet | null, regime: MarketRegime) => Opportunity | null
export type StrategyInput = StrategyFn | StrategyFn[]

const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v))
const safe = (v: number) => (Number.isFinite(v) ? v : 0)

const scoreOpportunity = (opp: Opportunity, signals: SignalSet | null) => {
  const profitNorm = opp.amountIn > 0 ? opp.expectedProfit / opp.amountIn : 0
  const conf = clamp(opp.confidence)
  const signalStrength = clamp(opp.signalStrength ?? signals?.aggregate.signalStrength ?? 0)
  return clamp(profitNorm * 0.5 + conf * 0.3 + signalStrength * 0.2)
}

const allowedStrategies = (regime: MarketRegime): string[] => {
  if (regime === 'TRENDING') return ['momentum', 'arbitrage', 'liquidityImbalance']
  if (regime === 'MEAN_REVERTING') return ['meanReversion', 'arbitrage']
  if (regime === 'CHAOTIC') return ['arbitrage', 'meanReversion', 'liquidityImbalance', 'momentum']
  if (regime === 'IDLE') return ['meanReversion', 'liquidityImbalance']
  if (regime === 'INSUFFICIENT_DATA') return ['meanReversion']
  if (regime === 'VOLATILE') return ['arbitrage', 'liquidityImbalance']
  return ['arbitrage', 'meanReversion', 'liquidityImbalance', 'momentum']
}

export function strategyAgent(state: MarketState, strategyImpl: StrategyInput, signals: SignalSet | null, regime: MarketRegime): Opportunity | null {
  if (!state.pools.length) {
    log('strategy', 'Strategy skipped: empty market state')
    return null
  }

  const allow = new Set(allowedStrategies(regime))
  if (!allow.size) {
    log('strategy', `No strategies allowed for regime=${regime}`)
    return null
  }

  const strategies = (Array.isArray(strategyImpl) ? strategyImpl : [strategyImpl]).filter((fn) => {
    const key = fn.name.replace('Strategy', '')
    return key === 'microMomentumProbe' || key === 'adaptiveParticipation' || allow.has(key)
  })
  const primaryStrategies = strategies.filter((fn) => {
    const key = fn.name.replace('Strategy', '')
    return key !== 'microMomentumProbe' && key !== 'adaptiveParticipation'
  })
  const adaptiveParticipation = strategies.find((fn) => fn.name.replace('Strategy', '') === 'adaptiveParticipation')
  const probeStrategy = strategies.find((fn) => fn.name.replace('Strategy', '') === 'microMomentumProbe')
  log('strategy', `Running ${strategies.length} strategies | regime=${regime} | allowed=${Array.from(allow).join(',')}`)

  const minProfitThreshold = regime === 'CHAOTIC' ? 0.0001 : config.minProfitThreshold
  const opportunities = primaryStrategies
    .map((strategy) => strategy(state, signals, regime))
    .filter((opportunity): opportunity is Opportunity => opportunity !== null)
    .filter((opportunity) => safe(opportunity.expectedProfit) >= minProfitThreshold)
    .map((opportunity) => ({
      ...opportunity,
      confidence: clamp(
        opportunity.confidence *
          (regime === 'IDLE' ? 0.7 : regime === 'INSUFFICIENT_DATA' ? 0.5 : 1),
      ),
      volatility: opportunity.volatility ?? signals?.temporal.volatility ?? 0,
      signalStrength: clamp(opportunity.signalStrength ?? signals?.aggregate.signalStrength ?? 0),
    }))

  log('strategy', `Found ${opportunities.length} opportunities`)
  if (!opportunities.length && probeStrategy) {
    const probe = probeStrategy(state, signals, regime)
    if (probe) {
      log('strategy', 'No strong opportunity found. Using micro momentum probe fallback.')
      return {
        ...probe,
        confidence: clamp(probe.confidence),
        volatility: probe.volatility ?? signals?.temporal.volatility ?? 0,
        signalStrength: clamp(probe.signalStrength ?? signals?.aggregate.signalStrength ?? 0),
      }
    }
  }
  if (!opportunities.length && adaptiveParticipation) {
    const fallback = adaptiveParticipation(state, signals, regime)
    if (!fallback) return null
    return {
      ...fallback,
      confidence: clamp(fallback.confidence),
      volatility: fallback.volatility ?? signals?.temporal.volatility ?? 0,
      signalStrength: clamp(fallback.signalStrength ?? signals?.aggregate.signalStrength ?? 0),
    }
  }
  if (!opportunities.length) return null

  let best: Opportunity | null = null
  let bestBaseScore = 0
  let bestPerfScore = 0
  let bestFinalScore = -Infinity

  for (const opp of opportunities) {
    const baseScore = safe(scoreOpportunity(opp, signals))
    const performanceScore = safe(computePerformanceScore(opp.strategy))
    const scoreMultiplier = clamp(1 + performanceScore, 0, 2)
    const finalScore = safe(baseScore * scoreMultiplier)
    const stats = getStrategyStats(opp.strategy)
    const winRate = stats.wins / Math.max(stats.totalTrades, 1)
    const recentMomentum = stats.last5Profits.length
      ? stats.last5Profits.reduce((sum, p) => sum + (Number.isFinite(p) ? p : 0), 0) / stats.last5Profits.length
      : 0

    log('memory', JSON.stringify({ strategy: opp.strategy, winRate, avgProfit: stats.avgProfit, recentMomentum, performanceScore }))

    opp.score = finalScore
    if (finalScore > bestFinalScore) {
      best = opp
      bestBaseScore = baseScore
      bestPerfScore = performanceScore
      bestFinalScore = finalScore
    }
  }

  if (!best) return null

  log('strategy', JSON.stringify({ selected: best.strategy, baseScore: bestBaseScore, performanceScore: bestPerfScore, finalScore: bestFinalScore }))
  log('strategy', `Selected strategy=${best.strategy} reason=${best.reason ?? 'highest score'}`)
  return best
}

export default strategyAgent
