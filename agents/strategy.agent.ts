import { log } from '../core/logger'
import type { MarketRegime, MarketState, Opportunity, SignalSet } from '../core/types'

export type StrategyFn = (state: MarketState, signals: SignalSet | null, regime: MarketRegime) => Opportunity | null
export type StrategyInput = StrategyFn | StrategyFn[]

const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v))

const scoreOpportunity = (opp: Opportunity, signals: SignalSet | null) => {
  const profitNorm = opp.amountIn > 0 ? opp.expectedProfit / opp.amountIn : 0
  const conf = clamp(opp.confidence)
  const signalStrength = clamp(opp.signalStrength ?? signals?.aggregate.signalStrength ?? 0)
  return clamp(profitNorm * 0.5 + conf * 0.3 + signalStrength * 0.2)
}

const allowedStrategies = (regime: MarketRegime): string[] => {
  if (regime === 'TRENDING') return ['momentum', 'arbitrage', 'liquidityImbalance']
  if (regime === 'MEAN_REVERTING') return ['meanReversion', 'arbitrage']
  if (regime === 'CHAOTIC') return ['arbitrage']
  if (regime === 'IDLE') return []
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

  const strategies = (Array.isArray(strategyImpl) ? strategyImpl : [strategyImpl]).filter((fn) => allow.has(fn.name.replace('Strategy', '')))
  log('strategy', `Running ${strategies.length} strategies | regime=${regime} | allowed=${Array.from(allow).join(',')}`)

  const opportunities = strategies
    .map((strategy) => strategy(state, signals, regime))
    .filter((opportunity): opportunity is Opportunity => opportunity !== null)
    .map((opportunity) => ({
      ...opportunity,
      signalStrength: clamp(opportunity.signalStrength ?? signals?.aggregate.signalStrength ?? 0),
    }))

  log('strategy', `Found ${opportunities.length} opportunities`)
  if (!opportunities.length) return null

  let best = opportunities[0]
  let bestScore = scoreOpportunity(best, signals)

  for (const opp of opportunities) {
    const score = scoreOpportunity(opp, signals)
    log(
      'strategy',
      `strategy=${opp.strategy} expectedProfit=${opp.expectedProfit.toFixed(6)} confidence=${opp.confidence.toFixed(4)} signalStrength=${(opp.signalStrength ?? 0).toFixed(4)} score=${score.toFixed(4)} reason=${opp.reason ?? 'n/a'}`,
    )
    if (score > bestScore) {
      best = opp
      bestScore = score
    }
  }

  log('strategy', `Selected strategy=${best.strategy} reason=${best.reason ?? 'highest score'}`)
  return { ...best, score: bestScore }
}

export default strategyAgent
