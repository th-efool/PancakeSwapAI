import type { Opportunity, TradeResult } from '../core/types';
import config from '../config';

const DRY_RUN = true;

type SwapPrep = {
  routerType: 'smart' | 'universal';
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  amountOutQuote: number;
  amountOutMin: number;
};

function selectRouter(): 'smart' | 'universal' {
  return config.routerType === 'universal' ? 'universal' : 'smart';
}

function quoteAmountOut(opp: Opportunity): number {
  return opp.amountIn + Math.max(opp.expectedProfit + opp.gasCost, 0);
}

function minAmountOut(amountOutQuote: number): number {
  return amountOutQuote * (1 - config.slippageTolerance);
}

function buildSwapPrep(opp: Opportunity): SwapPrep {
  const amountOutQuote = quoteAmountOut(opp);
  return {
    routerType: selectRouter(),
    tokenIn: opp.tokenIn,
    tokenOut: opp.tokenOut,
    amountIn: opp.amountIn,
    amountOutQuote,
    amountOutMin: minAmountOut(amountOutQuote),
  };
}

async function estimateGas(): Promise<bigint> {
  return BigInt(config.gasLimit);
}

function validateOpportunity(opp: Opportunity): string | null {
  const isAddress = (value: string) => /^0x[a-fA-F0-9]{40}$/.test(value);
  if (!opp.tokenIn || !opp.tokenOut) return 'Missing tokens';
  if (!isAddress(opp.tokenIn) || !isAddress(opp.tokenOut)) {
    return 'Invalid token address';
  }
  if (opp.amountIn <= 0) return 'Invalid amountIn';
  return null;
}

export async function executionAgent(opp: Opportunity): Promise<TradeResult> {
  const validationError = validateOpportunity(opp);
  if (validationError) return { success: false, error: validationError };

  const prep = buildSwapPrep(opp);
  const gasEstimate = await estimateGas();

  console.log(`tokenIn: ${prep.tokenIn}`);
  console.log(`tokenOut: ${prep.tokenOut}`);
  console.log(`amountIn: ${prep.amountIn}`);
  console.log(`amountOutQuote: ${prep.amountOutQuote}`);
  console.log(`amountOutMin: ${prep.amountOutMin}`);
  console.log(`router type: ${prep.routerType}`);
  console.log(`gas estimate: ${gasEstimate.toString()}`);
  console.log(`strategy: ${opp.strategy}`);
  console.log(`confidence: ${opp.confidence}`);
  if (typeof opp.score === 'number') console.log(`score: ${opp.score}`);
  console.log('Prepared swap via router');

  if (DRY_RUN) {
    console.log('Execution mode: DRY_RUN');
    return {
      success: true,
      txHash: 'dry-run',
      actualProfit: opp.expectedProfit,
    };
  }

  return { success: false, error: 'Live execution disabled' };
}

export default executionAgent;
