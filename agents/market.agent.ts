import config, { syncMarketDataConfigFromDisk } from '../config.js'
import { runWithFallback } from '../core/market-data/fallback.js'
import { log } from '../core/logger.js'
import { latestState } from '../core/state.js'
import type { MarketState } from '../core/types.js'

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

    console.log('DEBUG SUMMARY:')
    for (const summary of result.debugSummary) {
      console.log(`- ${summary.source}: raw=${summary.rawFetchedCount} normalized=${summary.normalizedCount} rejected=${summary.rejectedCount}`, summary.rejectionReasons)
      log(
        'market',
        `DEBUG SUMMARY: source=${summary.source} raw=${summary.rawFetchedCount} normalized=${summary.normalizedCount} rejected=${summary.rejectedCount} reasons=${JSON.stringify(summary.rejectionReasons)}`,
      )
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
