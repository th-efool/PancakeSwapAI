import { ReactNode } from 'react';

type Props = {
  label: string;
  value: string | number;
  tone?: 'default' | 'good' | 'warn' | 'danger';
  icon?: ReactNode;
};

const toneMap = {
  default: 'text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.4)]',
  good: 'text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]',
  warn: 'text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.4)]',
  danger: 'text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.4)]',
};

export default function MetricBox({ label, value, tone = 'default', icon }: Props) {
  return (
      <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-slate-900/40 p-5 shadow-inner transition-all duration-300 hover:scale-[1.02] hover:bg-slate-800/50 hover:border-white/10">
        <div className="mb-3 flex items-center gap-3 text-slate-500 group-hover:text-slate-300 transition-colors">
          {icon && <span className="h-4 w-4">{icon}</span>}
          <p className="text-[10px] font-semibold uppercase tracking-widest">{label}</p>
        </div>
        <p className={`break-words text-2xl leading-tight font-black tracking-tight md:text-[1.7rem] ${toneMap[tone]}`}>{value}</p>
      </div>
  );
}
