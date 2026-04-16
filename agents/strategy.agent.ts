import type { MarketState, Opportunity } from '../core/types';

export type StrategyFn = (state: MarketState) => Opportunity | null;

export function strategyAgent(
  state: MarketState,
  strategyImpl: StrategyFn,
): Opportunity | null {
  if (!state.pools.length) {
    console.log('Strategy skipped: empty market state');
    return null;
  }

  const opportunity = strategyImpl(state);
  if (!opportunity) {
    console.log('Strategy result: no opportunity');
    return null;
  }

  console.log('Strategy result: opportunity found');
  return opportunity;
}

export default strategyAgent;
