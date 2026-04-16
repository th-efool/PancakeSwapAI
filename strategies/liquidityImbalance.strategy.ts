import type { MarketState, Opportunity, Pool } from '../core/types';
import config, { estimateGasCost } from '../config';

const THRESHOLD = 0.02;

function imbalance(pool: Pool): number {
  return Math.abs(pool.price - 1);
}

function buildOpportunity(pool: Pool): Opportunity | null {
  const amountIn = config.maxTradeSize;
  const im = imbalance(pool);
  if (im <= THRESHOLD) return null;

  const buyAmount = amountIn;
  const sellAmount = amountIn * (1 + im);
  const grossProfit = sellAmount - buyAmount;
  const gasCost = estimateGasCost();
  const slippageCost = config.slippageTolerance * amountIn;
  const expectedProfit = grossProfit - gasCost - slippageCost;
  if (expectedProfit <= 0) return null;

  const isSell = pool.price > 1;

  console.log('Imbalance detected');
  return {
    buyPool: pool,
    sellPool: pool,
    tokenIn: isSell ? pool.token0 : pool.token1,
    tokenOut: isSell ? pool.token1 : pool.token0,
    amountIn,
    expectedProfit,
    gasCost,
    slippage: config.slippageTolerance,
    strategy: 'liquidityImbalance',
    confidence: 0.75,
  };
}

export function liquidityImbalanceStrategy(state: MarketState): Opportunity | null {
  console.log('Running liquidity imbalance strategy');
  if (!state.pools.length) return null;

  let best: Opportunity | null = null;
  for (const pool of state.pools) {
    const opp = buildOpportunity(pool);
    if (!opp) continue;
    if (!best || opp.expectedProfit > best.expectedProfit) best = opp;
  }

  if (!best) return null;

  console.log('Liquidity imbalance opportunity found');
  return best;
}

export default liquidityImbalanceStrategy;
