'use client'

import { useEffect, useState } from 'react'

type Source = 'ON_CHAIN' | 'DEXSCREENER' | 'SUBGRAPH'

const ALL: Source[] = ['ON_CHAIN', 'DEXSCREENER', 'SUBGRAPH']

export default function SettingsPage() {
  const [dataSource, setDataSource] = useState<Source>('ON_CHAIN')
  const [fallbackOrder, setFallbackOrder] = useState<Source[]>(ALL)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/market-data', { cache: 'no-store' })
        const json = await res.json()
        if (json?.dataSource) setDataSource(json.dataSource)
        if (Array.isArray(json?.fallbackOrder) && json.fallbackOrder.length) setFallbackOrder(json.fallbackOrder)
      } catch {
        setStatus('load_failed')
      }
    }
    load()
  }, [])

  const save = async () => {
    setSaving(true)
    setStatus('')
    try {
      const res = await fetch('/api/market-data', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ dataSource, fallbackOrder }),
      })
      const json = await res.json()
      if (!res.ok || !json?.ok) {
        setStatus('save_failed')
      } else {
        setStatus('saved')
      }
    } catch {
      setStatus('save_failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
        <h2 className="text-xl font-semibold">Market Data Settings</h2>
        <p className="mt-1 text-sm text-slate-400">Configure source + fallback order.</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 grid gap-3">
        <label className="text-sm text-slate-300">Configured Source</label>
        <select
          className="rounded-md border border-white/20 bg-slate-950 px-3 py-2 text-sm"
          value={dataSource}
          onChange={(e) => setDataSource(e.target.value as Source)}
        >
          {ALL.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <label className="mt-2 text-sm text-slate-300">Fallback Order</label>
        <div className="grid gap-2 md:grid-cols-3">
          {ALL.map((s) => {
            const enabled = fallbackOrder.includes(s)
            return (
              <button
                key={s}
                type="button"
                className={`rounded-md border px-3 py-2 text-sm ${enabled ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300' : 'border-white/15 bg-slate-950 text-slate-300'}`}
                onClick={() => {
                  if (enabled) {
                    setFallbackOrder((prev) => prev.filter((x) => x !== s))
                  } else {
                    setFallbackOrder((prev) => [...prev, s])
                  }
                }}
              >
                {s}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="mt-2 w-fit rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>

        {status ? <p className="text-xs text-slate-400">{status}</p> : null}
      </div>
    </div>
  )
}
