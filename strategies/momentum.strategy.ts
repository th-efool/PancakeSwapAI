import config, { DEMO_MODE } from '../config.js'
import { computeAmountIn, computeExpectedProfit, computeGasCost } from '../core/tradingModel.js'
import type { MarketState, Opportunity, SignalSet } from '../core/types.js'

const MOMENTUM_MIN = 0.3
const VOLUME_SPIKE_MIN = 1.5
const ORDER_IMBALANCE_MIN = 0.2

export function momentumStrategy(state: MarketState, signals: SignalSet | null): Opportunity | null {
  if (!state.pools.length || !signals) return null
  const sorted = signals.perPool.slice().sort((a, b) => b.signal.signalStrength - a.signal.signalStrength)
  const top = sorted[0]
  const edge = top
    ? Math.min(top.signal.momentum / 100, 0.04) * Math.min(top.signal.volumeSpike, 3) * Math.max(top.signal.orderImbalance, 0)
    : 0

  const poolRow = sorted
    .find((x) => x.signal.momentum > MOMENTUM_MIN && x.signal.volumeSpike > VOLUME_SPIKE_MIN && x.signal.orderImbalance > ORDER_IMBALANCE_MIN)

  if (!poolRow) {
    if (!DEMO_MODE || !top) return null
    const pool = state.pools.find((p) => p.address === top.poolAddress)
    if (!pool) return null
    const gasCost = computeGasCost(config)
    const amountIn = computeAmountIn(Math.abs(pool.priceChange.m5) / 100 || 0.001, config)
    return {
      tokenIn: pool.token0.address,
      tokenOut: pool.token1.address,
      amountIn,
      expectedProfit: Math.abs(edge) * amountIn * 0.5,
      gasCost,
      slippage: config.slippageTolerance,
      strategy: 'momentum',
      confidence: Math.min(0.85, 0.3 + Math.random() * 0.3),
      signalStrength: top.signal.signalStrength,
      reason: 'Demo fallback: low-confidence momentum',
    }
  }
  const pool = state.pools.find((p) => p.address === poolRow.poolAddress)
  if (!pool) return null

  const gasCost = computeGasCost(config)
  const volatility = Math.abs(pool.priceChange.m5) / 100
  const amountIn = computeAmountIn(volatility, config)
  const edgeRate = (poolRow.signal.momentum / 100) * Math.min(poolRow.signal.volumeSpike, 3)
  const expectedProfit = computeExpectedProfit(Math.min(edgeRate, 0.04), amountIn, gasCost, config.slippageTolerance)
  if (!Number.isFinite(expectedProfit) || expectedProfit <= 0) return null

  return {
    tokenIn: pool.token0.address,
    tokenOut: pool.token1.address,
    amountIn,
    expectedProfit,
    gasCost,
    slippage: config.slippageTolerance,
    strategy: 'momentum',
    confidence: Math.min(0.85, 0.55 + poolRow.signal.signalStrength * 0.45),
    signalStrength: poolRow.signal.signalStrength,
    reason: 'Momentum breakout: momentum+volume+imbalance',
  }
}

export default momentumStrategy
