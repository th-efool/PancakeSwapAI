type Props = {
  label: string
  value: string
  tone: string
  pulse?: boolean
  subtle?: boolean
}

export default function TemporalMetric({ label, value, tone, pulse = false, subtle = false }: Props) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-slate-900/50 p-4 transition duration-200 ${pulse ? 'scale-[1.02] bg-white/10' : ''}`}
    >
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-2 font-bold ${subtle ? 'text-xl' : 'text-2xl'} ${tone}`}>{value}</p>
    </div>
  )
}
