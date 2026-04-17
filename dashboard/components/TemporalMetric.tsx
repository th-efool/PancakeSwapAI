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
      className={`rounded-2xl border border-gray-200 bg-[#f8f9fa] p-4 transition duration-200 ${pulse ? 'scale-[1.02] bg-white' : ''}`}
    >
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-2 font-bold ${subtle ? 'text-xl' : 'text-2xl'} ${tone}`}>{value}</p>
    </div>
  )
}
