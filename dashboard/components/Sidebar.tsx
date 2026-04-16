import Link from 'next/link'
import { Activity, Terminal, Globe, BarChart3, ShieldAlert, Zap, Wallet, Droplets } from 'lucide-react'

const links = [
    { href: '/', label: 'Live Monitor', icon: Activity },
    { href: '/logs', label: 'Logs', icon: Terminal },
    { href: '/agents/market', label: 'Market', icon: Globe },
    { href: '/agents/strategy', label: 'Strategy', icon: BarChart3 },
    { href: '/agents/risk', label: 'Risk', icon: ShieldAlert },
    { href: '/agents/execution', label: 'Execution', icon: Zap },
    { href: '/agents/portfolio', label: 'Portfolio', icon: Wallet },
    { href: '/liquidity', label: 'Liquidity', icon: Droplets },
]

export default function Sidebar() {
    return (
        <aside className="w-full border-b border-white/5 bg-slate-950/80 p-6 backdrop-blur-xl md:min-h-screen md:w-72 md:border-b-0 md:border-r flex flex-col">
            <div className="mb-10 flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 shadow-[0_0_20px_rgba(34,211,238,0.4)] flex items-center justify-center">
                    <Activity className="h-5 w-5 text-slate-950" />
                </div>
                <div>
                    <h1 className="text-base font-bold tracking-wide text-slate-100">QUANT<span className="text-cyan-400">CORE</span></h1>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500">Observability</p>
                </div>
            </div>

            <nav className="grid gap-2 flex-1">
                {links.map((l) => {
                    const Icon = l.icon;
                    return (
                        <Link
                            key={l.href}
                            href={l.href}
                            className="group flex items-center gap-3 rounded-xl border border-transparent px-4 py-3 text-sm font-medium text-slate-400 transition-all hover:bg-slate-900/80 hover:border-white/5 hover:text-cyan-300"
                        >
                            <Icon className="h-4 w-4 opacity-50 group-hover:opacity-100 group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-all" />
                            {l.label}
                        </Link>
                    )
                })}
            </nav>
        </aside>
    )
}