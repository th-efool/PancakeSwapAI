'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Activity, Terminal, Globe, BarChart3, ShieldAlert, Zap, Wallet, Droplets, SlidersHorizontal, PanelLeftClose, PanelLeftOpen, Menu, X } from 'lucide-react'

const links = [
  { href: '/', label: 'Live Monitor', icon: Activity },
  { href: '/logs', label: 'Logs', icon: Terminal },
  { href: '/agents/market', label: 'Market', icon: Globe },
  { href: '/agents/strategy', label: 'Strategy', icon: BarChart3 },
  { href: '/agents/risk', label: 'Risk', icon: ShieldAlert },
  { href: '/agents/execution', label: 'Execution', icon: Zap },
  { href: '/agents/portfolio', label: 'Portfolio', icon: Wallet },
  { href: '/liquidity', label: 'Liquidity', icon: Droplets },
  { href: '/settings', label: 'Settings', icon: SlidersHorizontal },
]

export default function Sidebar() {
  const path = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <button
        aria-label="Toggle sidebar"
        onClick={() => setMobileOpen((v) => !v)}
        className="fixed left-3 top-3 z-40 rounded-lg border border-gray-200 bg-white p-2 text-[#111111] md:hidden"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {mobileOpen ? <button className="fixed inset-0 z-20 bg-black/30 md:hidden" onClick={() => setMobileOpen(false)} aria-label="Close sidebar overlay" /> : null}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex h-screen flex-col border-r border-gray-200 bg-white p-4 transition-transform duration-200 md:sticky md:top-0 md:z-10 md:translate-x-0 ${collapsed ? 'md:w-20' : 'md:w-64'} ${mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'}`}
      >
        <div className="mb-8 flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-600">
              <Activity className="h-4 w-4 text-white" />
            </div>
            {collapsed ? null : (
              <div className="flex flex-col whitespace-nowrap">
                <h1 className="text-sm font-semibold tracking-tight text-[#111111]">QUANTCORE</h1>
                <span className="text-[9px] font-medium uppercase tracking-widest text-gray-500">Observability</span>
              </div>
            )}
          </div>
          <button
            aria-label="Collapse sidebar"
            onClick={() => setCollapsed((v) => !v)}
            className="hidden rounded-lg p-1 text-gray-500 transition hover:bg-gray-50 hover:text-red-600 md:block"
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          {links.map((l) => {
            const Icon = l.icon
            const active = l.href === '/' ? path === '/' : path.startsWith(l.href)
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className={`group flex items-center rounded-lg px-3 py-2 text-[13px] transition-all ${collapsed ? 'justify-center' : 'gap-3'} ${active ? 'bg-red-50 text-red-600' : 'text-gray-500 hover:bg-gray-50 hover:text-red-600'}`}
                title={collapsed ? l.label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0 transition-colors group-hover:text-red-600" />
                {collapsed ? null : l.label}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
