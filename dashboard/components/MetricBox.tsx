import { ReactNode } from 'react';

type Props = {
  label: string;
  value: string | number;
  tone?: 'default' | 'good' | 'warn' | 'danger';
  icon?: ReactNode;
};

const toneMap = {
  default: 'text-gray-700',
  good: 'text-green-600',
  warn: 'text-gray-500',
  danger: 'text-red-600',
};

export default function MetricBox({ label, value, tone = 'default', icon }: Props) {
  const valueText = String(value ?? '--');
  const isLong = valueText.length > 16;
  const isPriorityMetric = label === 'Current Opportunity' || label === 'Best Strategy';
  const hasValue = valueText.trim() !== '' && valueText !== '--';

  return (
      <div className="group relative min-w-[140px] overflow-hidden rounded-2xl border border-gray-200 bg-[#f8f9fa] p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-[1px]">
        <div className="mb-3 flex items-center gap-3 text-gray-500 group-hover:text-gray-500 transition-colors">
          {icon && <span className="h-4 w-4">{icon}</span>}
          <p className="truncate text-sm font-semibold uppercase tracking-widest">{label}</p>
        </div>
        <div
          className={`truncate max-w-full ${
            isPriorityMetric
              ? `text-red-600 font-bold ${hasValue ? 'opacity-90 animate-[pulse_2s_ease-in-out_infinite]' : ''}`
              : toneMap[tone]
          } ${isLong ? 'text-xs font-semibold truncate' : 'text-sm font-semibold truncate'}`}
        >
          {value}
        </div>
      </div>
  );
}
