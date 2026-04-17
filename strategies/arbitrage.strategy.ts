import type { MarketState, Opportunity, Pool } from '../core/types.js'
import config, { DEMO_MODE } from '../config.js'
import { computeAmountIn, computeExpectedProfit, computeGasCost } from '../core/tradingModel.js'

type PairGroup = Record<string, Pool[]>

function pairKey(pool: Pool): string {
  const a = pool.token0.address.toLowerCase()
  const b = pool.token1.address.toLowerCase()
  return a < b ? `${a}:${b}` : `${b}:${a}`
}

function groupByPair(pools: Pool[]): PairGroup {
  const groups: PairGroup = {}
  for (const pool of pools) {
    const key = pairKey(pool)
    if (!groups[key]) groups[key] = []
    groups[key].push(pool)
  }
  return groups
}

export function arbitrageStrategy(state: MarketState, signals?: any): Opportunity | null {
  if (state.pools.length < 2) return null

  console.log('Grouping pools by token pair')
  const groups = groupByPair(state.pools)
  const gasCost = computeGasCost(config)

  let best: Opportunity | null = null

  for (const pools of Object.values(groups)) {
    if (pools.length < 2) continue

    let low = pools[0]
    let high = pools[0]
    for (const pool of pools) {
      if (pool.price < low.price) low = pool
      if (pool.price > high.price) high = pool
    }

    if (low.price <= 0 || high.price <= 0) continue
    const edgeRate = high.price / low.price - 1
    const amountIn = computeAmountIn(Math.abs(edgeRate), config)
    const expectedProfit = computeExpectedProfit(edgeRate, amountIn, gasCost, config.slippageTolerance)
    if (expectedProfit <= 0) continue

    const opportunity: Opportunity = {
      tokenIn: low.token0.address,
      tokenOut: low.token1.address,
      amountIn,
      expectedProfit,
      gasCost,
      slippage: config.slippageTolerance,
      strategy: 'arbitrage',
      confidence: 0.9,
    }

    if (!best || opportunity.expectedProfit > best.expectedProfit) best = opportunity
  }

  if (!best) {
    if (DEMO_MODE) {
      const pool = state.pools[0]
      if (!pool) return null
      const amountIn = computeAmountIn(0.001, config)
      return {
        tokenIn: pool.token0.address,
        tokenOut: pool.token1.address,
        amountIn,
        expectedProfit: 0.0005 * amountIn,
        gasCost,
        slippage: config.slippageTolerance,
        strategy: 'arbitrage',
        confidence: Math.min(0.85, 0.3 + Math.random() * 0.3),
        signalStrength: signals?.aggregate?.signalStrength ?? 0,
        reason: 'Demo fallback: low-confidence arbitrage',
      }
    }
    console.log('No opportunity exists')
    return null
  }

  console.log('Profitable opportunity found')
  return {
    ...best,
    confidence: Math.min(best.confidence, 0.85),
    signalStrength: signals?.aggregate?.signalStrength ?? 0,
    reason: 'Cross-pool price dislocation',
  }
}

export default arbitrageStrategy
