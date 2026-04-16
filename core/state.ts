import type { DataSourceType } from './market-data/data-source.interface'
import type { MarketRegime, Opportunity, Performance } from './types'

export let latestState: {
  opportunity: Opportunity | null
  performance: Performance | null
  temporalSignals: any | null
  regime: MarketRegime
  marketData: {
    configuredSource: DataSourceType
    usedSource: DataSourceType | null
  }
} = {
  opportunity: null,
  performance: null,
  temporalSignals: null,
  regime: 'UNKNOWN',
  marketData: {
    configuredSource: 'ON_CHAIN',
    usedSource: null,
  },
}
