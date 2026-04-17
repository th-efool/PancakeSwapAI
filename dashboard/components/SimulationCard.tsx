import { useMemo } from 'react'
import Card from './Card.tsx'
import type { LiveState } from '../app/hooks/useLiveState.ts'

type Props = {
  simulation?: LiveState['simulation']
  blink?: boolean
}

const nf = (v?: number, d = 2) => (typeof v === 'number' ? v.toFixed(d) : '--')
const safe = <T,>(v: T) => (v === undefined || v === null || (typeof v === 'number' && Number.isNaN(v)) ? '--' : v)

export default function SimulationCard({ simulation, blink }: Props) {
  const risk = simulation?.riskScore
  const worstTone = typeof simulation?.worstCase !== 'number' ? 'text-[#111111]' : simulation.worstCase >= 0 ? 'text-green-600' : 'text-red-600'
  const riskTone = typeof risk !== 'number' ? 'text-[#111111]' : risk < 0.33 ? 'text-green-600' : risk < 0.66 ? 'text-gray-500' : 'text-red-600'
  const riskText = typeof risk !== 'number' ? '--' : risk < 0.33 ? 'Low' : risk < 0.66 ? 'Medium' : 'High'

  const bars = useMemo(() => {
    const base = simulation?.avg ?? 0
    const down = simulation?.worstCase ?? 0
    const up = simulation?.bestCase ?? 0
    const slippage = -Math.abs(base) * 0.35
    const gas = -Math.abs(base) * 0.15
    const raw = [base, down, up, slippage, gas]
    const max = Math.max(...raw.map((v) => Math.abs(v)), 0.001)
    return raw.map((v, i) => ({
      label: ['Base', 'Down', 'Up', 'Slippage', 'Gas'][i],
      v,
      h: `${Math.max(12, Math.round((Math.abs(v) / max) * 72))}px`,
      tone: v >= 0 ? 'bg-green-600/70' : 'bg-red-600/70',
    }))
  }, [simulation])

  return (
    <Card title="Pre-Trade Simulation" className={`transition-all duration-300 ${blink ? 'scale-[1.01]' : ''}`}>
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between"><span className="text-gray-500">Best Case Profit</span><span className="font-semibold text-green-600">{nf(simulation?.bestCase, 4)} BNB</span></div>
        <div className="flex items-center justify-between"><span className="text-gray-500">Worst Case Profit</span><span className={`font-semibold ${worstTone}`}>{nf(simulation?.worstCase, 4)} BNB</span></div>
        <div className="flex items-center justify-between"><span className="text-gray-500">Average Profit</span><span className="font-semibold text-[#111111]">{nf(simulation?.avg, 4)} BNB</span></div>
        <div className="flex items-center justify-between"><span className="text-gray-500">Risk Score</span><span className={`font-semibold ${riskTone}`}>{riskText} {nf(simulation?.riskScore, 3)}</span></div>
        <div className="flex items-center justify-between"><span className="text-gray-500">Adjusted Confidence</span><span className="font-semibold text-red-600">{typeof simulation?.confidenceAdjusted === 'number' ? `${(simulation.confidenceAdjusted * 100).toFixed(1)}%` : safe(undefined)}</span></div>

        <div className="rounded-xl border border-gray-200 bg-[#f8f9fa] p-3">
          <div className="flex h-[92px] items-end justify-between gap-2">
            {bars.map((b) => (
              <div key={b.label} className="flex flex-1 flex-col items-center gap-1">
                <div className={`w-full rounded-sm ${b.tone} transition-all duration-300`} style={{ height: b.h }} />
                <span className="text-[10px] text-gray-500">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
