import { requireSeller } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/currency'
import { Receipt, TrendingUp, CreditCard, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

const STATUS_BADGE: Record<string, string> = {
  SUCCESS:  'bg-green-50 text-green-700 border-green-200',
  PENDING:  'bg-amber-50 text-amber-700 border-amber-200',
  FAILED:   'bg-rose-50 text-rose-700 border-rose-200',
  REFUNDED: 'bg-purple-50 text-purple-700 border-purple-200',
}

export default async function SellerTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; method?: string; page?: string }>
}) {
  const session = await requireSeller()
  const { status, method, page: pageStr } = await searchParams
  const page = Math.max(1, Number(pageStr ?? '1'))
  const limit = 20
  const skip = (page - 1) * limit

  // Find seller's order IDs
  const sellerOrderIds = await prisma.orderItem.findMany({
    where: { product: { sellerId: session.userId } },
    select: { orderId: true },
    distinct: ['orderId'],
  })
  const orderIds = sellerOrderIds.map((o) => o.orderId)

  const where = {
    orderId: { in: orderIds },
    ...(status && { paymentStatus: status as 'SUCCESS' | 'PENDING' | 'FAILED' | 'REFUNDED' }),
    ...(method && { paymentMethod: method }),
  }

  const [transactions, total] = await Promise.all([
    prisma.paymentTransaction.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { name: true, email: true } },
        order: {
          select: {
            id: true,
            status: true,
            items: {
              where: { product: { sellerId: session.userId } },
              select: {
                quantity: true,
                price: true,
                product: { select: { name: true } },
              },
            },
          },
        },
      },
    }),
    prisma.paymentTransaction.count({ where }),
  ])

  const totalEarnings = transactions
    .filter((t) => t.paymentStatus === 'SUCCESS')
    .reduce((s, t) => s + t.amount, 0)

  const pages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#2D1F1A]">Transactions</h1>
        <p className="text-sm text-[#9E8079] mt-0.5">Payment history for your shop orders.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={<Receipt size={20} />} label="Total Transactions" value={String(total)} color="bg-[#C8896A]/10 text-[#C8896A]" />
        <StatCard icon={<TrendingUp size={20} />} label="Total Earnings" value={formatPrice(totalEarnings)} color="bg-[#7D9B76]/10 text-[#7D9B76]" />
        <StatCard icon={<Clock size={20} />} label="Pending" value={String(transactions.filter((t) => t.paymentStatus === 'PENDING').length)} color="bg-amber-50 text-amber-600" />
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3 items-center">
        <select
          name="status"
          defaultValue={status ?? ''}
          className="px-3 py-2 text-sm border border-[#EAE3DC] bg-white rounded-xl text-[#2D1F1A] focus:outline-none focus:ring-2 focus:ring-[#7D9B76]/30"
        >
          <option value="">All Statuses</option>
          <option value="SUCCESS">Success</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>
        <select
          name="method"
          defaultValue={method ?? ''}
          className="px-3 py-2 text-sm border border-[#EAE3DC] bg-white rounded-xl text-[#2D1F1A] focus:outline-none focus:ring-2 focus:ring-[#7D9B76]/30"
        >
          <option value="">All Methods</option>
          <option value="STRIPE">Card (Stripe)</option>
          <option value="COD">Cash on Delivery</option>
        </select>
        <button type="submit" className="px-4 py-2 bg-[#7D9B76] text-white text-sm font-semibold rounded-xl hover:bg-[#6a8663] transition-colors">
          Filter
        </button>
      </form>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#EAE3DC] flex items-center gap-2">
          <CreditCard size={16} className="text-[#C8896A]" />
          <h2 className="font-semibold text-[#2D1F1A]">Transaction History</h2>
          <span className="ml-auto text-xs text-[#9E8079]">{total} record{total !== 1 ? 's' : ''}</span>
        </div>

        {transactions.length === 0 ? (
          <div className="py-16 text-center">
            <Receipt size={36} className="mx-auto text-[#C4AEA4] mb-3" />
            <p className="text-sm text-[#9E8079]">No transactions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F5F2EF] text-left">
                  {['Transaction ID', 'Order', 'Customer', 'Items', 'Amount', 'Method', 'Status', 'Date'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5EFE6]">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-[#FDF8F4] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-[#9E8079]">{t.transactionId.slice(0, 8)}…</td>
                    <td className="px-4 py-3 font-semibold text-[#2D1F1A]">#{t.orderId}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#2D1F1A]">{t.customer.name}</p>
                      <p className="text-xs text-[#9E8079]">{t.customer.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-[#9E8079] max-w-[140px] truncate">
                        {t.order.items.map((i) => `${i.product.name} ×${i.quantity}`).join(', ')}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-bold text-[#2D1F1A] whitespace-nowrap">{formatPrice(t.amount)}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-[#9E8079]">
                        {t.paymentMethod === 'STRIPE' ? 'Card' : 'COD'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_BADGE[t.paymentStatus] ?? 'bg-gray-50 text-gray-600'}`}>
                        {t.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#9E8079] whitespace-nowrap">
                      {new Date(t.createdAt).toLocaleDateString('en-PK', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="px-5 py-4 border-t border-[#EAE3DC] flex items-center justify-between">
            <p className="text-xs text-[#9E8079]">Page {page} of {pages}</p>
            <div className="flex gap-2">
              {page > 1 && (
                <a href={`?page=${page - 1}${status ? `&status=${status}` : ''}${method ? `&method=${method}` : ''}`}
                  className="px-3 py-1.5 text-xs font-medium bg-[#F5F2EF] text-[#2D1F1A] rounded-lg hover:bg-[#EAE3DC] transition-colors">
                  Previous
                </a>
              )}
              {page < pages && (
                <a href={`?page=${page + 1}${status ? `&status=${status}` : ''}${method ? `&method=${method}` : ''}`}
                  className="px-3 py-1.5 text-xs font-medium bg-[#7D9B76] text-white rounded-lg hover:bg-[#6a8663] transition-colors">
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

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#EAE3DC] p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>{icon}</div>
      <div>
        <p className="text-xl font-bold text-[#2D1F1A]">{value}</p>
        <p className="text-xs text-[#9E8079]">{label}</p>
      </div>
    </div>
  )
}
