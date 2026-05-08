import Link from 'next/link'
import { requireSeller } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { ClipboardList } from 'lucide-react'
import SellerOrdersClient from './SellerOrdersClient'
import type { SerializedOrder } from './types'

export default async function SellerCustomOrdersPage() {
  await requireSeller()

  const rawOrders = await prisma.customOrder.findMany({
    select: {
      id: true,
      title: true,
      status: true,
      paymentStatus: true,
      estimatedPrice: true,
      budget: true,
      sellerId: true,
      createdAt: true,
      customer: { select: { name: true, email: true } },
      images: {
        where: { imageType: 'reference' },
        take: 1,
        select: { url: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const orders: SerializedOrder[] = rawOrders.map((o) => ({
    id: o.id,
    title: o.title,
    status: o.status,
    paymentStatus: o.paymentStatus,
    estimatedPrice: o.estimatedPrice,
    budget: o.budget,
    createdAt: o.createdAt.toISOString(),
    customerName: o.customer.name,
    customerEmail: o.customer.email,
    thumbUrl: o.images[0]?.url ?? null,
    isAssigned: o.sellerId !== null,
  }))

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'PENDING').length,
    inProgress: orders.filter((o) => o.status === 'IN_PROGRESS').length,
    completed: orders.filter((o) => ['COMPLETED', 'DELIVERED'].includes(o.status)).length,
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[#7D9B76]/20 flex items-center justify-center">
          <ClipboardList size={20} className="text-[#7D9B76]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#2D1F1A]">Custom Orders</h1>
          <p className="text-sm text-[#9E8079]">Review and manage customer custom requests</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total', value: stats.total, color: 'text-[#2D1F1A]', bg: 'bg-white' },
          { label: 'Pending', value: stats.pending, color: 'text-amber-700', bg: 'bg-amber-50' },
          { label: 'In Progress', value: stats.inProgress, color: 'text-[#C8896A]', bg: 'bg-[#FDF8F3]' },
          { label: 'Completed', value: stats.completed, color: 'text-emerald-700', bg: 'bg-emerald-50' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl border border-[#EAE3DC] p-4 text-center`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-[#9E8079] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Client-side filterable list */}
      <SellerOrdersClient orders={orders} />
    </div>
  )
}
