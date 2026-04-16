import { getPreviousState } from '../core/history';
import type { MarketState, Opportunity } from '../core/types';

export type StrategyFn = (current: MarketState, previous: MarketState | null) => Opportunity | null;
export type StrategyInput = StrategyFn | StrategyFn[];

type OpportunityScorer = (opportunity: Opportunity) => number;

const scoreOpportunity: OpportunityScorer = (opp) => opp.expectedProfit * opp.confidence;

export function strategyAgent(
  state: MarketState,
  strategyImpl: StrategyInput,
): Opportunity | null {
  if (!state.pools.length) {
    console.log('Strategy skipped: empty market state');
    return null;
  }

  const strategies = Array.isArray(strategyImpl) ? strategyImpl : [strategyImpl];
  const prevState = getPreviousState();
  console.log(`Running ${strategies.length} strategies`);

  const opportunities = strategies
    .map((strategy) => strategy(state, prevState))
    .filter((opportunity): opportunity is Opportunity => opportunity !== null);

  console.log(`Found ${opportunities.length} opportunities`);
  if (!opportunities.length) return null;

  let best = opportunities[0];
  let bestScore = scoreOpportunity(best);

  for (const opp of opportunities) {
    const score = scoreOpportunity(opp);
    console.log(
      `strategy=${opp.strategy} expectedProfit=${opp.expectedProfit} confidence=${opp.confidence} score=${score}`,
    );
    if (score > bestScore) {
      best = opp;
      bestScore = score;
    }
  }

  console.log('Best opportunity selected');
  return { ...best, score: bestScore };
}

export default strategyAgent;
