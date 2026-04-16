import config, { syncMarketDataConfigFromDisk } from '../config'
import { runWithFallback } from '../core/market-data/fallback'
import { log } from '../core/logger'
import { latestState } from '../core/state'
import type { MarketState } from '../core/types'

export async function marketAgent(): Promise<MarketState> {
  try {
    syncMarketDataConfigFromDisk()

    const result = await runWithFallback({
      selectedSource: config.dataSource,
      fallbackOrder: config.marketData.fallbackOrder,
      timeoutMs: config.marketData.timeoutMs,
      minPools: config.marketData.minPools,
    })

    latestState.marketData = {
      configuredSource: config.dataSource,
      usedSource: result.usedSource,
    }

    for (const f of result.failures) {
      log('market', `Source failed: source=${f.source} reason=${f.error}`)
    }

    log(
      'market',
      `Pool summary: selected=${config.dataSource} used=${result.usedSource ?? 'NONE'} attempted=${result.attemptedSources.join(',')} valid=${result.pools.length}`,
    )

    return {
      pools: result.pools,
      timestamp: Date.now(),
    }
  } catch (e) {
    console.error('Market fetch failed, fallback to empty pool list', e)
    latestState.marketData = {
      configuredSource: config.dataSource,
      usedSource: null,
    }
    return {
      pools: [],
      timestamp: Date.now(),
    }
  }
}

export default marketAgent
