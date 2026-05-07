import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

// ── GET /api/seller/transactions ──────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session?.userId) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }
  if (session.role !== 'SELLER') {
    return NextResponse.json({ error: 'Seller access required.' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const method = searchParams.get('method')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? '20')))
  const skip = (page - 1) * limit

  // Find all orders that contain this seller's products
  const sellerOrderIds = await prisma.orderItem.findMany({
    where: { product: { sellerId: session.userId } },
    select: { orderId: true },
    distinct: ['orderId'],
  })
  const orderIds = sellerOrderIds.map((o) => o.orderId)

  const where = {
    orderId: { in: orderIds },
    ...(status && { paymentStatus: status as 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' }),
    ...(method && { paymentMethod: method }),
    ...(from || to
      ? {
          createdAt: {
            ...(from && { gte: new Date(from) }),
            ...(to && { lte: new Date(to) }),
          },
        }
      : {}),
  }

  const [transactions, total] = await Promise.all([
    prisma.paymentTransaction.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { name: true, email: true } },
        order: {
          select: {
            id: true,
            status: true,
            items: {
              where: { product: { sellerId: session.userId } },
              select: {
                quantity: true,
                price: true,
                product: { select: { name: true } },
              },
            },
          },
        },
      },
    }),
    prisma.paymentTransaction.count({ where }),
  ])

  return NextResponse.json({ transactions, total, page, limit, pages: Math.ceil(total / limit) })
}
