import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOptionalSession } from '@/lib/dal'

// GET /api/products/recommendations?productId=X&categoryId=Y&limit=8
export async function GET(req: NextRequest) {
  const session = await getOptionalSession()
  const { searchParams } = req.nextUrl
  const productId = searchParams.get('productId') ? Number(searchParams.get('productId')) : undefined
  const categoryId = searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : undefined
  const limit = Math.min(20, Number(searchParams.get('limit') ?? 8))

  // Build recommendation query: same category, high score, exclude current product
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      isApproved: true,
      ...(categoryId ? { categoryId } : {}),
      ...(productId ? { id: { not: productId } } : {}),
    },
    orderBy: [
      { score: 'desc' },
      { purchaseCount: 'desc' },
      { viewCount: 'desc' },
    ],
    take: limit,
    select: {
      id: true,
      name: true,
      price: true,
      image: true,
      images: { where: { isPrimary: true }, take: 1, select: { url: true } },
      score: true,
      purchaseCount: true,
      viewCount: true,
      category: { select: { id: true, name: true } },
      reviews: { select: { rating: true } },
      seller: { select: { id: true, name: true } },
    },
  })

  const enriched = products.map(({ images, ...p }) => ({
    ...p,
    image: images[0]?.url ?? p.image,
    avgRating: p.reviews.length
      ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length
      : 0,
    reviewCount: p.reviews.length,
    reviews: undefined,
  }))

  return NextResponse.json({ products: enriched })
}
