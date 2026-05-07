import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/dal'

// GET /api/admin/sellers — list sellers with approval status
export async function GET(req: NextRequest) {
  await requireAdmin()
  const { searchParams } = req.nextUrl
  const status = searchParams.get('status') // 'pending' | 'approved' | 'all'
  const search = searchParams.get('search') ?? undefined
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const limit = 20

  const where = {
    role: 'SELLER' as const,
    ...(status === 'pending' ? { isApproved: false } : {}),
    ...(status === 'approved' ? { isApproved: true } : {}),
    ...(search ? {
      OR: [
        { name: { contains: search } },
        { email: { contains: search } },
      ],
    } : {}),
  }

  const [sellers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, isApproved: true, createdAt: true, lastLoginAt: true, avatar: true,
        shopProfile: { select: { id: true, shopName: true, status: true } },
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ])

  return NextResponse.json({ sellers, total, page, pages: Math.ceil(total / limit) })
}
