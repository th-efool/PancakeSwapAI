export type StrategyKey = string

export type StrategyStats = {
  totalTrades: number
  wins: number
  losses: number
  totalProfit: number
  avgProfit: number
  last5Profits: number[]
}

const strategyMemory: Record<StrategyKey, StrategyStats> = {}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

const sanitize = (v: number) => (Number.isFinite(v) ? v : 0)

const zeroStats = (): StrategyStats => ({
  totalTrades: 0,
  wins: 0,
  losses: 0,
  totalProfit: 0,
  avgProfit: 0,
  last5Profits: [],
})

export function getStrategyStats(strategy: StrategyKey): StrategyStats {
  if (!strategyMemory[strategy]) strategyMemory[strategy] = zeroStats()
  return strategyMemory[strategy]
}

export function updateStrategyStats(strategy: StrategyKey, profit: number): void {
  const stats = getStrategyStats(strategy)
  const p = sanitize(profit)

  stats.totalTrades += 1
  if (p > 0) stats.wins += 1
  else stats.losses += 1

  stats.totalProfit += p
  stats.avgProfit = stats.totalProfit / Math.max(stats.totalTrades, 1)

  stats.last5Profits.push(p)
  if (stats.last5Profits.length > 5) stats.last5Profits.shift()
}

export function computePerformanceScore(strategy: StrategyKey): number {
  const stats = getStrategyStats(strategy)
  const winRate = stats.wins / Math.max(stats.totalTrades, 1)
  const recentMomentum =
    stats.last5Profits.length > 0
      ? stats.last5Profits.reduce((sum, p) => sum + sanitize(p), 0) / stats.last5Profits.length
      : 0
  const avgProfitNormalized = clamp(sanitize(stats.avgProfit) / 0.01, -1, 1)

  const raw = winRate * 0.5 + avgProfitNormalized * 0.3 + recentMomentum * 0.2
  return clamp(sanitize(raw), -1, 1)
}
