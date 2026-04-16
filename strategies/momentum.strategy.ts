import config from '../config.js'
import { computeAmountIn, computeExpectedProfit, computeGasCost } from '../core/tradingModel.js'
import type { MarketState, Opportunity, SignalSet } from '../core/types.js'

const MOMENTUM_MIN = 0.3
const VOLUME_SPIKE_MIN = 1.5
const ORDER_IMBALANCE_MIN = 0.2

export function momentumStrategy(state: MarketState, signals: SignalSet | null): Opportunity | null {
  if (!state.pools.length || !signals) return null

  const poolRow = signals.perPool
    .slice()
    .sort((a, b) => b.signal.signalStrength - a.signal.signalStrength)
    .find((x) => x.signal.momentum > MOMENTUM_MIN && x.signal.volumeSpike > VOLUME_SPIKE_MIN && x.signal.orderImbalance > ORDER_IMBALANCE_MIN)

  if (!poolRow) return null
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
    confidence: Math.min(1, 0.55 + poolRow.signal.signalStrength * 0.45),
    signalStrength: poolRow.signal.signalStrength,
    reason: 'Momentum breakout: momentum+volume+imbalance',
  }
}

export default momentumStrategy
