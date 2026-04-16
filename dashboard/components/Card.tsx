import { ReactNode } from 'react';

type Props = {
  title?: string;
  className?: string;
  children: ReactNode;
};

export default function Card({ title, className = '', children }: Props) {
  return (
    <section className={`rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-md transition-transform duration-200 hover:scale-[1.01] ${className}`}>
      {title ? <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-300">{title}</h2> : null}
      {children}
    </section>
  );
}
