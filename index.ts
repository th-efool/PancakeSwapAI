import { runPipeline } from './core/pipeline.js'
import marketAgent from './agents/market.agent.js'
import strategyAgent from './agents/strategy.agent.js'
import arbitrageStrategy from './strategies/arbitrage.strategy.js'
import meanReversionStrategy from './strategies/meanReversion.strategy.js'
import liquidityImbalanceStrategy from './strategies/liquidityImbalance.strategy.js'
import momentumStrategy from './strategies/momentum.strategy.js'
import riskAgent from './agents/risk.agent.js'
import executionAgent from './agents/execution.agent.js'

const pipeline = {
  market: marketAgent,
  strategy: (state: Parameters<typeof strategyAgent>[0], signals: any, regime: Parameters<typeof strategyAgent>[3]) =>
    strategyAgent(state, [arbitrageStrategy, meanReversionStrategy, liquidityImbalanceStrategy, momentumStrategy], signals, regime),
  risk: riskAgent,
  execute: executionAgent,
}

async function startLoop() {
  const INTERVAL_MS = 3000

  while (true) {
    console.log('\n=== NEW CYCLE ===')

    const start = Date.now()

    try {
      await runPipeline(pipeline)
    } catch (err) {
      console.error('Cycle failed:', err)
    }

    const elapsed = Date.now() - start
    const waitTime = INTERVAL_MS - elapsed

    console.log(`Cycle duration: ${elapsed}ms`)

    if (waitTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitTime))
    }
  }
}

startLoop().catch(console.error)
