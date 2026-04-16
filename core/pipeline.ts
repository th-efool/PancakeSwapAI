import { getPerformance, logPerformance, recordTrade } from '../agents/portfolio.agent';
import { exportState } from './exportState';
import { pushMarketState } from './history';
import { latestState } from './state';
import type { MarketState, Opportunity, TradeResult } from './types';

export type Pipeline = {
  market: () => Promise<MarketState>;
  strategy: (state: MarketState) => Opportunity | null;
  risk: (opportunity: Opportunity) => boolean;
  execute: (opportunity: Opportunity) => Promise<TradeResult>;
};

export async function runPipeline(pipeline: Pipeline): Promise<void> {
  try {
    console.log('Pipeline start');
    console.log(`Timestamp: ${new Date().toISOString()}`);

    console.log('Step 1: market');
    const state = await pipeline.market();
    pushMarketState(state);
    if (!state || !state.pools.length) {
      console.log('No market data');
      return;
    }
    console.log('Market data loaded');

    console.log('Step 2: strategy');
    const opportunity: Opportunity | null = pipeline.strategy(state);
    if (!opportunity) {
      console.log('No opportunity');
      return;
    }
    console.log('Opportunity found');
    latestState.opportunity = opportunity;

    console.log('Step 3: risk');
    if (!pipeline.risk(opportunity)) {
      console.log('Risk rejected');
      return;
    }

    console.log('Step 4: execute');
    const result: TradeResult = await pipeline.execute(opportunity);
    recordTrade(result, opportunity);
    latestState.performance = getPerformance();
    logPerformance();
    exportState();

    if (!result.success) {
      console.log(`Trade failed${result.error ? `: ${result.error}` : ''}`);
      return;
    }

    console.log(
      `Trade success${typeof result.actualProfit === 'number' ? ` | profit: ${result.actualProfit}` : ''}${
        result.txHash ? ` | tx: ${result.txHash}` : ''
      }`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Pipeline error: ${message}`);
  }
}
