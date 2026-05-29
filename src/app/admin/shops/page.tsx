import { requireAdmin } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { Store, Package, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'
import AdminShopActions from './AdminShopActions'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

const STATUS_BADGE: Record<string, string> = {
  PENDING:  'bg-amber-50 text-amber-700 border-amber-200',
  ACTIVE:   'bg-green-50 text-green-700 border-green-200',
  BLOCKED:  'bg-rose-50 text-rose-700 border-rose-200',
  INACTIVE: 'bg-gray-50 text-gray-600 border-gray-200',
}

export default async function AdminShopsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>
}) {
  await requireAdmin()
  const { status, search, page: pageStr } = await searchParams
  const page = Math.max(1, Number(pageStr ?? '1'))
  const limit = 20
  const skip = (page - 1) * limit

  const where = {
    ...(status && { status: status as 'PENDING' | 'ACTIVE' | 'BLOCKED' | 'INACTIVE' }),
    ...(search && { shopName: { contains: search } }),
  }

  const [shops, total, statusCounts] = await Promise.all([
    prisma.sellerShopProfile.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        seller: {
          select: {
            id: true, name: true, email: true,
            _count: { select: { products: true } },
          },
        },
      },
    }),
    prisma.sellerShopProfile.count({ where }),
    prisma.sellerShopProfile.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
  ])

  const counts = Object.fromEntries(statusCounts.map((s) => [s.status, s._count._all]))
  const pages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#2D1F1A]">Seller Shops</h1>
        <p className="text-sm text-[#9E8079] mt-0.5">Approve, manage, and monitor all seller shops.</p>
      </div>

      {/* Status pills */}
      <div className="flex flex-wrap gap-3">
        {[
          { key: '', label: 'All', icon: Store },
          { key: 'PENDING', label: 'Pending', icon: Clock },
          { key: 'ACTIVE', label: 'Active', icon: CheckCircle },
          { key: 'BLOCKED', label: 'Blocked', icon: XCircle },
          { key: 'INACTIVE', label: 'Inactive', icon: AlertTriangle },
        ].map(({ key, label, icon: Icon }) => (
          <a
            key={key}
            href={`?status=${key}${search ? `&search=${search}` : ''}`}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
              (status ?? '') === key
                ? 'bg-[#2D1F1A] text-white border-[#2D1F1A]'
                : 'bg-white text-[#9E8079] border-[#EAE3DC] hover:border-[#2D1F1A] hover:text-[#2D1F1A]'
            }`}
          >
            <Icon size={13} />
            {label}
            {key && counts[key] !== undefined && (
              <span className="text-[10px] opacity-70">({counts[key]})</span>
            )}
          </a>
        ))}
      </div>

      {/* Search */}
      <form method="GET" className="flex gap-3">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search by shop name..."
          className="flex-1 max-w-xs px-3 py-2 text-sm border border-[#EAE3DC] bg-white rounded-xl text-[#2D1F1A] focus:outline-none focus:ring-2 focus:ring-[#C8896A]/30 focus:border-[#C8896A]"
        />
        {status && <input type="hidden" name="status" value={status} />}
        <button type="submit" className="px-4 py-2 bg-[#C8896A] text-white text-sm font-semibold rounded-xl hover:bg-[#b3775a] transition-colors">
          Search
        </button>
      </form>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#EAE3DC] flex items-center gap-2">
          <Store size={16} className="text-[#C8896A]" />
          <h2 className="font-semibold text-[#2D1F1A]">All Shops</h2>
          <span className="ml-auto text-xs text-[#9E8079]">{total} shop{total !== 1 ? 's' : ''}</span>
        </div>

        {shops.length === 0 ? (
          <div className="py-16 text-center">
            <Store size={36} className="mx-auto text-[#C4AEA4] mb-3" />
            <p className="text-sm text-[#9E8079]">No shops found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F5F2EF] text-left">
                  {['Shop', 'Seller', 'Category', 'Products', 'Status', 'Created', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5EFE6]">
                {shops.map((shop) => (
                  <tr key={shop.id} className="hover:bg-[#FDF8F4] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-9 h-9 rounded-xl bg-[#F5F2EF] flex items-center justify-center overflow-hidden shrink-0">
                          {shop.shopLogo ? (
                            <Image src={shop.shopLogo} alt="" fill sizes="36px" className="object-cover" />
                          ) : (
                            <Store size={16} className="text-[#C8896A]" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-[#2D1F1A]">{shop.shopName}</p>
                          {shop.address && (
                            <p className="text-xs text-[#9E8079] max-w-30 truncate">{shop.address}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#2D1F1A]">{shop.seller.name}</p>
                      <p className="text-xs text-[#9E8079]">{shop.seller.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#9E8079]">
                      {shop.businessCategory || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-[#9E8079]">
                        <Package size={12} /> {shop.seller._count.products}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_BADGE[shop.status]}`}>
                        {shop.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#9E8079] whitespace-nowrap">
                      {new Date(shop.createdAt).toLocaleDateString('en-PK', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <AdminShopActions shopId={shop.id} currentStatus={shop.status} />
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
                <a href={`?page=${page - 1}${status ? `&status=${status}` : ''}${search ? `&search=${search}` : ''}`}
                  className="px-3 py-1.5 text-xs font-medium bg-[#F5F2EF] text-[#2D1F1A] rounded-lg hover:bg-[#EAE3DC] transition-colors">
                  Previous
                </a>
              )}
              {page < pages && (
                <a href={`?page=${page + 1}${status ? `&status=${status}` : ''}${search ? `&search=${search}` : ''}`}
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
