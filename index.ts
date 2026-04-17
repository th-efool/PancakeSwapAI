import { startServer } from './server'
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
import path from 'path'

function logBootstrap() {
  const buildEntryPath = path.resolve(process.cwd(), 'dist/index.js')
  console.log('ENTRY EXECUTED')
  console.log('BOOTSTRAP CONTRACT:', {
    node: process.version,
    cwd: process.cwd(),
    port: process.env.PORT ?? 'undefined',
    buildEntryPath,
    startedAt: new Date().toISOString(),
  })
}

process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason)
  process.exit(1)
})

const pipeline = {
  market: marketAgent,
  strategy: (state: Parameters<typeof strategyAgent>[0], signals: any, regime: Parameters<typeof strategyAgent>[3]) =>
    strategyAgent(state, [arbitrageStrategy, meanReversionStrategy, liquidityImbalanceStrategy, momentumStrategy, microMomentumProbeStrategy, adaptiveParticipationStrategy], signals, regime),
  risk: riskAgent,
  execute: executionAgent,
}

async function main() {
  logBootstrap()
  console.log('Starting backend...')

  startServer()

  while (true) {
    try {
      await runPipeline(pipeline)
    } catch (err) {
      console.error('Pipeline error:', err)
    }

    await new Promise((r) => setTimeout(r, 2000))
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
