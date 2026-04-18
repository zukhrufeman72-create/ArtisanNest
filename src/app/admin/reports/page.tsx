import { prisma } from '@/lib/prisma'
import { TrendingUp, ShoppingBag, Users, Package } from 'lucide-react'
import { RevenueChart, OrdersChart } from '@/components/admin/OverviewChart'

export default async function ReportsPage() {
  const [
    totalRevenue,
    orderStatusCounts,
    topProducts,
    topSellers,
    userGrowth,
  ] = await Promise.all([
    prisma.order.aggregate({ _sum: { totalPrice: true } }),
    prisma.order.groupBy({ by: ['status'], _count: true }),
    prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
    prisma.user.findMany({
      where: { role: 'SELLER' },
      select: {
        name: true,
        products: { select: { orderItems: { select: { price: true, quantity: true } } } },
      },
      take: 5,
    }),
    prisma.user.count(),
  ])

  const revenue = totalRevenue._sum.totalPrice ?? 0
  const statusMap = Object.fromEntries(orderStatusCounts.map((s) => [s.status, s._count]))

  const topProductIds = topProducts.map((p) => p.productId)
  const productNames = await prisma.product.findMany({
    where: { id: { in: topProductIds } },
    select: { id: true, name: true },
  })
  const productNameMap = Object.fromEntries(productNames.map((p) => [p.id, p.name]))

  const sellerRevenues = topSellers.map((s) => ({
    name: s.name,
    revenue: s.products.reduce(
      (sum, prod) => sum + prod.orderItems.reduce((s2, oi) => s2 + oi.price * oi.quantity, 0),
      0,
    ),
  })).sort((a, b) => b.revenue - a.revenue)

  const summaryCards = [
    { label: 'Total Revenue', value: `$${revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
    { label: 'Total Orders', value: orderStatusCounts.reduce((s, c) => s + c._count, 0), icon: ShoppingBag, color: 'text-[#7D9B76] bg-[#7D9B76]/10' },
    { label: 'Total Users', value: userGrowth, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Delivered', value: statusMap['DELIVERED'] ?? 0, icon: Package, color: 'text-[#C8896A] bg-[#C8896A]/10' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#2D1F1A]">Reports & Analytics</h1>
        <p className="text-sm text-[#9E8079] mt-0.5">Overview of marketplace performance</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((c) => {
          const Icon = c.icon
          return (
            <div key={c.label} className="bg-white rounded-2xl border border-[#EAE3DC] p-5 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${c.color}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#2D1F1A]">{c.value}</p>
                <p className="text-sm text-[#9E8079]">{c.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts */}
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

      {/* Order status breakdown + top products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Order status */}
        <div className="bg-white rounded-2xl border border-[#EAE3DC] p-5">
          <h2 className="font-semibold text-[#2D1F1A] mb-4">Order Status Breakdown</h2>
          <div className="space-y-3">
            {(['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const).map((s) => {
              const count = statusMap[s] ?? 0
              const total = orderStatusCounts.reduce((sum, c) => sum + c._count, 0)
              const pct = total ? Math.round((count / total) * 100) : 0
              const colors: Record<string, string> = {
                PENDING: 'bg-amber-400',
                PAID: 'bg-blue-400',
                SHIPPED: 'bg-purple-400',
                DELIVERED: 'bg-[#7D9B76]',
                CANCELLED: 'bg-rose-400',
              }
              return (
                <div key={s}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-[#2D1F1A] font-medium">{s.charAt(0) + s.slice(1).toLowerCase()}</span>
                    <span className="text-[#9E8079] text-xs">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-[#F5F2EF] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${colors[s]}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top products */}
        <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#EAE3DC]">
            <h2 className="font-semibold text-[#2D1F1A]">Top Selling Products</h2>
          </div>
          <ul className="divide-y divide-[#F5EFE6]">
            {topProducts.length === 0 ? (
              <li className="px-5 py-8 text-center text-sm text-[#9E8079]">No sales data yet</li>
            ) : (
              topProducts.map((p, i) => (
                <li key={p.productId} className="px-5 py-3.5 flex items-center gap-3">
                  <span className="text-lg font-bold text-[#EAE3DC] w-6 shrink-0">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#2D1F1A] truncate">{productNameMap[p.productId] ?? '—'}</p>
                  </div>
                  <span className="text-sm font-semibold text-[#C8896A] shrink-0">
                    {p._sum.quantity ?? 0} sold
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {/* Top sellers */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#EAE3DC]">
          <h2 className="font-semibold text-[#2D1F1A]">Top Sellers by Revenue</h2>
        </div>
        <ul className="divide-y divide-[#F5EFE6]">
          {sellerRevenues.length === 0 ? (
            <li className="px-5 py-8 text-center text-sm text-[#9E8079]">No seller data yet</li>
          ) : (
            sellerRevenues.map((s, i) => (
              <li key={s.name} className="px-5 py-3.5 flex items-center gap-4">
                <span className="text-sm font-bold text-[#EAE3DC] w-6 shrink-0">#{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-[#C8896A]/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-[#C8896A]">{s.name.charAt(0).toUpperCase()}</span>
                </div>
                <p className="flex-1 font-medium text-[#2D1F1A]">{s.name}</p>
                <p className="font-bold text-[#2D1F1A]">
                  ${s.revenue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </p>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
