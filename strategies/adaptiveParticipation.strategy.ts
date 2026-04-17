import config from '../config.js'
import { log } from '../core/logger.js'
import { computeGasCost } from '../core/tradingModel.js'
import type { MarketRegime, MarketState, Opportunity, SignalSet } from '../core/types.js'

const SIZE_RATIO = 0.15
const CONFIDENCE = 0.25
const MIN_PROFIT = 1e-7
const MAX_PROFIT = 0.0002
const BIAS = 0.0002

export function adaptiveParticipationStrategy(state: MarketState, signals: SignalSet | null, _regime: MarketRegime): Opportunity | null {
  if (!state.pools.length) return null

  const pool = state.pools[0]
  if (!pool) return null

  const momentum = signals?.aggregate.momentum ?? 0
  const velocity = signals?.temporal.velocity ?? 0
  const dir = momentum === 0 ? (velocity === 0 ? 1 : Math.sign(velocity)) : Math.sign(momentum)
  const edge = Math.min(Math.max(Math.abs(momentum) / 10000 + BIAS, MIN_PROFIT), MAX_PROFIT)
  const amountIn = config.maxTradeSize * SIZE_RATIO
  const gasCost = computeGasCost(config)
  const expectedProfit = Math.max(MIN_PROFIT, edge * amountIn)

  log('strategy', 'Fallback participation triggered')
  log('strategy', 'Low-signal adaptive trade')

  return {
    tokenIn: dir >= 0 ? pool.token0.address : pool.token1.address,
    tokenOut: dir >= 0 ? pool.token1.address : pool.token0.address,
    amountIn,
    expectedProfit,
    gasCost,
    slippage: config.slippageTolerance,
    strategy: 'adaptiveParticipation',
    confidence: CONFIDENCE,
    signalStrength: Math.min(1, Math.abs(momentum) / 100),
    reason: 'Low-signal adaptive trade',
  }
}

export default adaptiveParticipationStrategy
