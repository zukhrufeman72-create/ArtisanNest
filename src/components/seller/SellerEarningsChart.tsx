'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts'

type MonthData = { month: string; revenue: number; orders: number }

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

export function EarningsAreaChart({ data }: { data: MonthData[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="sellerRevenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#7D9B76" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#7D9B76" stopOpacity={0} />
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
          stroke="#7D9B76"
          strokeWidth={2.5}
          fill="url(#sellerRevenueGrad)"
          dot={false}
          activeDot={{ r: 5, fill: '#7D9B76', stroke: 'white', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function EarningsBarChart({ data }: { data: MonthData[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EAE3DC" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9E8079' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#9E8079' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="orders" name="Orders" fill="#C8896A" radius={[6, 6, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  )
}
