import { runPipeline } from './core/pipeline';
import marketAgent from './agents/market.agent';
import strategyAgent from './agents/strategy.agent';
import arbitrageStrategy from './strategies/arbitrage.strategy';
import riskAgent from './agents/risk.agent';
import executionAgent from './agents/execution.agent';
import config from './config';

const pipeline = {
  market: marketAgent,
  strategy: (state: Parameters<typeof strategyAgent>[0]) => strategyAgent(state, arbitrageStrategy),
  risk: riskAgent,
  execute: executionAgent,
};

async function main() {
  console.log('Starting trading bot...');

  while (true) {
    await runPipeline(pipeline);
    await new Promise((resolve) => setTimeout(resolve, config.pollIntervalMs));
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
});
