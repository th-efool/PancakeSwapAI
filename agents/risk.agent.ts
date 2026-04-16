import { log } from '../core/logger.js'
import type { Opportunity } from '../core/types.js'
import config from '../config.js'

type Decision = { approved: boolean; reason: string }

let lastDecision: Decision = { approved: false, reason: 'Not evaluated' }

const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v))

function riskBuffer(volatility: number, confidence: number): number {
  const vol = clamp(volatility)
  const conf = clamp(confidence)
  return clamp(0.1 + vol * 0.5 + (1 - conf) * 0.3, 0.05, 0.85)
}

function checkProfitability(opp: Opportunity): boolean {
  const buffer = riskBuffer(opp.volatility ?? 0, opp.confidence)
  const threshold = opp.gasCost * (1 + buffer)
  if (opp.expectedProfit >= threshold) return true
  return opp.confidence > 0.8 && opp.expectedProfit > opp.gasCost
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
