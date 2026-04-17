export const MARKET_REGIMES = ['TRENDING', 'MEAN_REVERTING', 'VOLATILE', 'CHAOTIC', 'IDLE', 'INSUFFICIENT_DATA', 'UNKNOWN'] as const
export type MarketRegime = (typeof MARKET_REGIMES)[number]

export const DATA_SOURCES = ['ON_CHAIN', 'DEXSCREENER', 'SUBGRAPH'] as const
export type DataSource = (typeof DATA_SOURCES)[number]

export function isMarketRegime(value: unknown): value is MarketRegime {
  return typeof value === 'string' && (MARKET_REGIMES as readonly string[]).includes(value)
}

export function normalizeMarketRegime(value: unknown): MarketRegime {
  return isMarketRegime(value) ? value : 'UNKNOWN'
}

export function isDataSource(value: unknown): value is DataSource {
  return typeof value === 'string' && (DATA_SOURCES as readonly string[]).includes(value)
}
