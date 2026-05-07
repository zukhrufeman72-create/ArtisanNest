import { requireCustomer } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/currency'
import Link from 'next/link'
import { Receipt, CreditCard, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

const STATUS_BADGE: Record<string, { label: string; class: string }> = {
  SUCCESS:  { label: 'Paid',     class: 'bg-green-50 text-green-700 border-green-200' },
  PENDING:  { label: 'Pending',  class: 'bg-amber-50 text-amber-700 border-amber-200' },
  FAILED:   { label: 'Failed',   class: 'bg-rose-50 text-rose-700 border-rose-200' },
  REFUNDED: { label: 'Refunded', class: 'bg-purple-50 text-purple-700 border-purple-200' },
}

export default async function CustomerTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; method?: string; page?: string }>
}) {
  const session = await requireCustomer()
  const { status, method, page: pageStr } = await searchParams
  const page = Math.max(1, Number(pageStr ?? '1'))
  const limit = 15
  const skip = (page - 1) * limit

  const where = {
    customerId: session.userId,
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
        order: {
          select: {
            id: true,
            status: true,
            items: {
              take: 1,
              include: {
                product: {
                  select: {
                    name: true,
                    image: true,
                    seller: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.paymentTransaction.count({ where }),
  ])

  const pages = Math.ceil(total / limit)
  const totalSpent = transactions
    .filter((t) => t.paymentStatus === 'SUCCESS')
    .reduce((s, t) => s + t.amount, 0)

  return (
    <div className="min-h-screen bg-[#FDFAF7] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#2D1F1A]">Transaction History</h1>
          <p className="text-sm text-[#9E8079] mt-0.5">All your payment records in one place.</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-[#EAE3DC] p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#C8896A]/10 flex items-center justify-center">
              <Receipt size={20} className="text-[#C8896A]" />
            </div>
            <div>
              <p className="text-xl font-bold text-[#2D1F1A]">{total}</p>
              <p className="text-xs text-[#9E8079]">Total Transactions</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-[#EAE3DC] p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#7D9B76]/10 flex items-center justify-center">
              <CreditCard size={20} className="text-[#7D9B76]" />
            </div>
            <div>
              <p className="text-xl font-bold text-[#2D1F1A]">{formatPrice(totalSpent)}</p>
              <p className="text-xs text-[#9E8079]">Total Paid</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <form method="GET" className="flex flex-wrap gap-3">
          <select
            name="status"
            defaultValue={status ?? ''}
            className="px-3 py-2 text-sm border border-[#EAE3DC] bg-white rounded-xl text-[#2D1F1A] focus:outline-none focus:ring-2 focus:ring-[#7D9B76]/30"
          >
            <option value="">All Statuses</option>
            <option value="SUCCESS">Paid</option>
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
            Apply
          </button>
        </form>

        {/* Cards */}
        {transactions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#EAE3DC] py-16 text-center">
            <Receipt size={36} className="mx-auto text-[#C4AEA4] mb-3" />
            <p className="text-sm text-[#9E8079]">No transactions found</p>
            <Link href="/orders" className="mt-2 inline-block text-sm text-[#7D9B76] font-medium hover:underline">
              View Orders
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((t) => {
              const badge = STATUS_BADGE[t.paymentStatus]
              const firstItem = t.order.items[0]
              return (
                <div
                  key={t.id}
                  className="bg-white rounded-2xl border border-[#EAE3DC] p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {/* Product Image */}
                    <div className="w-14 h-14 rounded-xl bg-[#F5F2EF] overflow-hidden shrink-0">
                      {firstItem?.product.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={firstItem.product.image ?? undefined} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Receipt size={20} className="text-[#C4AEA4]" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <p className="font-semibold text-[#2D1F1A]">
                            {firstItem?.product.name ?? `Order #${t.orderId}`}
                          </p>
                          <p className="text-xs text-[#9E8079] mt-0.5">
                            From {firstItem?.product.seller.name ?? '—'} · Order #{t.orderId}
                          </p>
                        </div>
                        <span className={`shrink-0 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge?.class ?? ''}`}>
                          {badge?.label ?? t.paymentStatus}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-4 text-xs text-[#9E8079]">
                          <span className="font-mono">{t.transactionId.slice(0, 12)}…</span>
                          <span>{t.paymentMethod === 'STRIPE' ? 'Card' : 'Cash on Delivery'}</span>
                          <span>{new Date(t.createdAt).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-base font-bold text-[#2D1F1A]">{formatPrice(t.amount)}</span>
                          <Link
                            href={`/orders`}
                            className="flex items-center gap-1 text-xs text-[#7D9B76] font-medium hover:underline"
                          >
                            View Order <ArrowRight size={12} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex justify-center gap-2">
            {page > 1 && (
              <a href={`?page=${page - 1}${status ? `&status=${status}` : ''}${method ? `&method=${method}` : ''}`}
                className="px-4 py-2 text-sm font-medium bg-white border border-[#EAE3DC] text-[#2D1F1A] rounded-xl hover:bg-[#F5F2EF] transition-colors">
                Previous
              </a>
            )}
            <span className="px-4 py-2 text-sm text-[#9E8079]">{page} / {pages}</span>
            {page < pages && (
              <a href={`?page=${page + 1}${status ? `&status=${status}` : ''}${method ? `&method=${method}` : ''}`}
                className="px-4 py-2 text-sm font-medium bg-[#7D9B76] text-white rounded-xl hover:bg-[#6a8663] transition-colors">
                Next
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
