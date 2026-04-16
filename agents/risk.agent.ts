import { log } from '../core/logger.js'
import type { Opportunity } from '../core/types.js'
import config from '../config.js'

type Decision = { approved: boolean; reason: string }

let lastDecision: Decision = { approved: false, reason: 'Not evaluated' }

function checkProfitability(opp: Opportunity): boolean {
  return opp.expectedProfit >= opp.gasCost * 2
}

function checkTradeSize(opp: Opportunity): boolean {
  return opp.amountIn <= config.maxTradeSize
}

function checkSlippage(opp: Opportunity): boolean {
  return opp.slippage <= config.slippageTolerance
}

export function getLastRiskDecision(): Decision {
  return lastDecision
}

export function riskAgent(opp: Opportunity): boolean {
  if (!checkProfitability(opp)) {
    lastDecision = { approved: false, reason: 'Profitability check failed' }
    log('risk', 'Risk rejected: profitability')
    return false
  }

  if (!checkTradeSize(opp)) {
    lastDecision = { approved: false, reason: 'Trade size too large' }
    log('risk', 'Risk rejected: trade size')
    return false
  }

  if (!checkSlippage(opp)) {
    lastDecision = { approved: false, reason: 'Slippage above tolerance' }
    log('risk', 'Risk rejected: slippage')
    return false
  }

  lastDecision = { approved: true, reason: 'All checks passed' }
  log('risk', 'Risk approved')
  return true
}

export default riskAgent
