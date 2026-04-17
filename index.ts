console.log('ENTRY FILE EXECUTED')

import { startServer } from './server.js'
import { runPipeline } from './core/pipeline.js'
import marketAgent from './agents/market.agent.js'
import strategyAgent from './agents/strategy.agent.js'
import arbitrageStrategy from './strategies/arbitrage.strategy.js'
import meanReversionStrategy from './strategies/meanReversion.strategy.js'
import liquidityImbalanceStrategy from './strategies/liquidityImbalance.strategy.js'
import momentumStrategy from './strategies/momentum.strategy.js'
import microMomentumProbeStrategy from './strategies/microMomentumProbe.strategy.js'
import adaptiveParticipationStrategy from './strategies/adaptiveParticipation.strategy.js'
import riskAgent from './agents/risk.agent.js'
import executionAgent from './agents/execution.agent.js'

const pipeline = {
  market: marketAgent,
  strategy: (state: Parameters<typeof strategyAgent>[0], signals: any, regime: Parameters<typeof strategyAgent>[3]) =>
    strategyAgent(state, [arbitrageStrategy, meanReversionStrategy, liquidityImbalanceStrategy, momentumStrategy, microMomentumProbeStrategy, adaptiveParticipationStrategy], signals, regime),
  risk: riskAgent,
  execute: executionAgent,
}

async function main() {
  console.log('🔥 Starting backend...')
  startServer()

  while (true) {
    try {
      await runPipeline(pipeline)
    } catch (err) {
      console.error('Cycle failed:', err)
    }

    await new Promise((r) => setTimeout(r, 2000))
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
})
