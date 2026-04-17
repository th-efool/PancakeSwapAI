import Card from './Card.tsx'
import type { LiveState } from '../app/hooks/useLiveState.ts'

type Props = {
  decision?: LiveState['decision']
  blink?: boolean
}

const nf = (v?: number, d = 3) => (typeof v === 'number' ? v.toFixed(d) : '--')
const safe = <T,>(v: T) => (v === undefined || v === null || (typeof v === 'number' && Number.isNaN(v)) ? '--' : v)

export default function DecisionCard({ decision, blink }: Props) {
  return (
    <Card title="Decision Trace" className={`transition-all duration-300 hover:scale-[1.01] ${blink ? 'scale-[1.01]' : ''}`}>
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between"><span className="text-slate-400">Regime</span><span className="font-semibold text-sky-200">{safe(decision?.regime)}</span></div>
        <div className="flex items-center justify-between"><span className="text-slate-400">Selected Strategy</span><span className="font-semibold text-slate-100">{safe(decision?.selectedStrategy)}</span></div>
        <div className="flex items-center justify-between"><span className="text-slate-400">Base Score</span><span className="font-semibold text-slate-100">{nf(decision?.baseScore)}</span></div>
        <div className="flex items-center justify-between"><span className="text-slate-400">Memory Score</span><span className="font-semibold text-violet-200">{nf(decision?.memoryScore)}</span></div>
        <div className="flex items-center justify-between"><span className="text-slate-400">Final Score</span><span className="font-semibold text-cyan-200">{nf(decision?.finalScore)}</span></div>
        <div className="rounded-xl border border-cyan-300/20 bg-cyan-500/5 p-3 text-slate-300">
          {safe(decision?.reason)}
        </div>
      </div>
    </Card>
  )
}
