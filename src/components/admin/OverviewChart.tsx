'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts'

const MONTHLY_DATA = [
  { month: 'Jan', revenue: 3200, orders: 32 },
  { month: 'Feb', revenue: 4800, orders: 48 },
  { month: 'Mar', revenue: 4100, orders: 41 },
  { month: 'Apr', revenue: 6200, orders: 62 },
  { month: 'May', revenue: 5400, orders: 54 },
  { month: 'Jun', revenue: 7800, orders: 78 },
  { month: 'Jul', revenue: 6900, orders: 69 },
]

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#EAE3DC] rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-[#2D1F1A] mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-[#9E8079]">
          <span style={{ color: p.color }} className="font-medium">{p.name}:</span>{' '}
          {p.dataKey === 'revenue' ? `$${p.value.toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  )
}

export function RevenueChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={MONTHLY_DATA} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#C8896A" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#C8896A" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#EAE3DC" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9E8079' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#9E8079' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="#C8896A"
          strokeWidth={2.5}
          fill="url(#revenueGrad)"
          dot={false}
          activeDot={{ r: 5, fill: '#C8896A', stroke: 'white', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function OrdersChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={MONTHLY_DATA} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EAE3DC" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9E8079' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#9E8079' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="orders" name="Orders" fill="#C8896A" radius={[6, 6, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  )
}
