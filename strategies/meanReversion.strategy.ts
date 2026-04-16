import type { MarketState, Opportunity, Pool } from '../core/types';
import config, { estimateGasCost } from '../config';

type PairGroup = Record<string, Pool[]>;

function pairKey(pool: Pool): string {
  const a = pool.token0.address.toLowerCase();
  const b = pool.token1.address.toLowerCase();
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

function groupByPair(pools: Pool[]): PairGroup {
  const out: PairGroup = {};
  for (const pool of pools) {
    const key = pairKey(pool);
    if (!out[key]) out[key] = [];
    out[key].push(pool);
  }
  return out;
}

export function meanReversionStrategy(state: MarketState): Opportunity | null {
  if (state.pools.length < 2) return null;

  const groups = groupByPair(state.pools);
  const amountIn = config.maxTradeSize;
  const gasCost = estimateGasCost();

  let best: Opportunity | null = null;

  for (const pools of Object.values(groups)) {
    if (pools.length < 2) continue;

    const avg = pools.reduce((sum, pool) => sum + pool.price, 0) / pools.length;
    if (avg <= 0) continue;

    let low = pools[0];
    let high = pools[0];
    for (const pool of pools) {
      if (pool.price < low.price) low = pool;
      if (pool.price > high.price) high = pool;
    }

    const spread = (high.price - low.price) / avg;
    if (spread < 0.01) continue;

    const buyAmount = amountIn;
    const sellAmount = amountIn * (avg / low.price);
    const grossProfit = sellAmount - buyAmount;
    const slippageCost = config.slippageTolerance * amountIn;
    const expectedProfit = grossProfit - gasCost - slippageCost;
    if (expectedProfit <= 0) continue;

    const opp: Opportunity = {
      buyPool: low,
      sellPool: high,
      tokenIn: low.token0,
      tokenOut: low.token1,
      amountIn,
      expectedProfit,
      gasCost,
      slippage: config.slippageTolerance,
      strategy: 'meanReversion',
      confidence: 0.6,
    };

    if (!best || opp.expectedProfit > best.expectedProfit) best = opp;
  }

  return best;
}

export default meanReversionStrategy;
