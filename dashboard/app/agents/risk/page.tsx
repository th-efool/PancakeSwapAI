'use client'

import Card from '../../../../components/Card'
import MetricBox from '../../../../components/MetricBox'
import { useLiveState } from '../../../hooks/useLiveState'

export default function RiskPage() {
  const { data } = useLiveState()
  const approved = !!data?.risk?.approved

  return (
    <Card title="Risk Agent">
      <div className="grid gap-4 md:grid-cols-2">
        <MetricBox label="Approval" value={approved ? 'Approved' : 'Rejected'} tone={approved ? 'good' : 'warn'} />
        <MetricBox label="Reason" value={data?.risk?.reason ?? '—'} />
      </div>
    </Card>
  )
}
