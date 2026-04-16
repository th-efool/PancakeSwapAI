import type { MarketSignal, MarketState, Pool, SignalSet } from './types.js'
import config from '../config.js'
import { createRng, gaussianNoise } from './random.js'

const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v))
const NOISE_SIGMA_MAX = 0.25

const scaledSigma = (baseSigma: number, volatility: number) => {
  const sigma = Math.max(0, baseSigma || 0)
  const vol = Math.max(0, volatility || 0)
  const volFactor = clamp(vol / (1 + vol), 0, 1)
  return clamp(sigma * volFactor, 0, NOISE_SIGMA_MAX)
}

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

function computeTemporalSignals(history: MarketState[], current: MarketState) {
  const byAddress = new Map<string, number[]>()

  for (const snap of history) {
    for (const pool of snap.pools) {
      if (!Number.isFinite(pool.price) || pool.price <= 0) continue
      const arr = byAddress.get(pool.address) ?? []
      arr.push(pool.price)
      byAddress.set(pool.address, arr)
    }
  }

  for (const pool of current.pools) {
    if (!Number.isFinite(pool.price) || pool.price <= 0) continue
    const arr = byAddress.get(pool.address) ?? []
    arr.push(pool.price)
    byAddress.set(pool.address, arr)
  }

  const deltas: number[] = []
  for (const prices of byAddress.values()) {
    if (prices.length < 2) continue
    for (let i = 1; i < prices.length; i += 1) {
      deltas.push(prices[i] - prices[i - 1])
    }
  }

  if (!deltas.length) {
    return { priceDelta: 0, velocity: 0, volatility: 0, length: history.length + 1 }
  }

  const priceDelta = deltas[deltas.length - 1]
  const velocity = deltas.reduce((a, b) => a + b, 0) / deltas.length
  const variance = deltas.reduce((a, b) => a + (b - velocity) ** 2, 0) / deltas.length
  const volatility = Math.sqrt(variance)
  const rng = createRng(config.noiseSeed !== undefined ? `${config.noiseSeed}:${current.timestamp}` : undefined)
  const sigmaPrice = config.noiseEnabled ? scaledSigma(config.noiseSigmaPrice, volatility) : 0
  const sigmaVelocity = config.noiseEnabled ? scaledSigma(config.noiseSigmaVelocity, volatility) : 0
  const noisyPriceDelta = priceDelta + gaussianNoise(rng) * sigmaPrice
  const noisyVelocity = velocity + gaussianNoise(rng) * sigmaVelocity

  return {
    priceDelta: Number.isFinite(noisyPriceDelta) ? noisyPriceDelta : 0,
    velocity: Number.isFinite(noisyVelocity) ? noisyVelocity : 0,
    volatility: Number.isFinite(volatility) ? volatility : 0,
    length: history.length + 1,
  }
}

export function extractSignals(state: MarketState, history: MarketState[]): SignalSet | null {
  if (!state.pools.length) return null

  const temporal = computeTemporalSignals(history, state)
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

  const hasCrossPool = perPool.length >= 2
  const hasTemporal = temporal.length >= 3
  const source: SignalSet['source'] = hasCrossPool && hasTemporal ? 'hybrid' : hasCrossPool ? 'cross_pool' : hasTemporal ? 'temporal' : 'none'

  const temporalMomentum = clamp(Math.abs(temporal.velocity), 0, 3)
  const temporalVolatility = clamp(temporal.volatility, 0, 3)
  const temporalStrength = clamp(temporalMomentum * 0.6 + temporalVolatility * 0.4, 0, 1)
  aggregate.momentum = aggregate.momentum * 0.7 + temporal.velocity * 0.3
  aggregate.higherTFMomentum = aggregate.higherTFMomentum * 0.7 + temporal.priceDelta * 0.3
  aggregate.signalStrength = clamp(aggregate.signalStrength * 0.7 + temporalStrength * 0.3)

  return {
    perPool,
    aggregate,
    temporal: {
      priceDelta: temporal.priceDelta,
      velocity: temporal.velocity,
      volatility: temporal.volatility,
    },
    source,
    poolCount: state.pools.length,
    historyLength: temporal.length,
  }
}
