import type { DataSourceType } from './market-data/data-source.interface.js'
import type { MarketRegime, Opportunity, Performance, SignalSet } from './types.js'

export let latestState: {
  opportunity: Opportunity | null
  performance: Performance | null
  temporalSignals: SignalSet | null
  regime: MarketRegime
  regimeConfidence: number
  regimeReason: string
  marketData: {
    configuredSource: DataSourceType
    usedSource: DataSourceType | null
  }
  runtime: {
    executionDroughtCount: number
    executionDroughtThreshold: number
    lastExecutionReason: 'standard' | 'bootstrap' | null
  }
} = {
  opportunity: null,
  performance: null,
  temporalSignals: null,
  regime: 'UNKNOWN',
  regimeConfidence: 0,
  regimeReason: 'No regime detected',
  marketData: {
    configuredSource: 'ON_CHAIN',
    usedSource: null,
  },
  runtime: {
    executionDroughtCount: 0,
    executionDroughtThreshold: 3,
    lastExecutionReason: null,
  },
}
