import { prisma } from '@/lib/prisma'
import { getOptionalSession } from '@/lib/dal'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Store, ArrowRight, Tag, Shield } from 'lucide-react'
import ProductReviews from '@/components/ProductReviews'
import ProductRecommendations from '@/components/ProductRecommendations'
import ProductClient from '@/components/ProductClient'

export const dynamic = 'force-dynamic'

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>
}) {
  const { productId } = await params
  const id = Number(productId)
  if (isNaN(id)) notFound()

  const session = await getOptionalSession()

  const [product, reviewData] = await Promise.all([
    prisma.product.findFirst({
      where: { id, isActive: true, isApproved: true },
      include: {
        category: { select: { id: true, name: true, color: true } },
        seller: {
          select: {
            id: true, name: true,
            shopProfile: { select: { id: true, shopName: true, shopLogo: true, status: true } },
          },
        },
        images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
        variants: {
          where: { status: { not: 'DISCONTINUED' } },
          orderBy: { price: 'asc' },
        },
        _count: { select: { reviews: true } },
      },
    }),
    prisma.review.findMany({
      where: { productId: id },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        response: { include: { seller: { select: { id: true, name: true } } } },
        helpful: { select: { userId: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  if (!product) notFound()

  void prisma.product.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(console.error)

  const totalReviews = product._count.reviews
  const avgRating = totalReviews > 0
    ? reviewData.reduce((s, r) => s + r.rating, 0) / reviewData.length
    : 0

  const ratingBreakdown: Record<number, number> = {}
  reviewData.forEach((r) => { ratingBreakdown[r.rating] = (ratingBreakdown[r.rating] ?? 0) + 1 })

  const serializedReviews = reviewData.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    response: r.response
      ? { ...r.response, createdAt: r.response.createdAt.toISOString(), updatedAt: undefined }
      : null,
  }))

  let canReview = false
  if (session?.role === 'CUSTOMER') {
    const [alreadyReviewed, hasPurchased] = await Promise.all([
      prisma.review.findFirst({ where: { userId: session.userId, productId: id } }),
      prisma.orderItem.findFirst({
        where: { productId: id, order: { userId: session.userId, status: 'DELIVERED' } },
      }),
    ])
    canReview = !alreadyReviewed && !!hasPurchased
  }

  const activeDeal = await prisma.deal.findFirst({
    where: { status: 'ACTIVE', products: { some: { productId: id } } },
  })

  // Build image list: gallery images first, fallback to product.image
  const allImages = product.images.length > 0
    ? product.images.map((i) => i.url)
    : product.image ? [product.image] : []

  const activeDealDiscount = activeDeal
    ? activeDeal.discountType === 'PERCENTAGE'
      ? `${activeDeal.discountValue}%`
      : `PKR ${activeDeal.discountValue.toLocaleString()}`
    : null

  return (
    <div className="min-h-screen bg-[#FDFAF7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-20">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-[#9E8079] mb-8 flex-wrap">
          <Link href="/" className="hover:text-[#C8896A] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-[#C8896A] transition-colors">Shop</Link>
          <span>/</span>
          <Link href={`/shop?category=${product.category.id}`} className="hover:text-[#C8896A] transition-colors">
            {product.category.name}
          </Link>
          <span>/</span>
          <span className="text-[#2D1F1A] font-medium truncate max-w-48">{product.name}</span>
        </nav>

        {/* Category + deal badges */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <span
            className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
            style={{
              background: product.category.color ? `${product.category.color}20` : '#F5EFE6',
              color: product.category.color ?? '#9E8079',
            }}
          >
            {product.category.name}
          </span>
          {activeDeal && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-rose-50 text-rose-500">
              <Tag size={9} /> {activeDeal.title}
            </span>
          )}
          {product.isApproved && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-[#7D9B76] bg-[#7D9B76]/10 px-2.5 py-1 rounded-full uppercase tracking-widest">
              <Shield size={9} /> Verified
            </span>
          )}
        </div>

        {/* Main product section */}
        <ProductClient
          images={allImages}
          name={product.name}
          price={product.price}
          discountPrice={product.discountPrice}
          stock={product.stock}
          shortDescription={product.shortDescription}
          material={product.material}
          origin={product.origin}
          variants={product.variants}
          activeDealLabel={activeDeal?.title ?? null}
          activeDealDiscount={activeDealDiscount}
          avgRating={avgRating}
          totalReviews={totalReviews}
          productId={id}
        />

        {/* Seller card */}
        <div className="mt-8">
          {product.seller.shopProfile?.status === 'ACTIVE' ? (
            <Link
              href={`/shop/${product.seller.shopProfile.id}`}
              className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-[#EAE3DC] hover:border-[#C8896A] transition-colors group max-w-sm"
            >
              <div className="w-12 h-12 rounded-xl bg-[#F5F0EB] flex items-center justify-center overflow-hidden shrink-0">
                {product.seller.shopProfile.shopLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.seller.shopProfile.shopLogo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Store size={20} className="text-[#C8896A]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#9E8079]">Sold by</p>
                <p className="font-semibold text-[#2D1F1A] group-hover:text-[#C8896A] transition-colors">
                  {product.seller.shopProfile.shopName}
                </p>
              </div>
              <ArrowRight size={16} className="text-[#9E8079] group-hover:translate-x-1 transition-transform shrink-0" />
            </Link>
          ) : (
            <div className="flex items-center gap-4 p-4 bg-[#F5F0EB] rounded-2xl max-w-sm">
              <Store size={20} className="text-[#C8896A] shrink-0" />
              <div>
                <p className="text-xs text-[#9E8079]">Sold by</p>
                <p className="font-semibold text-[#2D1F1A]">{product.seller.name}</p>
              </div>
            </div>
          )}
        </div>

        {/* Reviews */}
        <div className="mt-16">
          <ProductReviews
            productId={id}
            initialReviews={serializedReviews}
            total={totalReviews}
            pages={Math.ceil(totalReviews / 10)}
            averageRating={avgRating}
            totalCount={totalReviews}
            ratingBreakdown={ratingBreakdown}
            currentUserId={session?.userId}
            canReview={canReview}
          />
        </div>

        {/* Recommendations */}
        <div className="mt-16">
          <ProductRecommendations categoryId={product.category.id} productId={id} />
        </div>
      </div>
    </div>
  )
}
