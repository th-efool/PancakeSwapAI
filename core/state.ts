import type { MarketRegime, Opportunity, Performance } from './types'

export let latestState: {
  opportunity: Opportunity | null
  performance: Performance | null
  temporalSignals: any | null
  regime: MarketRegime
} = {
  opportunity: null,
  performance: null,
  temporalSignals: null,
  regime: 'UNKNOWN',
}
