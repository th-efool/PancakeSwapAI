import Link from 'next/link'

const links = [
  { href: '/', label: 'Live Monitor' },
  { href: '/logs', label: 'Logs' },
  { href: '/agents/market', label: 'Market' },
  { href: '/agents/strategy', label: 'Strategy' },
  { href: '/agents/risk', label: 'Risk' },
  { href: '/agents/execution', label: 'Execution' },
  { href: '/agents/portfolio', label: 'Portfolio' },
  { href: '/liquidity', label: 'Liquidity' },
]

export default function Sidebar() {
  return (
    <aside className="w-full border-b border-white/10 bg-white/5 p-4 backdrop-blur-md md:min-h-screen md:w-64 md:border-b-0 md:border-r">
      <h1 className="mb-4 text-lg font-semibold text-slate-100">Observability</h1>
      <nav className="grid gap-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-slate-200 transition hover:translate-x-1 hover:border-cyan-300/40 hover:text-cyan-200"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
