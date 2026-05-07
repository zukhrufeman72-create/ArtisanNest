import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession, getOptionalSession } from '@/lib/dal'

type Params = { params: Promise<{ productId: string }> }

// GET — public product reviews
export async function GET(req: NextRequest, { params }: Params) {
  const { productId } = await params
  const id = Number(productId)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid product ID.' }, { status: 400 })

  const { searchParams } = req.nextUrl
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const limit = 10

  const [reviews, total, stats] = await Promise.all([
    prisma.review.findMany({
      where: { productId: id },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        response: {
          include: { seller: { select: { id: true, name: true } } },
        },
        helpful: { select: { userId: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.review.count({ where: { productId: id } }),
    prisma.review.aggregate({
      where: { productId: id },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ])

  const ratingBreakdown = await prisma.review.groupBy({
    by: ['rating'],
    where: { productId: id },
    _count: { rating: true },
  })

  return NextResponse.json({
    reviews,
    total,
    page,
    pages: Math.ceil(total / limit),
    averageRating: stats._avg.rating ?? 0,
    totalCount: stats._count.rating,
    ratingBreakdown: ratingBreakdown.reduce((acc, r) => {
      acc[r.rating] = r._count.rating
      return acc
    }, {} as Record<number, number>),
  })
}

// POST — customer submits review
export async function POST(req: NextRequest, { params }: Params) {
  const session = await verifySession()
  if (session.role !== 'CUSTOMER') {
    return NextResponse.json({ error: 'Only customers can submit reviews.' }, { status: 403 })
  }

  const { productId } = await params
  const id = Number(productId)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid product ID.' }, { status: 400 })

  const body = await req.json() as {
    rating: number
    comment?: string
    images?: string[]
  }

  if (!body.rating || body.rating < 1 || body.rating > 5) {
    return NextResponse.json({ error: 'Rating must be between 1 and 5.' }, { status: 400 })
  }

  // Check if customer actually bought this product
  const hasPurchased = await prisma.orderItem.findFirst({
    where: {
      productId: id,
      order: { userId: session.userId, status: 'DELIVERED' },
    },
  })

  const existing = await prisma.review.findFirst({ where: { userId: session.userId, productId: id } })
  if (existing) return NextResponse.json({ error: 'You have already reviewed this product.' }, { status: 409 })

  const review = await prisma.review.create({
    data: {
      userId: session.userId,
      productId: id,
      rating: body.rating,
      comment: body.comment ?? null,
      images: body.images ? JSON.stringify(body.images) : null,
      isVerified: !!hasPurchased,
    },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  })

  // Update product score
  void prisma.review.aggregate({ where: { productId: id }, _avg: { rating: true } }).then((agg) => {
    if (agg._avg.rating) {
      return prisma.product.update({ where: { id }, data: { score: agg._avg.rating } })
    }
  }).catch(console.error)

  return NextResponse.json({ review }, { status: 201 })
}
