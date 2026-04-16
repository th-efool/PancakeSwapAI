import type { Pool } from '../types'
import type { RawPool } from './data-source.interface'

export function normalizePools(rawPools: RawPool[]): Pool[] {
  const pools: Pool[] = []

  for (const raw of rawPools) {
    let price = 0
    let liquidity = 0

    if (raw.source === 'ON_CHAIN') {
      if (raw.reserve0 <= 0) continue
      price = raw.reserve1 / raw.reserve0
      liquidity = raw.reserve0 + raw.reserve1
    } else if (raw.source === 'DEXSCREENER') {
      price = raw.priceUsd
      liquidity = raw.liquidityUsd
    } else {
      if (raw.token0Price <= 0) continue
      price = raw.token1Price / raw.token0Price
      liquidity = raw.totalValueLockedUSD
    }

    if (!Number.isFinite(price) || !Number.isFinite(liquidity) || price <= 0 || liquidity <= 0) continue

    pools.push({
      address: raw.address,
      token0: raw.token0,
      token1: raw.token1,
      price,
      liquidity,
    })
  }

  return pools
}
