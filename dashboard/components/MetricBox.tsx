import { ReactNode } from 'react';

type Props = {
  label: string;
  value: string | number;
  tone?: 'default' | 'good' | 'warn' | 'danger';
  icon?: ReactNode;
};

const toneMap = {
  default: 'text-red-600',
  good: 'text-green-600',
  warn: 'text-gray-500',
  danger: 'text-red-600',
};

export default function MetricBox({ label, value, tone = 'default', icon }: Props) {
  return (
      <div className="group relative min-w-[140px] overflow-hidden rounded-2xl border border-gray-200 bg-[#f8f9fa] p-5 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:bg-[#f8f9fa]/50 hover:border-gray-200">
        <div className="mb-3 flex items-center gap-3 text-gray-500 group-hover:text-gray-500 transition-colors">
          {icon && <span className="h-4 w-4">{icon}</span>}
          <p className="text-[10px] font-semibold uppercase tracking-widest">{label}</p>
        </div>
        <p className={`font-semibold whitespace-nowrap text-[clamp(0.6rem,1vw,1.2rem)] ${toneMap[tone]}`}>{value}</p>
      </div>
  );
}
