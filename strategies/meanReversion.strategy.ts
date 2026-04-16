import { log } from '../core/logger.js'
import type { MarketState, Opportunity, Pool } from '../core/types.js'
import config, { estimateGasCost } from '../config.js'

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
  const amountIn = config.maxTradeSize
  const gasCost = estimateGasCost()

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

    const buyAmount = amountIn
    const sellAmount = amountIn * (avg / low.price)
    const grossProfit = sellAmount - buyAmount
    const slippageCost = config.slippageTolerance * amountIn
    const expectedProfit = grossProfit - gasCost - slippageCost
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
  const amountIn = config.maxTradeSize
  const gasCost = estimateGasCost()
  const slippageCost = config.slippageTolerance * amountIn

  const pool = state.pools
    .filter((p) => Number.isFinite(p.priceChange.h1))
    .sort((a, b) => Math.abs(b.priceChange.h1) - Math.abs(a.priceChange.h1))[0]
  if (!pool) return legacyMeanReversion(state)

  const priceChangeH1 = pool.priceChange.h1
  let direction = 0
  if (priceChangeH1 < -1) direction = 1
  if (priceChangeH1 > 1) direction = -1
  if (!direction) return legacyMeanReversion(state)
  log('strategy', `Using DexScreener temporal data h1=${priceChangeH1}`)

  const grossProfit = amountIn * (Math.abs(priceChangeH1) / 100)
  const expectedProfit = grossProfit - gasCost - slippageCost
  if (!Number.isFinite(expectedProfit) || expectedProfit <= 0) return legacyMeanReversion(state)

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
