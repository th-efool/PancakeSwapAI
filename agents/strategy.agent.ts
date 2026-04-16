import { log } from '../core/logger'
import type { MarketRegime, MarketState, Opportunity } from '../core/types'

export type StrategyFn = (state: MarketState, signals: any, regime: string) => Opportunity | null
export type StrategyInput = StrategyFn | StrategyFn[]

type OpportunityScorer = (opportunity: Opportunity) => number

const scoreOpportunity: OpportunityScorer = (opp) => opp.expectedProfit * opp.confidence

const getMultiplier = (strategy: string, regime: MarketRegime): number => {
  if (regime === 'VOLATILE') return 0.7

  if (regime === 'TRENDING') {
    if (strategy === 'liquidityImbalance') return 1.2
    if (strategy === 'meanReversion') return 0.5
    return 1
  }

  if (regime === 'MEAN_REVERTING') {
    if (strategy === 'meanReversion') return 1.2
    return 0.7
  }

  return 1
}

export function strategyAgent(state: MarketState, strategyImpl: StrategyInput, signals: any, regime: MarketRegime): Opportunity | null {
  if (!state.pools.length) {
    log('strategy', 'Strategy skipped: empty market state')
    return null
  }

  const strategies = Array.isArray(strategyImpl) ? strategyImpl : [strategyImpl]
  log('strategy', `Running ${strategies.length} strategies | regime=${regime}`)

  const opportunities = strategies
    .map((strategy) => strategy(state, signals, regime))
    .filter((opportunity): opportunity is Opportunity => opportunity !== null)
    .map((opportunity) => {
      const m = getMultiplier(opportunity.strategy, regime)
      return { ...opportunity, confidence: Math.max(0, Math.min(1, opportunity.confidence * m)) }
    })

  log('strategy', `Found ${opportunities.length} opportunities`)
  if (!opportunities.length) return null

  let best = opportunities[0]
  let bestScore = scoreOpportunity(best)

  for (const opp of opportunities) {
    const score = scoreOpportunity(opp)
    log('strategy', `strategy=${opp.strategy} expectedProfit=${opp.expectedProfit} confidence=${opp.confidence} score=${score}`)
    if (score > bestScore) {
      best = opp
      bestScore = score
    }
  }

  log('strategy', 'Opportunity found')
  return { ...best, score: bestScore }
}

export default strategyAgent
