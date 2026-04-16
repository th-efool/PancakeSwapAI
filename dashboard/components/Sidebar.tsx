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
        <aside className="w-64 border-r border-white/5 bg-slate-950/50 backdrop-blur-2xl flex flex-col h-screen p-4">
            {/* Header: More compact */}
            <div className="mb-8 flex items-center gap-3 px-2">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-slate-950" />
                </div>
                <div className="flex flex-col">
                    <h1 className="text-sm font-semibold tracking-tight text-slate-200">QUANTCORE</h1>
                    <span className="text-[9px] font-medium tracking-widest text-slate-500 uppercase">Observability</span>
                </div>
            </div>

            {/* Nav: Thinner, tighter spacing */}
            <nav className="flex flex-col gap-1">
                {links.map((l) => {
                    const Icon = l.icon;
                    return (
                        <Link
                            key={l.href}
                            href={l.href}
                            className="group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-slate-400 transition-all hover:bg-slate-900/50 hover:text-cyan-300"
                        >
                            <Icon className="h-4 w-4 transition-colors group-hover:text-cyan-400" />
                            {l.label}
                        </Link>
                    )
                })}
            </nav>
        </aside>
    )
}