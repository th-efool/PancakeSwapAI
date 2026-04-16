import type { MarketState, Opportunity, Pool } from '../core/types';
import config, { estimateGasCost } from '../config';

const THRESHOLD = 0.001;
const lastPrices: Record<string, number> = {};

function getPoolId(pool: Pool): string {
  return pool.address;
}

function buildOpportunity(pool: Pool, imbalance: number): Opportunity | null {
  const amountIn = config.maxTradeSize;
  if (imbalance < THRESHOLD) return null;

  const gasCost = estimateGasCost();
  const slippageCost = config.slippageTolerance * amountIn;
  const expectedProfit = Math.min(imbalance * amountIn * 10, amountIn * 0.03) - gasCost - slippageCost;
  if (expectedProfit <= 0) return null;

  const previousPrice = lastPrices[getPoolId(pool)] ?? pool.price;
  const isSell = pool.price > previousPrice;

  console.log('Imbalance detected');
  console.log('Temporal imbalance:', imbalance);
  return {
    tokenIn: isSell ? pool.token0.address : pool.token1.address,
    tokenOut: isSell ? pool.token1.address : pool.token0.address,
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
    const poolId = getPoolId(pool);
    const lastPrice = lastPrices[poolId];

    if (typeof lastPrice !== 'number' || lastPrice <= 0) {
      lastPrices[poolId] = pool.price;
      continue;
    }

    const imbalance = Math.abs(pool.price - lastPrice) / lastPrice;
    const opp = buildOpportunity(pool, imbalance);
    lastPrices[poolId] = pool.price;
    if (!opp) continue;
    if (!best || opp.expectedProfit > best.expectedProfit) best = opp;
  }

  if (!best) return null;

  console.log('Liquidity imbalance opportunity found');
  return best;
}

export default liquidityImbalanceStrategy;
