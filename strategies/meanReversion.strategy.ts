import { log } from '../core/logger.js'
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
  const out: PairGroup = {}
  for (const pool of pools) {
    const key = pairKey(pool)
    if (!out[key]) out[key] = []
    out[key].push(pool)
  }
  return out
}

function legacyMeanReversion(state: MarketState): Opportunity | null {
  if (state.pools.length < 2) return null

  const groups = groupByPair(state.pools)
  const gasCost = computeGasCost(config)

  let best: Opportunity | null = null

  for (const pools of Object.values(groups)) {
    if (pools.length < 2) continue

    const avg = pools.reduce((sum, pool) => sum + pool.price, 0) / pools.length
    if (!Number.isFinite(avg) || avg <= 0) continue

    let low = pools[0]
    let high = pools[0]
    for (const pool of pools) {
      if (pool.price < low.price) low = pool
      if (pool.price > high.price) high = pool
    }

    const spread = (high.price - low.price) / avg
    if (!Number.isFinite(spread) || spread < 0.01) continue

    const edgeRate = avg / low.price - 1
    const amountIn = computeAmountIn(spread, config)
    const expectedProfit = computeExpectedProfit(edgeRate, amountIn, gasCost, config.slippageTolerance)
    if (!Number.isFinite(expectedProfit) || expectedProfit <= 0) continue

    const opp: Opportunity = {
      tokenIn: low.token0.address,
      tokenOut: low.token1.address,
      amountIn,
      expectedProfit,
      gasCost,
      slippage: config.slippageTolerance,
      strategy: 'meanReversion',
      confidence: 0.6,
    }

    if (!best || opp.expectedProfit > best.expectedProfit) best = opp
  }

  return best
}

export function meanReversionStrategy(state: MarketState, signals: any): Opportunity | null {
  const gasCost = computeGasCost(config)
  const demoFallback = (pool: Pool, direction: number, edge: number): Opportunity => {
    const amountIn = computeAmountIn(Math.max(Math.abs(edge), 0.001), config)
    return {
      tokenIn: direction > 0 ? pool.token0.address : pool.token1.address,
      tokenOut: direction > 0 ? pool.token1.address : pool.token0.address,
      amountIn,
      expectedProfit: Math.abs(edge) * amountIn * 0.5,
      gasCost,
      slippage: config.slippageTolerance,
      strategy: 'meanReversion',
      confidence: Math.min(0.85, 0.3 + Math.random() * 0.3),
      signalStrength: signals?.aggregate?.signalStrength ?? 0,
      reason: 'Demo fallback: low-confidence mean reversion',
    }
  }

  const pool = state.pools
    .filter((p) => Number.isFinite(p.priceChange.h1))
    .sort((a, b) => Math.abs(b.priceChange.h1) - Math.abs(a.priceChange.h1))[0]
  if (!pool) return legacyMeanReversion(state)

  const priceChangeH1 = pool.priceChange.h1
  let direction = 0
  if (priceChangeH1 < -1) direction = 1
  if (priceChangeH1 > 1) direction = -1
  if (!direction) {
    if (!DEMO_MODE) return legacyMeanReversion(state)
    return demoFallback(pool, priceChangeH1 >= 0 ? 1 : -1, Math.abs(priceChangeH1) / 100)
  }
  log('strategy', `Using DexScreener temporal data h1=${priceChangeH1}`)

  const volatility = Math.abs(priceChangeH1) / 100
  const amountIn = computeAmountIn(volatility, config)
  const edgeRate = Math.abs(priceChangeH1) / 100
  const expectedProfit = computeExpectedProfit(edgeRate, amountIn, gasCost, config.slippageTolerance)
  if (!Number.isFinite(expectedProfit) || expectedProfit <= 0) {
    if (!DEMO_MODE) return legacyMeanReversion(state)
    return demoFallback(pool, direction || 1, edgeRate)
  }

  return {
    tokenIn: direction > 0 ? pool.token0.address : pool.token1.address,
    tokenOut: direction > 0 ? pool.token1.address : pool.token0.address,
    amountIn,
    expectedProfit,
    gasCost,
    slippage: config.slippageTolerance,
    strategy: 'meanReversion',
    confidence: 0.65,
    signalStrength: signals?.aggregate?.signalStrength ?? 0,
    reason: 'H1 deviation suggests reversion',
  }
}

export default meanReversionStrategy
