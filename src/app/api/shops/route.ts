import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ── GET /api/shops ─────────────────────────────────────────────────────────────
// Public: list all active seller shops
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const search = searchParams.get('search')
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? '12')))
  const skip = (page - 1) * limit

  const where = {
    status: 'ACTIVE' as const,
    ...(category && { businessCategory: category }),
    ...(search && { shopName: { contains: search } }),
  }

  const [shops, total] = await Promise.all([
    prisma.sellerShopProfile.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        shopName: true,
        shopLogo: true,
        shopBanner: true,
        description: true,
        businessCategory: true,
        address: true,
        openingTime: true,
        closingTime: true,
        status: true,
        seller: {
          select: {
            id: true,
            name: true,
            _count: { select: { products: { where: { isApproved: true, isActive: true } } } },
          },
        },
      },
    }),
    prisma.sellerShopProfile.count({ where }),
  ])

  return NextResponse.json({ shops, total, page, limit, pages: Math.ceil(total / limit) })
}
