import { useMemo } from 'react'
import Card from './Card'
import type { LiveState } from '../app/hooks/useLiveState'

type Props = {
  simulation?: LiveState['simulation']
  blink?: boolean
}

const nf = (v?: number, d = 2) => (typeof v === 'number' ? v.toFixed(d) : '--')

export default function SimulationCard({ simulation, blink }: Props) {
  const worstTone = typeof simulation?.worstProfit !== 'number' ? 'text-slate-200' : simulation.worstProfit >= 0 ? 'text-emerald-300' : 'text-rose-300'
  const riskTone = !simulation ? 'text-slate-200' : simulation.riskScore < 0.33 ? 'text-emerald-300' : simulation.riskScore < 0.66 ? 'text-amber-300' : 'text-rose-300'
  const riskText = !simulation ? '--' : simulation.riskScore < 0.33 ? 'Low' : simulation.riskScore < 0.66 ? 'Medium' : 'High'

  const bars = useMemo(() => {
    const base = simulation?.avgProfit ?? 0
    const down = simulation?.worstProfit ?? 0
    const up = simulation?.bestProfit ?? 0
    const slippage = -Math.abs(base) * 0.35
    const gas = -Math.abs(base) * 0.15
    const raw = [base, down, up, slippage, gas]
    const max = Math.max(...raw.map((v) => Math.abs(v)), 0.001)
    return raw.map((v, i) => ({
      label: ['Base', 'Down', 'Up', 'Slippage', 'Gas'][i],
      v,
      h: `${Math.max(12, Math.round((Math.abs(v) / max) * 72))}px`,
      tone: v >= 0 ? 'bg-emerald-400/70' : 'bg-rose-400/70',
    }))
  }, [simulation])

  return (
    <Card title="Pre-Trade Simulation" className={`transition-all duration-300 ${blink ? 'scale-[1.01]' : ''}`}>
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between"><span className="text-slate-400">Best Case Profit</span><span className="font-semibold text-emerald-300">{nf(simulation?.bestProfit, 4)} BNB</span></div>
        <div className="flex items-center justify-between"><span className="text-slate-400">Worst Case Profit</span><span className={`font-semibold ${worstTone}`}>{nf(simulation?.worstProfit, 4)} BNB</span></div>
        <div className="flex items-center justify-between"><span className="text-slate-400">Average Profit</span><span className="font-semibold text-slate-100">{nf(simulation?.avgProfit, 4)} BNB</span></div>
        <div className="flex items-center justify-between"><span className="text-slate-400">Risk Score</span><span className={`font-semibold ${riskTone}`}>{riskText} {nf(simulation?.riskScore, 3)}</span></div>
        <div className="flex items-center justify-between"><span className="text-slate-400">Adjusted Confidence</span><span className="font-semibold text-cyan-200">{typeof simulation?.confidenceAdjusted === 'number' ? `${(simulation.confidenceAdjusted * 100).toFixed(1)}%` : '--'}</span></div>

        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3">
          <div className="flex h-[92px] items-end justify-between gap-2">
            {bars.map((b) => (
              <div key={b.label} className="flex flex-1 flex-col items-center gap-1">
                <div className={`w-full rounded-sm ${b.tone} transition-all duration-300`} style={{ height: b.h }} />
                <span className="text-[10px] text-slate-400">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
