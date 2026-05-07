import { requireAdmin } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/currency'
import Link from 'next/link'
import { Truck, Package } from 'lucide-react'
import AdminDeliveryActions from './AdminDeliveryActions'

export const dynamic = 'force-dynamic'

const STATUS_BADGE: Record<string, string> = {
  PENDING:          'bg-gray-50 text-gray-600 border-gray-200',
  CONFIRMED:        'bg-blue-50 text-blue-700 border-blue-200',
  PACKED:           'bg-amber-50 text-amber-700 border-amber-200',
  SHIPPED:          'bg-purple-50 text-purple-700 border-purple-200',
  OUT_FOR_DELIVERY: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  DELIVERED:        'bg-green-50 text-green-700 border-green-200',
  CANCELLED:        'bg-rose-50 text-rose-700 border-rose-200',
  RETURNED:         'bg-orange-50 text-orange-700 border-orange-200',
}

export default async function AdminDeliveryTrackingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  await requireAdmin()
  const { status, page: pageStr } = await searchParams
  const page = Math.max(1, Number(pageStr ?? '1'))
  const limit = 20
  const skip = (page - 1) * limit

  const where = {
    ...(status && {
      status: status as
        | 'PENDING' | 'CONFIRMED' | 'PACKED' | 'SHIPPED'
        | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'RETURNED',
    }),
  }

  const [records, total] = await Promise.all([
    prisma.deliveryTracking.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            totalPrice: true,
            customerName: true,
            createdAt: true,
            user: { select: { name: true, email: true } },
          },
        },
        updatedBy: { select: { name: true } },
      },
    }),
    prisma.deliveryTracking.count({ where }),
  ])

  const statusList = [
    'PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED',
    'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED',
  ]
  const pages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#2D1F1A]">Delivery Tracking</h1>
        <p className="text-sm text-[#9E8079] mt-0.5">Monitor and update delivery status for all orders.</p>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        <a
          href="?"
          className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors ${!status ? 'bg-[#2D1F1A] text-white border-[#2D1F1A]' : 'bg-white text-[#9E8079] border-[#EAE3DC] hover:border-[#2D1F1A] hover:text-[#2D1F1A]'}`}
        >
          All
        </a>
        {statusList.map((s) => (
          <a
            key={s}
            href={`?status=${s}`}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors ${status === s ? 'bg-[#2D1F1A] text-white border-[#2D1F1A]' : 'bg-white text-[#9E8079] border-[#EAE3DC] hover:border-[#2D1F1A] hover:text-[#2D1F1A]'}`}
          >
            {s.replace(/_/g, ' ')}
          </a>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#EAE3DC] flex items-center gap-2">
          <Truck size={16} className="text-[#C8896A]" />
          <h2 className="font-semibold text-[#2D1F1A]">Delivery Records</h2>
          <span className="ml-auto text-xs text-[#9E8079]">{total} record{total !== 1 ? 's' : ''}</span>
        </div>

        {records.length === 0 ? (
          <div className="py-16 text-center">
            <Package size={36} className="mx-auto text-[#C4AEA4] mb-3" />
            <p className="text-sm text-[#9E8079]">No records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F5F2EF] text-left">
                  {['Order', 'Customer', 'Amount', 'Status', 'Location', 'Last Updated By', 'Est. Delivery', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5EFE6]">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-[#FDF8F4] transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders`} className="font-bold text-[#C8896A] hover:underline">
                        #{r.orderId}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#2D1F1A]">{r.order.user.name}</p>
                      <p className="text-xs text-[#9E8079]">{r.order.user.email}</p>
                    </td>
                    <td className="px-4 py-3 font-bold text-[#2D1F1A] whitespace-nowrap">
                      {formatPrice(r.order.totalPrice)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${STATUS_BADGE[r.status] ?? ''}`}>
                        {r.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#9E8079]">
                      {r.location ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#9E8079]">
                      {r.updatedBy?.name ?? 'System'}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#9E8079] whitespace-nowrap">
                      {r.estimatedDeliveryDate
                        ? new Date(r.estimatedDeliveryDate).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <AdminDeliveryActions orderId={r.orderId} currentStatus={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div className="px-5 py-4 border-t border-[#EAE3DC] flex items-center justify-between">
            <p className="text-xs text-[#9E8079]">Page {page} of {pages}</p>
            <div className="flex gap-2">
              {page > 1 && (
                <a href={`?page=${page - 1}${status ? `&status=${status}` : ''}`}
                  className="px-3 py-1.5 text-xs font-medium bg-[#F5F2EF] text-[#2D1F1A] rounded-lg hover:bg-[#EAE3DC] transition-colors">
                  Previous
                </a>
              )}
              {page < pages && (
                <a href={`?page=${page + 1}${status ? `&status=${status}` : ''}`}
                  className="px-3 py-1.5 text-xs font-medium bg-[#C8896A] text-white rounded-lg hover:bg-[#b3775a] transition-colors">
                  Next
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
