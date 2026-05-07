'use client'

import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts'

interface DayData { date: string; revenue: number; orders: number }

export default function AnalyticsCharts({ days = 30 }: { days?: number }) {
  const [data, setData] = useState<DayData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/analytics?days=${days}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d.revenueByDay ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [days])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-[#9E8079] text-sm">
        Loading chart data…
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-[#9E8079] text-sm">
        No data for the selected period.
      </div>
    )
  }

  const formatted = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' }),
    revenue: Number(d.revenue),
    orders: Number(d.orders),
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Revenue area chart */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] p-5">
        <h3 className="font-semibold text-[#2D1F1A] mb-4">Daily Revenue (Last {days} Days)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={formatted}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C8896A" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#C8896A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#EAE3DC" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9E8079' }} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9E8079' }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid #EAE3DC', fontSize: 12 }}
              formatter={(v: unknown) => [`PKR ${Number(v).toLocaleString()}`, 'Revenue']}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#C8896A"
              strokeWidth={2}
              fill="url(#revenueGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Orders bar chart */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] p-5">
        <h3 className="font-semibold text-[#2D1F1A] mb-4">Daily Orders (Last {days} Days)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={formatted}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EAE3DC" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9E8079' }} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9E8079' }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid #EAE3DC', fontSize: 12 }}
              formatter={(v: unknown) => [Number(v), 'Orders']}
            />
            <Bar dataKey="orders" fill="#7D9B76" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
