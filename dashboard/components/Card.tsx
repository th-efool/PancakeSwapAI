import { ReactNode } from 'react';

type Props = {
  title?: string;
  className?: string;
  children: ReactNode;
  glow?: boolean;
};

export default function Card({ title, className = '', children, glow = false }: Props) {
  return (
    <section
      className={`relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 ${
        glow ? 'border-red-200 shadow-md' : 'hover:border-gray-300'
      } ${className}`}
    >
      {title && (
        <h2 className="mb-6 flex items-center text-xs font-semibold uppercase tracking-[0.2em] text-[#111111]">
          {title}
        </h2>
      )}
      <div className="relative z-10">{children}</div>
    </section>
  );
}
