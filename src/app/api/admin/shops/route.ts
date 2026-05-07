import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

// ── GET /api/admin/shops ───────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session?.userId || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search')
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? '20')))
  const skip = (page - 1) * limit

  const where = {
    ...(status && { status: status as 'PENDING' | 'ACTIVE' | 'BLOCKED' | 'INACTIVE' }),
    ...(search && { shopName: { contains: search } }),
  }

  const [shops, total] = await Promise.all([
    prisma.sellerShopProfile.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            _count: { select: { products: true } },
          },
        },
      },
    }),
    prisma.sellerShopProfile.count({ where }),
  ])

  return NextResponse.json({ shops, total, page, limit, pages: Math.ceil(total / limit) })
}
