'use client'

import { useEffect, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { LiveState } from '../app/hooks/useLiveState.ts'
import Card from './Card.tsx'

type HistoryPoint = {
  time: string
  profit: number
  expected: number
  score: number
}

type Props = {
  state: LiveState | null
}

export default function LiveChart({ state }: Props) {
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true)
  }, [])

  useEffect(() => {
    if (!state) return

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistory((prev) => {
      const next = [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          profit: state?.performance?.netProfit || 0,
          expected: state?.selectedOpportunity?.expectedProfit || 0,
          score: state?.selectedOpportunity?.score || 0,
        },
      ]

      return next.slice(-30)
    })
  }, [state])

  return (
    <Card title="Live Performance Trend" className={`transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      {history.length === 0 ? (
        <div className="flex h-[250px] items-center justify-center rounded-lg border border-gray-200 bg-[#f8f9fa]">
          <p className="text-sm text-gray-500">Collecting data...</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={history}>
            <CartesianGrid stroke="#e5e7eb" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />

            <Line type="monotone" dataKey="profit" stroke="#16a34a" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="expected" stroke="#dc2626" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="score" stroke="#111827" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
