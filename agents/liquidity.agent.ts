import { log } from '../core/logger.js'
import type { MarketState, Pool } from '../core/types.js'

export type PoolInsight = {
  poolAddress: string
  liquidityScore: number
  imbalanceScore: number
  feePotential: number
  riskTier: 'low' | 'medium' | 'high'
}

const THRESHOLD_HIGH = 1000
const THRESHOLD_MID = 100

function liquidityScore(pool: Pool): number {
  return pool.liquidity * (Math.abs(pool.price) + 1)
}

function riskTier(score: number): PoolInsight['riskTier'] {
  if (score > THRESHOLD_HIGH) return 'low'
  if (score > THRESHOLD_MID) return 'medium'
  return 'high'
}

export function liquidityAgent(state: MarketState): PoolInsight[] {
  log('liquidity', 'Analyzing liquidity pools')

  return state.pools.map((pool) => {
    const lScore = liquidityScore(pool)
    const iScore = Math.abs(pool.price - 1)
    const insight: PoolInsight = {
      poolAddress: pool.address,
      liquidityScore: lScore,
      imbalanceScore: iScore,
      feePotential: iScore * lScore,
      riskTier: riskTier(lScore),
    }

    log('liquidity', `Pool analyzed ${insight.poolAddress} (${insight.riskTier})`)
    return insight
  })
}

export default liquidityAgent
