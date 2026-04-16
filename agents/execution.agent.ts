import { log } from '../core/logger.js'
import type { Opportunity, TradeResult } from '../core/types.js'
import config from '../config.js'

const DRY_RUN = true

type SwapPrep = {
  routerType: 'smart' | 'universal'
  tokenIn: string
  tokenOut: string
  amountIn: number
  amountOutQuote: number
  amountOutMin: number
}

type ExecutionSnapshot = {
  tokenIn: string | null
  tokenOut: string | null
  amountIn: number | null
  amountOutQuote: number | null
  amountOutMin: number | null
  gasEstimate: string | null
  mode: 'DRY_RUN' | 'LIVE'
  executionReason: 'standard' | 'bootstrap'
}

let lastExecution: ExecutionSnapshot = {
  tokenIn: null,
  tokenOut: null,
  amountIn: null,
  amountOutQuote: null,
  amountOutMin: null,
  gasEstimate: null,
  mode: DRY_RUN ? 'DRY_RUN' : 'LIVE',
  executionReason: 'standard',
}

function selectRouter(): 'smart' | 'universal' {
  return config.routerType === 'universal' ? 'universal' : 'smart'
}

function quoteAmountOut(opp: Opportunity): number {
  return opp.amountIn + Math.max(opp.expectedProfit + opp.gasCost, 0)
}

function minAmountOut(amountOutQuote: number): number {
  return amountOutQuote * (1 - config.slippageTolerance)
}

function buildSwapPrep(opp: Opportunity): SwapPrep {
  const amountOutQuote = quoteAmountOut(opp)
  return {
    routerType: selectRouter(),
    tokenIn: opp.tokenIn,
    tokenOut: opp.tokenOut,
    amountIn: opp.amountIn,
    amountOutQuote,
    amountOutMin: minAmountOut(amountOutQuote),
  }
}

async function estimateGas(): Promise<bigint> {
  return BigInt(config.gasLimit)
}

function validateOpportunity(opp: Opportunity): string | null {
  const isAddress = (value: string) => /^0x[a-fA-F0-9]{40}$/.test(value)
  if (!opp.tokenIn || !opp.tokenOut) return 'Missing tokens'
  if (!isAddress(opp.tokenIn) || !isAddress(opp.tokenOut)) return 'Invalid token address'
  if (opp.amountIn <= 0) return 'Invalid amountIn'
  return null
}

export function getLastExecution() {
  return lastExecution
}

export async function executionAgent(opp: Opportunity): Promise<TradeResult> {
  const validationError = validateOpportunity(opp)
  if (validationError) return { success: false, error: validationError }

  const prep = buildSwapPrep(opp)
  const gasEstimate = await estimateGas()

  lastExecution = {
    tokenIn: prep.tokenIn,
    tokenOut: prep.tokenOut,
    amountIn: prep.amountIn,
    amountOutQuote: prep.amountOutQuote,
    amountOutMin: prep.amountOutMin,
    gasEstimate: gasEstimate.toString(),
    mode: DRY_RUN ? 'DRY_RUN' : 'LIVE',
    executionReason: opp.executionReason ?? 'standard',
  }

  log('execution', `Prepared swap via ${prep.routerType} router executionReason=${lastExecution.executionReason}`)

  if (DRY_RUN) {
    log('execution', 'Execution mode: DRY_RUN')
    return {
      success: true,
      txHash: 'dry-run',
      actualProfit: opp.expectedProfit,
    }
  }

  return { success: false, error: 'Live execution disabled' }
}

export default executionAgent
