'use client'

import { useState, useEffect } from 'react'
import { Eye, TrendingUp, Users, Map, RefreshCw } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts'

interface AnalyticsSummary {
  totalRevenue: number
  totalOrders: number
  totalUsers: number
  totalProducts: number
  newUsers: number
  newOrders: number
  visitorCount: number
}

interface TopPage { path: string; views: number }
interface TopProduct { id: number; name: string; purchaseCount: number; price: number; image: string | null }
interface RevenueDay { date: string; revenue: number; orders: number }

interface Analytics {
  summary: AnalyticsSummary
  topProducts: TopProduct[]
  topPages: TopPage[]
  revenueByDay: RevenueDay[]
  ordersByStatus: Record<string, number>
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null)
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/analytics?days=${days}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [days])

  const chartData = (data?.revenueByDay ?? []).map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' }),
    revenue: Number(d.revenue),
    orders: Number(d.orders),
  }))

  return (
    <div className="min-h-screen bg-[#F5F0EB] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#2D1F1A]">Visitor Analytics</h1>
            <p className="text-sm text-[#9E8079] mt-0.5">Traffic, engagement, and conversion data</p>
          </div>
          <div className="flex gap-2">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  days === d ? 'bg-[#C8896A] text-white' : 'bg-white border border-[#EAE3DC] text-[#9E8079] hover:border-[#C8896A]'
                }`}
              >
                {d}d
              </button>
            ))}
            <button
              onClick={() => setDays(days)}
              className="p-2 bg-white rounded-xl border border-[#EAE3DC] hover:bg-[#F5F0EB] transition-colors"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {loading || !data ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-2 border-[#C8896A] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Page Views', value: data.summary.visitorCount.toLocaleString(), icon: Eye, color: 'text-purple-600 bg-purple-50' },
                { label: 'New Customers', value: data.summary.newUsers.toLocaleString(), icon: Users, color: 'text-blue-600 bg-blue-50' },
                { label: 'New Orders', value: data.summary.newOrders.toLocaleString(), icon: TrendingUp, color: 'text-[#C8896A] bg-[#C8896A]/10' },
                { label: 'Revenue', value: `PKR ${data.summary.totalRevenue.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-2xl border border-[#EAE3DC] p-5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                    <s.icon size={18} />
                  </div>
                  <p className="text-2xl font-bold text-[#2D1F1A]">{s.value}</p>
                  <p className="text-sm text-[#9E8079] mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl border border-[#EAE3DC] p-5">
                <h3 className="font-semibold text-[#2D1F1A] mb-4">Revenue Over Time</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
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
                    <Area type="monotone" dataKey="revenue" stroke="#C8896A" strokeWidth={2} fill="url(#revGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl border border-[#EAE3DC] p-5">
                <h3 className="font-semibold text-[#2D1F1A] mb-4">Daily Order Volume</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EAE3DC" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9E8079' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#9E8079' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: '1px solid #EAE3DC', fontSize: 12 }}
                    />
                    <Bar dataKey="orders" fill="#7D9B76" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top pages + top products */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
                <div className="px-5 py-4 border-b border-[#EAE3DC] flex items-center gap-2">
                  <Map size={16} className="text-[#9E8079]" />
                  <h3 className="font-semibold text-[#2D1F1A]">Top Pages</h3>
                </div>
                <ul className="divide-y divide-[#F5EFE6]">
                  {data.topPages.length === 0
                    ? <li className="px-5 py-8 text-center text-sm text-[#9E8079]">No page view data yet.</li>
                    : data.topPages.map((p, i) => (
                      <li key={p.path} className="px-5 py-3 flex items-center gap-3 hover:bg-[#F5F0EB]/30 transition-colors">
                        <span className="text-sm font-bold text-[#EAE3DC] w-5 text-right shrink-0">#{i + 1}</span>
                        <p className="flex-1 text-sm text-[#2D1F1A] truncate font-mono">{p.path}</p>
                        <span className="text-sm font-semibold text-[#C8896A] shrink-0">{p.views.toLocaleString()}</span>
                      </li>
                    ))
                  }
                </ul>
              </div>

              <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
                <div className="px-5 py-4 border-b border-[#EAE3DC] flex items-center gap-2">
                  <TrendingUp size={16} className="text-[#9E8079]" />
                  <h3 className="font-semibold text-[#2D1F1A]">Top Products by Sales</h3>
                </div>
                <ul className="divide-y divide-[#F5EFE6]">
                  {data.topProducts.length === 0
                    ? <li className="px-5 py-8 text-center text-sm text-[#9E8079]">No sales data yet.</li>
                    : data.topProducts.slice(0, 6).map((p, i) => (
                      <li key={p.id} className="px-5 py-3 flex items-center gap-3 hover:bg-[#F5F0EB]/30 transition-colors">
                        <span className="text-sm font-bold text-[#EAE3DC] w-5 text-right shrink-0">#{i + 1}</span>
                        {p.image && (
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#F5F0EB] shrink-0">
                            <img src={p.image ?? undefined} alt={p.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <p className="flex-1 text-sm text-[#2D1F1A] truncate">{p.name}</p>
                        <span className="text-sm font-semibold text-[#C8896A] shrink-0">{p.purchaseCount} sold</span>
                      </li>
                    ))
                  }
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
