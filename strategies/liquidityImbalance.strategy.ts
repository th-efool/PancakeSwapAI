import type { MarketState, Opportunity, Pool } from '../core/types';
import config, { estimateGasCost } from '../config';

const THRESHOLD = 0.001;
const VOLUME_THRESHOLD = 1000;

function buildOpportunity(pool: Pool, imbalance: number): Opportunity | null {
  const amountIn = config.maxTradeSize;
  if (imbalance < THRESHOLD || pool.volume.m5 <= VOLUME_THRESHOLD) return null;

  const gasCost = estimateGasCost();
  const slippageCost = config.slippageTolerance * amountIn;
  const expectedProfit = Math.min(imbalance * amountIn * 10, amountIn * 0.03) - gasCost - slippageCost;
  if (expectedProfit <= 0) return null;

  const isSell = pool.priceChange.m5 > 0;

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

export function liquidityImbalanceStrategy(state: MarketState, signals?: any): Opportunity | null {
  console.log('Running liquidity imbalance strategy');
  if (!state.pools.length) return null;
  console.log('Using DexScreener temporal data');

  let best: Opportunity | null = null;
  for (const pool of state.pools) {
    const imbalance = Math.abs(pool.priceChange.m5) / 100;
    const opp = buildOpportunity(pool, imbalance);
    if (!opp) continue;
    if (!best || opp.expectedProfit > best.expectedProfit) best = opp;
  }

  if (!best) return null;

  console.log('Liquidity imbalance opportunity found');
  return {
    ...best,
    signalStrength: signals?.aggregate?.signalStrength ?? 0,
    reason: 'Short-term liquidity/flow imbalance',
  };
}

export default liquidityImbalanceStrategy;
