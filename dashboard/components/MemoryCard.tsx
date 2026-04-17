import { useEffect, useMemo, useState } from 'react'
import Card from './Card.tsx'
import type { LiveState } from '../app/hooks/useLiveState.ts'

type Props = {
  memory?: LiveState['memory']
  blink?: boolean
}

const nf = (v?: number, d = 2) => (typeof v === 'number' ? v.toFixed(d) : '--')
const safe = <T,>(v: T) => (v === undefined || v === null || (typeof v === 'number' && Number.isNaN(v)) ? '--' : v)

function AnimatedNumber({ value, suffix = '', digits = 2 }: { value?: number; suffix?: string; digits?: number }) {
  const [show, setShow] = useState(value)

  useEffect(() => {
    setShow(value)
  }, [value])

  return <span key={`${show}`}>{safe(typeof show === 'number' ? `${show.toFixed(digits)}${suffix}` : undefined)}</span>
}

export default function MemoryCard({ memory, blink }: Props) {
  const win = memory?.winRate
  const tone = typeof win !== 'number' ? 'text-gray-500' : win > 0.6 ? 'text-green-600' : win < 0.4 ? 'text-red-600' : 'text-gray-500'
  const perf = Math.max(0, Math.min(1, memory?.performanceScore ?? 0))
  const bars = useMemo(() => {
    const full = Math.round(perf * 10)
    return `${'█'.repeat(full)}${'░'.repeat(10 - full)}`
  }, [perf])

  return (
    <Card title="Strategy Intelligence" className={`transition-all duration-300 ${blink ? 'scale-[1.01]' : ''}`}>
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Strategy Name</span>
          <span className="font-semibold text-[#111111]">{safe(memory?.strategy)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Win Rate</span>
          <span className={`font-semibold ${tone}`}><AnimatedNumber value={typeof win === 'number' ? win * 100 : undefined} digits={1} suffix="%" /></span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Avg Profit</span>
          <span className="font-semibold text-[#111111]"><AnimatedNumber value={memory?.avgProfit} digits={4} suffix=" BNB" /></span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Recent Momentum</span>
          <span className="font-semibold text-[#111111]"><AnimatedNumber value={memory?.recentMomentum} digits={3} /></span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Performance Score</span>
          <span className="font-semibold text-red-600">{nf(memory?.performanceScore, 3)}</span>
        </div>
        <div className="rounded-lg border border-gray-200 bg-[#f8f9fa] p-2 text-xs">
          <span className="font-mono text-red-600">[{bars}]</span>
          <span className="ml-2 text-gray-500">Performance Score</span>
        </div>
      </div>
    </Card>
  )
}
