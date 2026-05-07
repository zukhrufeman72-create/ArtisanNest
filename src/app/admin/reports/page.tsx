import { prisma } from '@/lib/prisma'
import {
  TrendingUp, ShoppingBag, Users, Eye, Star,
  ArrowUpRight, BarChart2, Activity,
} from 'lucide-react'
import { RevenueChart, OrdersChart } from '@/components/admin/OverviewChart'

export default async function ReportsPage() {
  // eslint-disable-next-line react-hooks/purity
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  // eslint-disable-next-line react-hooks/purity
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)

  const [
    revenueAll,
    revenuePrev,
    revenueNow,
    orderStatusCounts,
    totalUsers,
    newUsers,
    prevUsers,
    topProducts,
    topSellers,
    avgRating,
    visitorCount,
    visitorPrev,
    topCategories,
  ] = await Promise.all([
    prisma.order.aggregate({ _sum: { totalPrice: true } }),
    prisma.order.aggregate({ _sum: { totalPrice: true }, where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
    prisma.order.aggregate({ _sum: { totalPrice: true }, where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.order.groupBy({ by: ['status'], _count: true }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
    prisma.product.findMany({
      orderBy: { purchaseCount: 'desc' },
      take: 8,
      select: { id: true, name: true, purchaseCount: true, price: true, image: true, viewCount: true, score: true },
    }),
    prisma.user.findMany({
      where: { role: 'SELLER' },
      select: {
        name: true,
        products: { select: { orderItems: { select: { price: true, quantity: true } } } },
      },
      take: 5,
    }),
    prisma.review.aggregate({ _avg: { rating: true } }),
    prisma.visitorLog.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.visitorLog.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
    prisma.product.groupBy({
      by: ['categoryId'],
      _sum: { purchaseCount: true },
      orderBy: { _sum: { purchaseCount: 'desc' } },
      take: 6,
    }),
  ])

  const revenue = revenueAll._sum.totalPrice ?? 0
  const revenueThisMonth = revenueNow._sum.totalPrice ?? 0
  const revenuePrevMonth = revenuePrev._sum.totalPrice ?? 0
  const revenueGrowth = revenuePrevMonth
    ? Math.round(((revenueThisMonth - revenuePrevMonth) / revenuePrevMonth) * 100)
    : 0
  const userGrowth = prevUsers
    ? Math.round(((newUsers - prevUsers) / prevUsers) * 100)
    : 0
  const visitorGrowth = visitorPrev
    ? Math.round(((visitorCount - visitorPrev) / visitorPrev) * 100)
    : 0

  const statusMap = Object.fromEntries(orderStatusCounts.map((s) => [s.status, s._count]))
  const totalOrders = orderStatusCounts.reduce((s, c) => s + c._count, 0)

  const sellerRevenues = topSellers.map((s) => ({
    name: s.name,
    revenue: s.products.reduce(
      (sum, prod) => sum + prod.orderItems.reduce((s2, oi) => s2 + oi.price * oi.quantity, 0),
      0,
    ),
  })).sort((a, b) => b.revenue - a.revenue)

  // Enrich category names
  const catIds = topCategories.map((c) => c.categoryId).filter(Boolean) as number[]
  const cats = await prisma.category.findMany({ where: { id: { in: catIds } }, select: { id: true, name: true, color: true } })
  const catMap = Object.fromEntries(cats.map((c) => [c.id, c]))

  const summaryCards = [
    {
      label: 'Total Revenue', value: `PKR ${revenue.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`,
      sub: `+${revenueGrowth}% vs last 30d`, icon: TrendingUp,
      color: 'text-[#C8896A] bg-[#C8896A]/10', positive: revenueGrowth >= 0,
    },
    {
      label: 'Total Orders', value: totalOrders.toLocaleString(),
      sub: `${statusMap['DELIVERED'] ?? 0} delivered`, icon: ShoppingBag,
      color: 'text-[#7D9B76] bg-[#7D9B76]/10', positive: true,
    },
    {
      label: 'Customers', value: totalUsers.toLocaleString(),
      sub: `+${newUsers} this month (${userGrowth >= 0 ? '+' : ''}${userGrowth}%)`, icon: Users,
      color: 'text-blue-600 bg-blue-50', positive: userGrowth >= 0,
    },
    {
      label: 'Page Views', value: visitorCount.toLocaleString(),
      sub: `${visitorGrowth >= 0 ? '+' : ''}${visitorGrowth}% vs last 30d`, icon: Eye,
      color: 'text-purple-600 bg-purple-50', positive: visitorGrowth >= 0,
    },
    {
      label: 'Avg Rating', value: (avgRating._avg.rating ?? 0).toFixed(1),
      sub: 'Across all products', icon: Star,
      color: 'text-amber-500 bg-amber-50', positive: true,
    },
  ]

  const categoryBreakdown = topCategories.map((c) => ({
    name: catMap[c.categoryId!]?.name ?? 'Unknown',
    color: catMap[c.categoryId!]?.color ?? '#C8896A',
    purchases: c._sum.purchaseCount ?? 0,
  }))

  const maxPurchases = Math.max(...categoryBreakdown.map((c) => c.purchases), 1)

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#2D1F1A]">Reports & Analytics</h1>
        <p className="text-sm text-[#9E8079] mt-0.5">30-day performance overview</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {summaryCards.map((c) => {
          const Icon = c.icon
          return (
            <div key={c.label} className="bg-white rounded-2xl border border-[#EAE3DC] p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${c.color}`}>
                  <Icon size={18} />
                </div>
                <span className={`flex items-center gap-0.5 text-xs font-medium ${c.positive ? 'text-emerald-600' : 'text-rose-500'}`}>
                  <ArrowUpRight size={12} className={c.positive ? '' : 'rotate-180'} />
                  {c.sub.startsWith('+') || c.sub.startsWith('-') ? c.sub : ''}
                </span>
              </div>
              <p className="text-2xl font-bold text-[#2D1F1A]">{c.value}</p>
              <p className="text-sm text-[#9E8079] mt-0.5">{c.label}</p>
              {!c.sub.startsWith('+') && !c.sub.startsWith('-') && (
                <p className="text-xs text-[#9E8079] mt-1">{c.sub}</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#EAE3DC] p-5">
          <h2 className="font-semibold text-[#2D1F1A] mb-1">Revenue Trend</h2>
          <p className="text-xs text-[#9E8079] mb-4">Last 7 months</p>
          <RevenueChart />
        </div>
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#EAE3DC] p-5">
          <h2 className="font-semibold text-[#2D1F1A] mb-1">Orders Volume</h2>
          <p className="text-xs text-[#9E8079] mb-4">Monthly breakdown</p>
          <OrdersChart />
        </div>
      </div>

      {/* Order status + Category breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-[#EAE3DC] p-5">
          <h2 className="font-semibold text-[#2D1F1A] mb-4">Order Status Breakdown</h2>
          <div className="space-y-3">
            {(['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const).map((s) => {
              const count = statusMap[s] ?? 0
              const pct = totalOrders ? Math.round((count / totalOrders) * 100) : 0
              const colors: Record<string, string> = {
                PENDING: 'bg-amber-400', PAID: 'bg-blue-400', SHIPPED: 'bg-purple-400',
                DELIVERED: 'bg-[#7D9B76]', CANCELLED: 'bg-rose-400',
              }
              return (
                <div key={s}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-[#2D1F1A] font-medium capitalize">{s.toLowerCase()}</span>
                    <span className="text-[#9E8079] text-xs">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-[#F5F2EF] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${colors[s]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#EAE3DC] p-5">
          <h2 className="font-semibold text-[#2D1F1A] mb-4">Top Categories by Sales</h2>
          <div className="space-y-3">
            {categoryBreakdown.length === 0
              ? <p className="text-sm text-[#9E8079] text-center py-4">No sales data yet.</p>
              : categoryBreakdown.map((cat) => {
                const pct = Math.round((cat.purchases / maxPurchases) * 100)
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="text-[#2D1F1A] font-medium">{cat.name}</span>
                      </div>
                      <span className="text-[#9E8079] text-xs">{cat.purchases} sales</span>
                    </div>
                    <div className="h-2 bg-[#F5F2EF] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                )
              })
            }
          </div>
        </div>
      </div>

      {/* Top products + top sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#EAE3DC] flex items-center justify-between">
            <h2 className="font-semibold text-[#2D1F1A]">Top Products by Sales</h2>
            <BarChart2 size={16} className="text-[#9E8079]" />
          </div>
          <ul className="divide-y divide-[#F5EFE6]">
            {topProducts.length === 0
              ? <li className="px-5 py-8 text-center text-sm text-[#9E8079]">No sales data yet</li>
              : topProducts.map((p, i) => (
                <li key={p.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-[#F5F0EB]/30 transition-colors">
                  <span className="text-sm font-bold text-[#EAE3DC] w-5 shrink-0 text-right">#{i + 1}</span>
                  <div className="w-9 h-9 rounded-xl overflow-hidden bg-[#F5F0EB] shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {p.image && <img src={p.image} alt={p.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#2D1F1A] truncate text-sm">{p.name}</p>
                    <p className="text-xs text-[#9E8079]">{p.viewCount} views · ★ {p.score.toFixed(1)}</p>
                  </div>
                  <span className="text-sm font-semibold text-[#C8896A] shrink-0">{p.purchaseCount} sold</span>
                </li>
              ))
            }
          </ul>
        </div>

        <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#EAE3DC] flex items-center justify-between">
            <h2 className="font-semibold text-[#2D1F1A]">Top Sellers by Revenue</h2>
            <Activity size={16} className="text-[#9E8079]" />
          </div>
          <ul className="divide-y divide-[#F5EFE6]">
            {sellerRevenues.length === 0
              ? <li className="px-5 py-8 text-center text-sm text-[#9E8079]">No seller data yet</li>
              : sellerRevenues.map((s, i) => (
                <li key={s.name} className="px-5 py-3.5 flex items-center gap-4 hover:bg-[#F5F0EB]/30 transition-colors">
                  <span className="text-sm font-bold text-[#EAE3DC] w-5 shrink-0 text-right">#{i + 1}</span>
                  <div className="w-9 h-9 rounded-full bg-[#C8896A]/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-[#C8896A]">{s.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <p className="flex-1 font-medium text-[#2D1F1A] truncate text-sm">{s.name}</p>
                  <p className="font-bold text-[#2D1F1A] text-sm shrink-0">
                    PKR {s.revenue.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
                  </p>
                </li>
              ))
            }
          </ul>
        </div>
      </div>
    </div>
  )
}
