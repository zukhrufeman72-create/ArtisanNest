import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

// ── GET /api/admin/delivery-tracking ─────────────────────────────────────────
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session?.userId || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? '20')))
  const skip = (page - 1) * limit

  const where = {
    ...(status && {
      status: status as
        | 'PENDING' | 'CONFIRMED' | 'PACKED' | 'SHIPPED'
        | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'RETURNED',
    }),
  }

  const [records, total] = await Promise.all([
    prisma.deliveryTracking.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            totalPrice: true,
            customerName: true,
            createdAt: true,
            user: { select: { name: true, email: true } },
          },
        },
        updatedBy: { select: { name: true } },
      },
    }),
    prisma.deliveryTracking.count({ where }),
  ])

  return NextResponse.json({ records, total, page, limit, pages: Math.ceil(total / limit) })
}
