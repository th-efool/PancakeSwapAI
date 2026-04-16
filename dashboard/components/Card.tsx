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
          className={`relative rounded-2xl border border-white/5 bg-slate-950/60 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 ${
              glow
                  ? 'border-cyan-500/30 shadow-[0_0_30px_-5px_rgba(34,211,238,0.15)] hover:shadow-[0_0_40px_-5px_rgba(34,211,238,0.25)]'
                  : 'hover:border-white/10'
          } ${className}`}
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
        {title && (
            <h2 className="mb-6 flex items-center text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              {title}
            </h2>
        )}
        <div className="relative z-10">{children}</div>
      </section>
  );
}