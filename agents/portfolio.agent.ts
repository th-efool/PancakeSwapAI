import { updateStrategyStats } from '../core/memory/strategyMemory.js'
import { log } from '../core/logger.js'
import type { Opportunity, TradeResult } from '../core/types.js'

type StrategyStat = { trades: number; profit: number }

type PortfolioState = {
  totalTrades: number
  totalOpportunitiesSeen: number
  totalTradesExecuted: number
  totalRejected: number
  rejectedOpportunities: number
  successfulTrades: number
  totalProfit: number
  totalGasSpent: number
  profitHistory: number[]
  strategyStats: Record<string, StrategyStat>
  strategyUsage: Record<string, number>
}

let portfolio: PortfolioState = {
  totalTrades: 0,
  totalOpportunitiesSeen: 0,
  totalTradesExecuted: 0,
  totalRejected: 0,
  rejectedOpportunities: 0,
  successfulTrades: 0,
  totalProfit: 0,
  totalGasSpent: 0,
  profitHistory: [],
  strategyStats: {},
  strategyUsage: {},
}

const safe = (v: number) => (Number.isFinite(v) ? v : 0)

export function recordTrade(result: TradeResult, opportunity: Opportunity): void {
  portfolio.totalTrades += 1
  portfolio.totalTradesExecuted += 1
  if (result.success) portfolio.successfulTrades += 1

  const profit = safe(result.actualProfit ?? 0)
  const gasCost = safe(opportunity.gasCost)
  const netProfit = safe(opportunity.expectedProfit)

  portfolio.totalProfit += profit
  portfolio.totalGasSpent += gasCost
  portfolio.profitHistory.push(netProfit)

  const strategy = opportunity.strategy
  if (!portfolio.strategyStats[strategy]) {
    portfolio.strategyStats[strategy] = { trades: 0, profit: 0 }
  }

  portfolio.strategyStats[strategy].trades += 1
  portfolio.strategyStats[strategy].profit += profit
  portfolio.strategyUsage[strategy] = (portfolio.strategyUsage[strategy] ?? 0) + 1

  updateStrategyStats(strategy, profit)
}

export function recordOpportunitySeen(): void {
  portfolio.totalOpportunitiesSeen += 1
}

export function recordRejectedOpportunity(): void {
  portfolio.totalRejected += 1
  portfolio.rejectedOpportunities += 1
}

export function getPerformance() {
  const {
    totalTrades,
    totalTradesExecuted,
    totalOpportunitiesSeen,
    totalRejected,
    rejectedOpportunities,
    successfulTrades,
    totalProfit,
    totalGasSpent,
    profitHistory,
    strategyStats,
    strategyUsage,
  } = portfolio
  const winRate = totalTradesExecuted ? successfulTrades / totalTradesExecuted : 0
  const avgProfitPerTrade = totalTradesExecuted ? totalProfit / totalTradesExecuted : 0
  const conversionRate = totalOpportunitiesSeen ? totalTradesExecuted / totalOpportunitiesSeen : 0
  const selectivity = conversionRate
  const netProfit = totalProfit
  const gasEfficiency = totalGasSpent ? totalProfit / totalGasSpent : 0

  const avgProfit = profitHistory.length ? profitHistory.reduce((sum, p) => sum + p, 0) / profitHistory.length : 0
  const variance = profitHistory.length
    ? profitHistory.reduce((sum, p) => sum + (p - avgProfit) ** 2, 0) / profitHistory.length
    : 0
  const stdDev = Math.sqrt(variance)
  const sharpe = avgProfit / (stdDev + 1e-6)

  return {
    totalTrades,
    totalTradesExecuted,
    successfulTrades,
    winRate,
    totalProfit,
    totalGasSpent,
    netProfit,
    totalOpportunitiesSeen,
    totalRejected,
    rejectedOpportunities,
    conversionRate,
    selectivity,
    gasEfficiency,
    avgProfitPerTrade,
    avgProfit,
    stdDev,
    sharpe,
    strategyBreakdown: strategyStats,
    strategyUsage,
  }
}

export function logPerformance(): void {
  const perf = getPerformance()
  log('portfolio', `Total trades: ${perf.totalTrades}`)
  log('portfolio', `Win rate: ${perf.winRate.toFixed(4)}`)
  log('portfolio', `Total profit: ${perf.totalProfit.toFixed(6)}`)
  log('portfolio', `Net profit: ${perf.netProfit.toFixed(6)}`)
}
