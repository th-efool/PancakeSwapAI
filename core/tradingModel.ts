import type { Config } from './types.js'

type TradingConfig = Pick<Config, 'gasLimit' | 'slippageTolerance' | 'maxTradeSize' | 'tradeScaleK' | 'minTradeSize' | 'volatilityEpsilon'>

export function computeAmountIn(volatility: number, config: TradingConfig): number {
  const v = Math.max(0, volatility)
  const eps = Math.max(1e-12, config.volatilityEpsilon)
  const size = config.tradeScaleK / (v + eps)
  return Math.max(config.minTradeSize, Math.min(config.maxTradeSize, size))
}

export function computeGasCost(config: Pick<Config, 'gasLimit'>): number {
  return config.gasLimit * 1e-9
}

export function computeExpectedProfit(
  edgeRate: number,
  amountIn: number,
  gasCost: number,
  slippageRate: number,
): number {
  const gross = amountIn * edgeRate
  const slip = amountIn * slippageRate
  return gross - gasCost - slip
}
