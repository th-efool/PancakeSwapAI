import type { Pool } from '../types'
import type { RawPool } from './data-source.interface'

export type NormalizerRejectionReason = 'missing price' | 'NaN' | 'zero liquidity'

export type NormalizerDebugSummary = {
  normalizedCount: number
  rejectedCount: number
  rejectionReasons: Record<NormalizerRejectionReason, number>
}

function createSummary(): NormalizerDebugSummary {
  return {
    normalizedCount: 0,
    rejectedCount: 0,
    rejectionReasons: {
      'missing price': 0,
      NaN: 0,
      'zero liquidity': 0,
    },
  }
}

export function normalizePoolsDetailed(rawPools: RawPool[]): { pools: Pool[]; debug: NormalizerDebugSummary } {
  const pools: Pool[] = []
  const debug = createSummary()

  for (const raw of rawPools) {
    let price: number | undefined
    let liquidity: number | undefined
    let priceChangeM5 = 0
    let volumeM5 = 0
    let buysM5 = 0
    let sellsM5 = 0
    let priceChangeH1 = 0

    if (raw.source === 'ON_CHAIN') {
      price = raw.reserve0 > 0 ? raw.reserve1 / raw.reserve0 : undefined
      liquidity = raw.reserve0 + raw.reserve1
    } else if (raw.source === 'DEXSCREENER') {
      price = raw.priceUsd
      liquidity = raw.liquidityUsd
      priceChangeM5 = raw.priceChangeM5
      volumeM5 = raw.volumeM5
      buysM5 = raw.buysM5
      sellsM5 = raw.sellsM5
      priceChangeH1 = raw.priceChangeH1
    } else {
      price = raw.token0Price > 0 ? raw.token1Price / raw.token0Price : undefined
      liquidity = raw.totalValueLockedUSD
    }

    console.log('[NORMALIZER] mapped pool', {
      source: raw.source,
      token0: raw.token0.symbol,
      token1: raw.token1.symbol,
      price,
      liquidity,
    })

    if (price === undefined || price === null || price <= 0) {
      debug.rejectedCount += 1
      debug.rejectionReasons['missing price'] += 1
      console.error('[NORMALIZER] rejected pool: missing price', {
        source: raw.source,
        address: raw.address,
        token0: raw.token0.symbol,
        token1: raw.token1.symbol,
        price,
      })
    } else if (!Number.isFinite(price) || !Number.isFinite(liquidity ?? Number.NaN)) {
      debug.rejectedCount += 1
      debug.rejectionReasons.NaN += 1
      console.error('[NORMALIZER] rejected pool: NaN', {
        source: raw.source,
        address: raw.address,
        token0: raw.token0.symbol,
        token1: raw.token1.symbol,
        price,
        liquidity,
      })
    } else if ((liquidity ?? 0) <= 0) {
      debug.rejectedCount += 1
      debug.rejectionReasons['zero liquidity'] += 1
      console.error('[NORMALIZER] rejected pool: zero liquidity', {
        source: raw.source,
        address: raw.address,
        token0: raw.token0.symbol,
        token1: raw.token1.symbol,
        price,
        liquidity,
      })
    }

    const normalizedPrice = typeof price === 'number' && Number.isFinite(price) ? price : 0
    const normalizedLiquidity = typeof liquidity === 'number' && Number.isFinite(liquidity) ? liquidity : 0

    pools.push({
      address: raw.address,
      token0: raw.token0,
      token1: raw.token1,
      price: normalizedPrice,
      liquidity: normalizedLiquidity,
      priceChangeM5,
      volumeM5,
      buysM5,
      sellsM5,
      priceChangeH1,
    })
  }

  debug.normalizedCount = pools.length
  return { pools, debug }
}

export function normalizePools(rawPools: RawPool[]): Pool[] {
  return normalizePoolsDetailed(rawPools).pools
}
