import type { MarketState } from './types'

const MAX_HISTORY = 10

let history: MarketState[] = []

export function pushState(state: MarketState) {
  history.push(state)
  if (history.length > MAX_HISTORY) history.shift()
}

export function getHistory() {
  return history
}

export function computeSignals() {
  if (history.length < 2) return null

  const current = history[history.length - 1]
  const prev = history[history.length - 2]

  const currentPriceRaw = current.pools[0]?.price ?? 0
  const prevPriceRaw = prev.pools[0]?.price ?? 0
  const currentPrice = Number.isFinite(currentPriceRaw) ? currentPriceRaw : 0
  const prevPrice = Number.isFinite(prevPriceRaw) ? prevPriceRaw : 0

  const priceDelta = currentPrice - prevPrice
  const priceVelocity = priceDelta

  const prices = history.map((h) => {
    const v = h.pools[0]?.price ?? 0
    return Number.isFinite(v) ? v : 0
  })
  const avg = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0
  const variance = prices.length ? prices.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / prices.length : 0
  const volatility = Math.sqrt(variance)

  return {
    priceDelta: Number.isFinite(priceDelta) ? priceDelta : 0,
    priceVelocity: Number.isFinite(priceVelocity) ? priceVelocity : 0,
    volatility: Number.isFinite(volatility) ? volatility : 0,
  }
}
