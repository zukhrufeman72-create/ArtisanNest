import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/products/search — advanced filter + voice search endpoint
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const q = searchParams.get('q') ?? ''
  const categoryId = searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : undefined
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined
  const minRating = searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined
  const material = searchParams.get('material') ?? undefined
  const sortBy = searchParams.get('sortBy') ?? 'score' // score | price_asc | price_desc | newest | popular
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const limit = Math.min(40, Number(searchParams.get('limit') ?? 20))

  const where = {
    isActive: true,
    isApproved: true,
    ...(q ? {
      OR: [
        { name: { contains: q } },
        { description: { contains: q } },
      ],
    } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(minPrice !== undefined || maxPrice !== undefined ? {
      price: {
        ...(minPrice !== undefined ? { gte: minPrice } : {}),
        ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
      },
    } : {}),
    ...(material ? { variants: { some: { material: { contains: material } } } } : {}),
  }

  const orderBy = {
    score: [{ score: 'desc' as const }],
    price_asc: [{ price: 'asc' as const }],
    price_desc: [{ price: 'desc' as const }],
    newest: [{ createdAt: 'desc' as const }],
    popular: [{ purchaseCount: 'desc' as const }],
  }[sortBy] ?? [{ score: 'desc' as const }]

  const [rawProducts, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, name: true, price: true, image: true, score: true,
        purchaseCount: true, stock: true, createdAt: true,
        category: { select: { id: true, name: true, color: true } },
        seller: { select: { id: true, name: true } },
        reviews: { select: { rating: true } },
        variants: { select: { id: true, color: true, size: true, material: true, price: true, stockQuantity: true } },
      },
    }),
    prisma.product.count({ where }),
  ])

  // Filter by minimum rating (post-query since we need computed avg)
  let products = rawProducts.map((p) => ({
    ...p,
    avgRating: p.reviews.length ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length : 0,
    reviewCount: p.reviews.length,
    reviews: undefined,
  }))

  if (minRating) {
    products = products.filter((p) => p.avgRating >= minRating)
  }

  // Increment view count fire-and-forget
  if (q && products.length > 0) {
    void prisma.product.updateMany({
      where: { id: { in: products.slice(0, 5).map((p) => p.id) } },
      data: { viewCount: { increment: 1 } },
    }).catch(console.error)
  }

  return NextResponse.json({ products, total, page, pages: Math.ceil(total / limit) })
}
