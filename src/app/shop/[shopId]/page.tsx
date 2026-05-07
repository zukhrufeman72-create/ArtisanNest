import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatPrice } from '@/lib/currency'
import {
  Store, MapPin, Phone, Clock, Package,
  Star, ArrowLeft, ShoppingBag,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ShopDetailPage({
  params,
}: {
  params: Promise<{ shopId: string }>
}) {
  const { shopId } = await params
  const id = Number(shopId)

  const shop = await prisma.sellerShopProfile.findFirst({
    where: { id, status: 'ACTIVE' },
    include: {
      seller: {
        select: {
          id: true,
          name: true,
          createdAt: true,
          products: {
            where: { isApproved: true, isActive: true },
            orderBy: { createdAt: 'desc' },
            take: 24,
            select: {
              id: true, name: true, shortDescription: true,
              price: true, discountPrice: true, stock: true, image: true,
              category: { select: { name: true } },
              reviews: { select: { rating: true } },
            },
          },
        },
      },
    },
  })

  if (!shop) notFound()

  const { seller } = shop
  const totalProducts = seller.products.length

  return (
    <div className="min-h-screen bg-[#FDFAF7]">
      {/* Back */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <Link
          href="/shops"
          className="inline-flex items-center gap-2 text-sm text-[#9E8079] hover:text-[#2D1F1A] transition-colors"
        >
          <ArrowLeft size={15} /> Back to Shops
        </Link>
      </div>

      {/* Banner */}
      <div className="relative h-52 sm:h-64 bg-gradient-to-r from-[#7D9B76]/20 to-[#C8896A]/20 mt-3">
        {shop.shopBanner ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shop.shopBanner} alt={shop.shopName} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Store size={48} className="text-[#C4AEA4]" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* Profile Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="relative -mt-10 mb-6 flex items-end gap-5">
          <div className="w-20 h-20 rounded-2xl border-4 border-white bg-white shadow-md flex items-center justify-center overflow-hidden shrink-0">
            {shop.shopLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shop.shopLogo} alt="" className="w-full h-full object-cover" />
            ) : (
              <Store size={30} className="text-[#C8896A]" />
            )}
          </div>

          <div className="pb-1 flex-1 min-w-0">
            <h1 className="text-2xl font-serif font-bold text-white drop-shadow">{shop.shopName}</h1>
            {shop.businessCategory && (
              <span className="inline-block text-[11px] font-semibold text-white/90 bg-white/20 backdrop-blur px-2 py-0.5 rounded-full mt-1">
                {shop.businessCategory}
              </span>
            )}
          </div>
        </div>

        {/* Info Row */}
        <div className="bg-white rounded-2xl border border-[#EAE3DC] p-5 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <InfoItem icon={<Package size={15} className="text-[#C8896A]" />} label="Products" value={`${totalProducts}`} />
            {shop.address && (
              <InfoItem icon={<MapPin size={15} className="text-[#7D9B76]" />} label="Location" value={shop.address} />
            )}
            {shop.contactNumber && (
              <InfoItem icon={<Phone size={15} className="text-blue-500" />} label="Contact" value={shop.contactNumber} />
            )}
            {(shop.openingTime || shop.closingTime) && (
              <InfoItem icon={<Clock size={15} className="text-amber-500" />} label="Hours" value={`${shop.openingTime ?? '?'} – ${shop.closingTime ?? '?'}`} />
            )}
          </div>

          {shop.description && (
            <p className="text-sm text-[#9E8079] mt-4 pt-4 border-t border-[#EAE3DC]">
              {shop.description}
            </p>
          )}
        </div>

        {/* Products Grid */}
        <h2 className="text-lg font-serif font-bold text-[#2D1F1A] mb-4 flex items-center gap-2">
          <ShoppingBag size={18} className="text-[#C8896A]" /> Products from {shop.shopName}
        </h2>

        {seller.products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#EAE3DC] py-16 text-center">
            <Package size={36} className="mx-auto text-[#C4AEA4] mb-3" />
            <p className="text-sm text-[#9E8079]">No products available yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-10">
            {seller.products.map((product) => {
              const avgRating = product.reviews.length
                ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
                : null
              return (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                >
                  <div className="relative h-40 bg-[#F5F2EF] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.image ?? undefined}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.discountPrice && (
                      <span className="absolute top-2 left-2 text-[10px] font-bold text-white bg-rose-500 px-1.5 py-0.5 rounded-full">
                        SALE
                      </span>
                    )}
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <span className="text-xs font-bold text-white bg-black/50 px-2 py-1 rounded-full">Out of Stock</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <span className="text-[9px] font-semibold text-[#7D9B76] uppercase tracking-wide">
                      {product.category.name}
                    </span>
                    <h3 className="text-sm font-medium text-[#2D1F1A] line-clamp-2 mt-0.5 group-hover:text-[#C8896A] transition-colors">
                      {product.name}
                    </h3>

                    <div className="flex items-center justify-between mt-2">
                      <div>
                        {product.discountPrice ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-[#C8896A]">{formatPrice(product.discountPrice)}</span>
                            <span className="text-[10px] text-[#C4AEA4] line-through">{formatPrice(product.price)}</span>
                          </div>
                        ) : (
                          <span className="text-sm font-bold text-[#2D1F1A]">{formatPrice(product.price)}</span>
                        )}
                      </div>
                      {avgRating && (
                        <div className="flex items-center gap-0.5 text-[10px] text-amber-500 font-semibold">
                          <Star size={10} fill="currentColor" /> {avgRating.toFixed(1)}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <p className="text-[10px] text-[#C4AEA4] font-semibold uppercase tracking-wide">{label}</p>
        <p className="text-sm text-[#2D1F1A] font-medium leading-snug">{value}</p>
      </div>
    </div>
  )
}
