import type { RegimeAssessment, SignalSet } from './types.js'

const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v))

export function detectRegime(signals: SignalSet | null): RegimeAssessment {
  if (!signals) return { regime: 'UNKNOWN', confidence: 0, reason: 'No signals' }
  if (signals.poolCount < 2 && signals.historyLength < 3) {
    return {
      regime: 'INSUFFICIENT_DATA',
      confidence: 1,
      reason: `Need >=2 pools or >=3 history points (pools=${signals.poolCount}, history=${signals.historyLength})`,
    }
  }

  const s = signals.aggregate
  const momentum = Math.abs(s.momentum)
  const volSpike = s.volumeSpike
  const pressure = Math.abs(s.orderImbalance)
  const vol = Math.max(momentum, Math.abs(signals.temporal.volatility))

  if (momentum < 0.08 && volSpike < 0.6) {
    return {
      regime: 'IDLE',
      confidence: clamp((0.6 - volSpike) * 0.7 + (0.08 - momentum) * 3),
      reason: 'Low momentum and low participation',
    }
  }

  if (vol > 0.8 && volSpike > 1.2) {
    return {
      regime: 'TRENDING',
      confidence: clamp((vol / 1.5) * 0.5 + (volSpike / 2) * 0.3 + pressure * 0.2),
      reason: 'High momentum with strong volume spike',
    }
  }

  if (vol > 0.8 && volSpike < 0.9) {
    return {
      regime: 'CHAOTIC',
      confidence: clamp((vol / 1.5) * 0.7 + ((0.9 - volSpike) / 0.9) * 0.3),
      reason: 'High movement without participation support',
    }
  }

  if (vol < 0.35 && volSpike <= 1.1) {
    return {
      regime: 'MEAN_REVERTING',
      confidence: clamp(((0.35 - vol) / 0.35) * 0.6 + ((1.1 - volSpike) / 1.1) * 0.2 + (1 - pressure) * 0.2),
      reason: 'Calm tape and limited directional pressure',
    }
  }

  if (vol > 1.2) {
    return {
      regime: 'VOLATILE',
      confidence: clamp(vol / 2),
      reason: 'Elevated movement',
    }
  }

  return {
    regime: 'UNKNOWN',
    confidence: 0.25,
    reason: 'Mixed signals',
  }
}
