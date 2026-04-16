import type { MarketSignal, MarketState, Pool, SignalSet } from './types'

const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v))

function poolSignal(pool: Pool, totalLiquidity: number): MarketSignal {
  const m = pool.priceChange.m5
  const h1 = pool.priceChange.h1
  const base = pool.volume.h1 / 12
  const volumeSpike = base > 0 ? pool.volume.m5 / base : 0
  const buys = pool.txns.m5.buys
  const sells = pool.txns.m5.sells
  const total = buys + sells
  const orderImbalance = total > 0 ? (buys - sells) / total : 0
  const liquidityWeight = totalLiquidity > 0 ? pool.liquidity / totalLiquidity : 0

  const momentumScore = clamp(Math.abs(m) / 2)
  const volumeScore = clamp(volumeSpike / 2)
  const imbalanceScore = clamp(Math.abs(orderImbalance))
  const signalStrength = clamp(momentumScore * 0.4 + volumeScore * 0.35 + imbalanceScore * 0.25)

  return {
    momentum: m,
    higherTFMomentum: h1,
    volumeSpike,
    orderImbalance,
    liquidityWeight,
    signalStrength,
  }
}

export function extractSignals(state: MarketState): SignalSet | null {
  if (!state.pools.length) return null

  const totalLiquidity = state.pools.reduce((a, p) => a + p.liquidity, 0)
  const perPool = state.pools.map((p) => ({
    poolAddress: p.address,
    signal: poolSignal(p, totalLiquidity),
  }))

  const aggregate = perPool.reduce<MarketSignal>(
    (acc, row) => {
      const w = row.signal.liquidityWeight || 0
      acc.momentum += row.signal.momentum * w
      acc.higherTFMomentum += row.signal.higherTFMomentum * w
      acc.volumeSpike += row.signal.volumeSpike * w
      acc.orderImbalance += row.signal.orderImbalance * w
      acc.signalStrength += row.signal.signalStrength * w
      acc.liquidityWeight += w
      return acc
    },
    {
      momentum: 0,
      higherTFMomentum: 0,
      volumeSpike: 0,
      orderImbalance: 0,
      liquidityWeight: 0,
      signalStrength: 0,
    },
  )

  if (aggregate.liquidityWeight <= 0) {
    const n = perPool.length || 1
    aggregate.momentum = perPool.reduce((a, x) => a + x.signal.momentum, 0) / n
    aggregate.higherTFMomentum = perPool.reduce((a, x) => a + x.signal.higherTFMomentum, 0) / n
    aggregate.volumeSpike = perPool.reduce((a, x) => a + x.signal.volumeSpike, 0) / n
    aggregate.orderImbalance = perPool.reduce((a, x) => a + x.signal.orderImbalance, 0) / n
    aggregate.signalStrength = perPool.reduce((a, x) => a + x.signal.signalStrength, 0) / n
  }

  return { perPool, aggregate }
}
