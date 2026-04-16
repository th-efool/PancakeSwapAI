import type { MarketState, Opportunity, Pool } from '../core/types';
import config from '../config';

const GAS_PRICE_GWEI = 3;
const GWEI_TO_BNB = 1e-9;

type PairGroup = Record<string, Pool[]>;

function pairKey(pool: Pool): string {
  const a = pool.token0.address.toLowerCase();
  const b = pool.token1.address.toLowerCase();
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

function groupByPair(pools: Pool[]): PairGroup {
  const groups: PairGroup = {};
  for (const pool of pools) {
    const key = pairKey(pool);
    if (!groups[key]) groups[key] = [];
    groups[key].push(pool);
  }
  return groups;
}

export function arbitrageStrategy(state: MarketState): Opportunity | null {
  if (state.pools.length < 2) return null;

  console.log('Grouping pools by token pair');
  const groups = groupByPair(state.pools);
  const gasCost = config.gasLimit * GAS_PRICE_GWEI * GWEI_TO_BNB;
  const slippageCost = config.slippageTolerance * config.maxTradeSize;

  let best: Opportunity | null = null;

  for (const pools of Object.values(groups)) {
    if (pools.length < 2) continue;

    let low = pools[0];
    let high = pools[0];

    for (const pool of pools) {
      if (pool.price < low.price) low = pool;
      if (pool.price > high.price) high = pool;
    }

    const spread = high.price - low.price;
    const expectedProfit = spread - gasCost - slippageCost;
    if (expectedProfit <= 0) continue;

    const opportunity: Opportunity = {
      buyPool: low,
      sellPool: high,
      expectedProfit,
      gasCost,
      slippage: slippageCost,
    };

    if (!best || opportunity.expectedProfit > best.expectedProfit) best = opportunity;
  }

  if (!best) {
    console.log('No opportunity exists');
    return null;
  }

  console.log('Profitable opportunity found');
  return best;
}

export default arbitrageStrategy;
