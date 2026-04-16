import type { Opportunity, TradeResult } from '../core/types';

type StrategyStat = { trades: number; profit: number };

type PortfolioState = {
  totalTrades: number;
  successfulTrades: number;
  totalProfit: number;
  totalGasSpent: number;
  profitHistory: number[];
  strategyStats: Record<string, StrategyStat>;
};

let portfolio: PortfolioState = {
  totalTrades: 0,
  successfulTrades: 0,
  totalProfit: 0,
  totalGasSpent: 0,
  profitHistory: [],
  strategyStats: {},
};

export function recordTrade(result: TradeResult, opportunity: Opportunity): void {
  portfolio.totalTrades += 1;
  if (result.success) portfolio.successfulTrades += 1;

  const profit = result.actualProfit ?? opportunity.expectedProfit;
  const gasCost = opportunity.gasCost;
  const netProfit = opportunity.expectedProfit;

  portfolio.totalProfit += profit;
  portfolio.totalGasSpent += gasCost;
  portfolio.profitHistory.push(netProfit);

  const strategy = opportunity.strategy;
  if (!portfolio.strategyStats[strategy]) {
    portfolio.strategyStats[strategy] = { trades: 0, profit: 0 };
  }

  portfolio.strategyStats[strategy].trades += 1;
  portfolio.strategyStats[strategy].profit += profit;
}

export function getPerformance() {
  const { totalTrades, successfulTrades, totalProfit, totalGasSpent, profitHistory, strategyStats } = portfolio;
  const winRate = totalTrades ? successfulTrades / totalTrades : 0;
  const avgProfitPerTrade = totalTrades ? totalProfit / totalTrades : 0;
  const netProfit = totalProfit;
  const gasEfficiency = totalGasSpent ? totalProfit / totalGasSpent : 0;

  const avgProfit = profitHistory.length
    ? profitHistory.reduce((sum, p) => sum + p, 0) / profitHistory.length
    : 0;
  const variance = profitHistory.length
    ? profitHistory.reduce((sum, p) => sum + (p - avgProfit) ** 2, 0) / profitHistory.length
    : 0;
  const stdDev = Math.sqrt(variance);
  const sharpe = avgProfit / (stdDev + 1e-6);

  return {
    totalTrades,
    successfulTrades,
    winRate,
    totalProfit,
    totalGasSpent,
    netProfit,
    gasEfficiency,
    avgProfitPerTrade,
    avgProfit,
    stdDev,
    sharpe,
    strategyBreakdown: strategyStats,
  };
}

export function logPerformance(): void {
  const perf = getPerformance();

  console.log('=== PERFORMANCE ===');
  console.log(`Total trades: ${perf.totalTrades}`);
  console.log(`Win rate: ${perf.winRate}`);
  console.log(`Total profit: ${perf.totalProfit}`);
  console.log(`Total gas spent: ${perf.totalGasSpent}`);
  console.log(`Net profit: ${perf.netProfit}`);
  console.log(`Gas efficiency: ${perf.gasEfficiency}`);
  console.log(`Sharpe ratio: ${perf.sharpe}`);

  for (const [name, stats] of Object.entries(perf.strategyBreakdown)) {
    console.log(`Strategy: ${name}`);
    console.log(`Trades: ${stats.trades}`);
    console.log(`Profit: ${stats.profit}`);
  }
}
