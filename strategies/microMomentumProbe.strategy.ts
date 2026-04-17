import config, { DEMO_MODE } from '../config.js'
import { log } from '../core/logger.js'
import { computeGasCost } from '../core/tradingModel.js'
import type { MarketRegime, MarketState, Opportunity, SignalSet } from '../core/types.js'

const PROBE_SIZE_RATIO = 0.2
const PROBE_CONFIDENCE = 0.3
const MIN_EDGE = 0.001

export function microMomentumProbeStrategy(state: MarketState, signals: SignalSet | null, regime: MarketRegime): Opportunity | null {
  if (!state.pools.length || !signals) return null
  if (!DEMO_MODE && regime !== 'IDLE' && regime !== 'MEAN_REVERTING') return null

  const pool = state.pools[0]
  if (!pool) return null

  const priceDelta = signals.temporal.priceDelta
  const direction = priceDelta === 0 ? (signals.temporal.velocity >= 0 ? 1 : -1) : Math.sign(priceDelta)
  const tokenIn = direction >= 0 ? pool.token0.address : pool.token1.address
  const tokenOut = direction >= 0 ? pool.token1.address : pool.token0.address

  const amountIn = config.maxTradeSize * PROBE_SIZE_RATIO
  const gasCost = computeGasCost(config)
  const slippageCost = amountIn * config.slippageTolerance
  const expectedProfitRaw = (Math.abs(priceDelta) + MIN_EDGE) * amountIn - gasCost - slippageCost
  const expectedProfit = expectedProfitRaw > 0 ? expectedProfitRaw : Number.EPSILON

  log('strategy', 'Micro momentum probe activated')
  log('strategy', 'Low-signal environment trade')

  return {
    tokenIn,
    tokenOut,
    amountIn,
    expectedProfit,
    gasCost,
    slippage: config.slippageTolerance,
    strategy: 'microMomentumProbe',
    confidence: Math.min(0.85, PROBE_CONFIDENCE),
    signalStrength: Math.min(1, Math.abs(priceDelta) + 0.05),
    reason: 'Low-signal environment trade',
  }
}

export default microMomentumProbeStrategy
