import type { Opportunity } from '../core/types';
import config from '../config';

function checkProfitability(opp: Opportunity): boolean {
  return opp.expectedProfit > opp.gasCost * 1.5;
}

function checkTradeSize(): boolean {
  return config.maxTradeSize <= 0.1;
}

function checkSlippage(opp: Opportunity): boolean {
  return opp.slippage <= config.slippageTolerance;
}

export function riskAgent(opp: Opportunity): boolean {
  if (!checkProfitability(opp)) {
    console.log('Risk failed: profitability');
    return false;
  }

  if (!checkTradeSize()) {
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
