import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Store, MapPin, Clock, Package, Search } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ShopsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string }>
}) {
  const { search, category } = await searchParams

  const where = {
    status: 'ACTIVE' as const,
    ...(category && { businessCategory: category }),
    ...(search && { shopName: { contains: search } }),
  }

  const shops = await prisma.sellerShopProfile.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: {
      seller: {
        select: {
          id: true,
          name: true,
          _count: { select: { products: { where: { isApproved: true, isActive: true } } } },
        },
      },
    },
  })

  const categories = await prisma.sellerShopProfile.findMany({
    where: { status: 'ACTIVE', businessCategory: { not: null } },
    distinct: ['businessCategory'],
    select: { businessCategory: true },
  })

  return (
    <div className="min-h-screen bg-[#FDFAF7]">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#7D9B76]/10 to-[#C8896A]/10 border-b border-[#EAE3DC] py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#2D1F1A] mb-2">
            Artisan Shops
          </h1>
          <p className="text-[#9E8079]">Discover unique handcraft shops from talented artisans</p>

          {/* Search */}
          <form method="GET" className="mt-6 flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8079]" />
              <input
                name="search"
                defaultValue={search}
                placeholder="Search shops..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#EAE3DC] rounded-xl text-sm text-[#2D1F1A] focus:outline-none focus:ring-2 focus:ring-[#7D9B76]/30 focus:border-[#7D9B76]"
              />
            </div>
            <select
              name="category"
              defaultValue={category}
              className="px-3 py-2.5 bg-white border border-[#EAE3DC] rounded-xl text-sm text-[#2D1F1A] focus:outline-none focus:ring-2 focus:ring-[#7D9B76]/30 focus:border-[#7D9B76]"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.businessCategory} value={c.businessCategory!}>
                  {c.businessCategory}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-4 py-2.5 bg-[#7D9B76] text-white text-sm font-semibold rounded-xl hover:bg-[#6a8663] transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {shops.length === 0 ? (
          <div className="text-center py-20">
            <Store size={40} className="mx-auto text-[#C4AEA4] mb-3" />
            <p className="text-[#9E8079] font-medium">No shops found</p>
            <p className="text-sm text-[#C4AEA4] mt-1">Try a different search or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {shops.map((shop) => (
              <Link
                key={shop.id}
                href={`/shop/${shop.id}`}
                className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
              >
                {/* Banner */}
                <div className="relative h-32 bg-gradient-to-r from-[#7D9B76]/15 to-[#C8896A]/15 overflow-hidden">
                  {shop.shopBanner ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={shop.shopBanner}
                      alt={shop.shopName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Store size={32} className="text-[#C4AEA4]" />
                    </div>
                  )}

                  {/* Logo */}
                  <div className="absolute bottom-0 left-4 translate-y-1/2">
                    <div className="w-14 h-14 rounded-xl border-2 border-white bg-white shadow flex items-center justify-center overflow-hidden">
                      {shop.shopLogo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={shop.shopLogo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Store size={22} className="text-[#C8896A]" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="pt-9 px-4 pb-4">
                  <h3 className="font-serif font-bold text-[#2D1F1A] group-hover:text-[#C8896A] transition-colors">
                    {shop.shopName}
                  </h3>
                  {shop.businessCategory && (
                    <span className="inline-block mt-1 text-[10px] font-semibold text-[#7D9B76] bg-[#7D9B76]/10 px-2 py-0.5 rounded-full">
                      {shop.businessCategory}
                    </span>
                  )}
                  {shop.description && (
                    <p className="text-xs text-[#9E8079] mt-2 line-clamp-2">{shop.description}</p>
                  )}

                  <div className="mt-3 flex flex-col gap-1">
                    {shop.address && (
                      <div className="flex items-center gap-1.5 text-xs text-[#9E8079]">
                        <MapPin size={11} className="shrink-0" /> {shop.address}
                      </div>
                    )}
                    {(shop.openingTime || shop.closingTime) && (
                      <div className="flex items-center gap-1.5 text-xs text-[#9E8079]">
                        <Clock size={11} className="shrink-0" />
                        {shop.openingTime} – {shop.closingTime}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-[#9E8079]">
                      <Package size={11} className="shrink-0" />
                      {shop.seller._count.products} product{shop.seller._count.products !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
