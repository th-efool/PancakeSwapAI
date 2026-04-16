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

function legacyMeanReversion(state: MarketState): Opportunity | null {
  if (state.pools.length < 2) return null;

  const groups = groupByPair(state.pools);
  const amountIn = config.maxTradeSize;
  const gasCost = estimateGasCost();

  let best: Opportunity | null = null;

  for (const pools of Object.values(groups)) {
    if (pools.length < 2) continue;

    const avg = pools.reduce((sum, pool) => sum + pool.price, 0) / pools.length;
    if (!Number.isFinite(avg) || avg <= 0) continue;

    let low = pools[0];
    let high = pools[0];
    for (const pool of pools) {
      if (pool.price < low.price) low = pool;
      if (pool.price > high.price) high = pool;
    }

    const spread = (high.price - low.price) / avg;
    if (!Number.isFinite(spread) || spread < 0.01) continue;

    const buyAmount = amountIn;
    const sellAmount = amountIn * (avg / low.price);
    const grossProfit = sellAmount - buyAmount;
    const slippageCost = config.slippageTolerance * amountIn;
    const expectedProfit = grossProfit - gasCost - slippageCost;
    if (!Number.isFinite(expectedProfit) || expectedProfit <= 0) continue;

    const opp: Opportunity = {
      tokenIn: low.token0.address,
      tokenOut: low.token1.address,
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

export function meanReversionStrategy(
  state: MarketState,
  previous: MarketState | null,
): Opportunity | null {
  if (!previous) return legacyMeanReversion(state);

  const amountIn = config.maxTradeSize;
  const gasCost = estimateGasCost();
  const changeThreshold = 0.01;
  const prevByAddress = new Map(previous.pools.map((p) => [p.address.toLowerCase(), p]));

  let best: Opportunity | null = null;

  for (const pool of state.pools) {
    const prevPool = prevByAddress.get(pool.address.toLowerCase());
    if (!prevPool) continue;
    if (!Number.isFinite(pool.price) || !Number.isFinite(prevPool.price) || prevPool.price <= 0) continue;

    const priceChange = pool.price - prevPool.price;
    const relativeChange = priceChange / prevPool.price;
    if (!Number.isFinite(relativeChange)) continue;

    console.log('Temporal signal detected:', priceChange);

    if (Math.abs(relativeChange) < changeThreshold) continue;

    const direction = relativeChange < 0 ? 1 : -1;
    const grossProfit = amountIn * Math.abs(relativeChange);
    const slippageCost = config.slippageTolerance * amountIn;
    const expectedProfit = grossProfit - gasCost - slippageCost;
    if (!Number.isFinite(expectedProfit) || expectedProfit <= 0) continue;

    const opp: Opportunity = {
      tokenIn: direction > 0 ? pool.token0.address : pool.token1.address,
      tokenOut: direction > 0 ? pool.token1.address : pool.token0.address,
      amountIn,
      expectedProfit,
      gasCost,
      slippage: config.slippageTolerance,
      strategy: 'meanReversion',
      confidence: 0.65,
    };

    if (!best || opp.expectedProfit > best.expectedProfit) best = opp;
  }

  return best ?? legacyMeanReversion(state);
}

export default meanReversionStrategy;
