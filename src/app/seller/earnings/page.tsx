import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { EarningsAreaChart, EarningsBarChart } from '@/components/seller/SellerEarningsChart'
import { TrendingUp, ShoppingBag, Package, DollarSign } from 'lucide-react'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default async function EarningsPage() {
  const session = await verifySession()

  const now = new Date()
  const sevenMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)

  const [allItems, recentItems, topProducts] = await Promise.all([
    prisma.orderItem.findMany({
      where: { product: { sellerId: session.userId } },
      select: { price: true, quantity: true },
    }),
    prisma.orderItem.findMany({
      where: {
        product: { sellerId: session.userId },
        order: { createdAt: { gte: sevenMonthsAgo } },
      },
      select: {
        price: true,
        quantity: true,
        order: { select: { createdAt: true } },
      },
    }),
    prisma.orderItem.groupBy({
      by: ['productId'],
      where: { product: { sellerId: session.userId } },
      _sum: { quantity: true, price: true },
      orderBy: { _sum: { price: 'desc' } },
      take: 5,
    }),
  ])

  const totalEarnings = allItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const totalUnitsSold = allItems.reduce((sum, i) => sum + i.quantity, 0)

  // Build monthly chart data
  const monthlyMap: Record<string, { revenue: number; orders: number }> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    monthlyMap[key] = { revenue: 0, orders: 0 }
  }
  recentItems.forEach((item) => {
    const d = new Date(item.order.createdAt)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (monthlyMap[key]) {
      monthlyMap[key].revenue += item.price * item.quantity
      monthlyMap[key].orders += item.quantity
    }
  })
  const chartData = Object.entries(monthlyMap).map(([key, val]) => {
    const [year, month] = key.split('-').map(Number)
    return { month: MONTHS[month], revenue: Math.round(val.revenue * 100) / 100, orders: val.orders }
  })

  // Fetch product names for top products
  const productIds = topProducts.map((p) => p.productId)
  const productNames = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  })
  const nameMap = Object.fromEntries(productNames.map((p) => [p.id, p.name]))

  const summaryCards = [
    { label: 'Total Earnings', value: `$${totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-[#7D9B76] bg-[#7D9B76]/10' },
    { label: 'Units Sold', value: totalUnitsSold, icon: Package, color: 'text-[#C8896A] bg-[#C8896A]/10' },
    { label: 'Avg per Item', value: totalUnitsSold > 0 ? `$${(totalEarnings / totalUnitsSold).toFixed(2)}` : '$0', icon: TrendingUp, color: 'text-blue-600 bg-blue-50' },
    { label: 'This Month', value: `$${chartData[chartData.length - 1]?.revenue.toFixed(2) ?? '0.00'}`, icon: ShoppingBag, color: 'text-purple-600 bg-purple-50' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#2D1F1A]">Earnings</h1>
        <p className="text-sm text-[#9E8079] mt-0.5">Your revenue overview and breakdown</p>
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
          <EarningsAreaChart data={chartData} />
        </div>
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#EAE3DC] p-5">
          <h2 className="font-semibold text-[#2D1F1A] mb-1">Units Sold</h2>
          <p className="text-xs text-[#9E8079] mb-4">Monthly breakdown</p>
          <EarningsBarChart data={chartData} />
        </div>
      </div>

      {/* Top products by revenue */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#EAE3DC]">
          <h2 className="font-semibold text-[#2D1F1A]">Top Earning Products</h2>
        </div>
        {topProducts.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-[#9E8079]">No sales data yet</p>
        ) : (
          <ul className="divide-y divide-[#F5EFE6]">
            {topProducts.map((p, i) => {
              const revenue = (p._sum.price ?? 0) * 1
              const units = p._sum.quantity ?? 0
              return (
                <li key={p.productId} className="px-5 py-3.5 flex items-center gap-4">
                  <span className="text-sm font-bold text-[#EAE3DC] w-5 shrink-0">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#2D1F1A] truncate">{nameMap[p.productId] ?? '—'}</p>
                    <p className="text-xs text-[#9E8079]">{units} unit{units !== 1 ? 's' : ''} sold</p>
                  </div>
                  <p className="font-bold text-[#7D9B76] shrink-0">${(p._sum.price ?? 0).toFixed(2)}</p>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
