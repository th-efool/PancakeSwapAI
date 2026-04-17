'use client'

import { useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
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

type SparklineProps = {
  data: HistoryPoint[]
}

function Sparkline({ data }: SparklineProps) {
  const expectedValues = data.map((point) => point.expected)
  const min = expectedValues.length > 0 ? Math.min(...expectedValues) : 0
  const max = expectedValues.length > 0 ? Math.max(...expectedValues) : 0
  const padding = (max - min) * 0.18 || Math.max(Math.abs(max) * 0.18, 0.0001)
  const previous = data.length > 1 ? data[data.length - 2].expected : null
  const latest = data.length > 0 ? data[data.length - 1].expected : null
  const isPositiveSlope = previous !== null && latest !== null && latest > previous

  const strokeColor = isPositiveSlope ? '#ef4444' : '#b91c1c'
  const fillColor = isPositiveSlope ? '#fee2e2' : '#fecaca'

  return (
    <div className="rounded-md border border-gray-200 bg-white px-2 py-1">
      <ResponsiveContainer width="100%" height={40}>
        <AreaChart data={data}>
          <XAxis dataKey="time" hide />
          <YAxis hide domain={[min - padding, max + padding]} />
          <Area
            type="monotone"
            dataKey="expected"
            stroke={strokeColor}
            strokeWidth={2}
            fill={fillColor}
            fillOpacity={0.65}
            isAnimationActive
            animationDuration={450}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
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

      return next.slice(-50)
    })
  }, [state])

  const values = history.flatMap((point) => [point.profit, point.expected, point.score])
  const min = values.length > 0 ? Math.min(...values) : 0
  const max = values.length > 0 ? Math.max(...values) : 0
  const padding = (max - min) * 0.2 || 0.001

  const activeStrategy = state?.selectedOpportunity?.strategy

  const strategyColors: Record<string, string> = {
    arbitrage: '#2563eb',
    meanReversion: '#9333ea',
    liquidityImbalance: '#ea580c',
    fallback: '#6b7280',
  }

  const activeColor = activeStrategy ? strategyColors[activeStrategy] || '#111827' : '#111827'

  const slope =
    history.length > 1 ? history[history.length - 1].profit - history[history.length - 2].profit : 0

  const glowClass = slope > 0 ? 'bg-green-50' : slope < 0 ? 'bg-red-50' : ''

  return (
    <Card title="Live Performance Trend" className={`transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      {history.length === 0 ? (
        <div className="flex h-[250px] items-center justify-center rounded-lg border border-gray-200 bg-[#f8f9fa]">
          <p className="text-sm text-gray-500">Collecting data...</p>
        </div>
      ) : (
        <div className={`rounded-lg transition-colors duration-500 ${glowClass}`}>
          <div className="mb-2 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Expected Profit</p>
              <p className="text-sm font-medium text-gray-900">
                {history.length > 0
                  ? `${history[history.length - 1].expected.toFixed(4)} BNB`
                  : '--'}
              </p>
            </div>
            <div className="w-[120px] shrink-0">
              <Sparkline data={history} />
            </div>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={history}>
              <CartesianGrid stroke="#e5e7eb" />
              <XAxis dataKey="time" />
              <YAxis
                domain={[min - padding, max + padding]}
                tickFormatter={(value: number) => value.toFixed(4)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#111827' }}
              />

              <Line
                type="monotone"
                dataKey="profit"
                stroke={activeColor}
                strokeWidth={3}
                dot={false}
                isAnimationActive
                animationDuration={400}
              />
              <Line
                type="monotone"
                dataKey="expected"
                stroke="#f87171"
                strokeWidth={2}
                dot={false}
                isAnimationActive
                animationDuration={400}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#9ca3af"
                strokeWidth={2}
                dot={false}
                isAnimationActive
                animationDuration={400}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
