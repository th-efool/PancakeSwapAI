import { runPipeline } from './core/pipeline';
import marketAgent from './agents/market.agent';
import strategyAgent from './agents/strategy.agent';
import arbitrageStrategy from './strategies/arbitrage.strategy';
import meanReversionStrategy from './strategies/meanReversion.strategy';
import liquidityImbalanceStrategy from './strategies/liquidityImbalance.strategy';
import riskAgent from './agents/risk.agent';
import executionAgent from './agents/execution.agent';

const pipeline = {
  market: marketAgent,
  strategy: (state: Parameters<typeof strategyAgent>[0]) =>
    strategyAgent(state, [
      arbitrageStrategy,
      meanReversionStrategy,
      liquidityImbalanceStrategy,
    ]),
  risk: riskAgent,
  execute: executionAgent,
};

async function startLoop() {
  const INTERVAL_MS = 3000;

  while (true) {
    console.log('\n=== NEW CYCLE ===');

    const start = Date.now();

    try {
      await runPipeline(pipeline);
    } catch (err) {
      console.error('Cycle failed:', err);
    }

    const elapsed = Date.now() - start;
    const waitTime = INTERVAL_MS - elapsed;

    console.log(`Cycle duration: ${elapsed}ms`);

    if (waitTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
}

startLoop().catch(console.error);
