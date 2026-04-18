import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { ShoppingBag } from 'lucide-react'

const STATUS_OPTIONS = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  PAID: 'bg-blue-50 text-blue-700',
  SHIPPED: 'bg-purple-50 text-purple-700',
  DELIVERED: 'bg-[#7D9B76]/10 text-[#7D9B76]',
  CANCELLED: 'bg-rose-50 text-rose-600',
}

export default async function SellerOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const session = await verifySession()
  const { status } = await searchParams

  const orders = await prisma.order.findMany({
    where: {
      items: { some: { product: { sellerId: session.userId } } },
      ...(status ? { status: status as (typeof STATUS_OPTIONS)[number] } : {}),
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      totalPrice: true,
      status: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
      items: {
        where: { product: { sellerId: session.userId } },
        select: {
          quantity: true,
          price: true,
          product: { select: { name: true } },
        },
      },
    },
  })

  const counts = await prisma.order.groupBy({
    by: ['status'],
    where: { items: { some: { product: { sellerId: session.userId } } } },
    _count: true,
  })
  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#2D1F1A]">Orders</h1>
        <p className="text-sm text-[#9E8079] mt-0.5">Orders containing your products</p>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        <a
          href="?"
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            !status ? 'bg-[#2D1F1A] text-white' : 'bg-white border border-[#EAE3DC] text-[#6B4C3B] hover:bg-[#F5EFE6]'
          }`}
        >
          All ({counts.reduce((s, c) => s + c._count, 0)})
        </a>
        {STATUS_OPTIONS.map((s) => (
          <a
            key={s}
            href={`?status=${s}`}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              status === s
                ? 'bg-[#7D9B76] text-white'
                : 'bg-white border border-[#EAE3DC] text-[#6B4C3B] hover:bg-[#F5EFE6]'
            }`}
          >
            {s.charAt(0) + s.slice(1).toLowerCase()} {countMap[s] ? `(${countMap[s]})` : '(0)'}
          </a>
        ))}
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#EAE3DC] py-16 text-center">
            <ShoppingBag size={32} className="text-[#C4AEA4] mx-auto mb-3" />
            <p className="font-semibold text-[#2D1F1A]">No orders found</p>
            <p className="text-sm text-[#9E8079] mt-1">Orders for your products will appear here</p>
          </div>
        ) : (
          orders.map((order) => {
            const sellerTotal = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
                <div className="px-5 py-4 border-b border-[#EAE3DC] flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#7D9B76]/10 flex items-center justify-center">
                      <ShoppingBag size={16} className="text-[#7D9B76]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#2D1F1A]">{order.user.name}</p>
                      <p className="text-xs text-[#9E8079]">{order.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-[#9E8079]">#{order.id}</span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                </div>

                <div className="px-5 py-3 divide-y divide-[#F5EFE6]">
                  {order.items.map((item, i) => (
                    <div key={i} className="py-2.5 flex items-center justify-between gap-2">
                      <p className="text-sm text-[#2D1F1A] truncate">{item.product.name}</p>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium text-[#2D1F1A]">×{item.quantity}</p>
                        <p className="text-xs text-[#9E8079]">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-5 py-3 bg-[#F5F2EF] flex items-center justify-between">
                  <p className="text-xs text-[#9E8079]">{new Date(order.createdAt).toLocaleDateString()}</p>
                  <p className="text-sm font-bold text-[#2D1F1A]">
                    Your earnings: <span className="text-[#7D9B76]">${sellerTotal.toFixed(2)}</span>
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
