type Props = {
  label: string;
  value: string | number;
  tone?: 'default' | 'good' | 'warn';
};

const toneMap = {
  default: 'text-cyan-300',
  good: 'text-emerald-300',
  warn: 'text-amber-300',
};

export default function MetricBox({ label, value, tone = 'default' }: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4 shadow-xl transition-transform duration-200 hover:scale-[1.02]">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${toneMap[tone]}`}>{value}</p>
    </div>
  );
}
