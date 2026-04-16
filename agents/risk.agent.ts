import type { Opportunity } from '../core/types';
import config from '../config';

function checkProfitability(opp: Opportunity): boolean {
  return opp.expectedProfit >= opp.gasCost * 2;
}

function checkTradeSize(opp: Opportunity): boolean {
  return opp.amountIn <= config.maxTradeSize;
}

function checkSlippage(opp: Opportunity): boolean {
  return opp.slippage <= config.slippageTolerance;
}

export function riskAgent(opp: Opportunity): boolean {
  if (!checkProfitability(opp)) {
    console.log('Risk failed: profitability');
    return false;
  }

  if (!checkTradeSize(opp)) {
    console.log('Risk failed: trade size');
    return false;
  }

  if (!checkSlippage(opp)) {
    console.log('Risk failed: slippage');
    return false;
  }

  console.log('Risk approved');
  return true;
}

export default riskAgent;
