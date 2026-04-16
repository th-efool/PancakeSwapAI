export type MarketRegime = 'TRENDING' | 'MEAN_REVERTING' | 'VOLATILE' | 'UNKNOWN'

export function detectRegime(signals: any): MarketRegime {
  if (!signals) return 'UNKNOWN'

  const priceDelta = typeof signals.priceDelta === 'number' && Number.isFinite(signals.priceDelta) ? signals.priceDelta : 0
  const volatility = typeof signals.volatility === 'number' && Number.isFinite(signals.volatility) ? signals.volatility : 0

  if (Math.abs(priceDelta) > 0.01 && volatility < 0.02) return 'TRENDING'
  if (Math.abs(priceDelta) < 0.005 && volatility < 0.01) return 'MEAN_REVERTING'
  if (volatility > 0.03) return 'VOLATILE'
  return 'UNKNOWN'
}
