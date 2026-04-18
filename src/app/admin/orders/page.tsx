import { prisma } from '@/lib/prisma'
import { ShoppingBag } from 'lucide-react'
import StatusSelect from '@/components/admin/StatusSelect'

const STATUS_OPTIONS = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams

  const orders = await prisma.order.findMany({
    where: status ? { status: status as (typeof STATUS_OPTIONS)[number] } : {},
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      totalPrice: true,
      status: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
      items: { select: { quantity: true, product: { select: { name: true } } } },
    },
  })

  const counts = await prisma.order.groupBy({ by: ['status'], _count: true })
  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#2D1F1A]">Orders</h1>
        <p className="text-sm text-[#9E8079] mt-0.5">{orders.length} orders shown</p>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        <a
          href="?"
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            !status ? 'bg-[#2D1F1A] text-white' : 'bg-white border border-[#EAE3DC] text-[#6B4C3B] hover:bg-[#F5EFE6]'
          }`}
        >
          All
        </a>
        {STATUS_OPTIONS.map((s) => (
          <a
            key={s}
            href={`?status=${s}`}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              status === s
                ? 'bg-[#C8896A] text-white'
                : 'bg-white border border-[#EAE3DC] text-[#6B4C3B] hover:bg-[#F5EFE6]'
            }`}
          >
            {s.charAt(0) + s.slice(1).toLowerCase()} {countMap[s] ? `(${countMap[s]})` : ''}
          </a>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F5F2EF] text-left">
                <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Order</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Customer</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Items</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Total</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Date</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5EFE6]">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-[#9E8079]">
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#FDF8F4] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#7D9B76]/10 flex items-center justify-center shrink-0">
                          <ShoppingBag size={14} className="text-[#7D9B76]" />
                        </div>
                        <span className="font-mono text-xs text-[#9E8079]">#{order.id}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-[#2D1F1A]">{order.user.name}</p>
                      <p className="text-xs text-[#9E8079]">{order.user.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-[#9E8079] text-xs">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-[#2D1F1A]">
                      ${order.totalPrice.toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5 text-[#9E8079] text-xs">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusSelect orderId={order.id} currentStatus={order.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
