import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

// ── GET /api/customer/transactions ────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session?.userId) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }
  if (session.role !== 'CUSTOMER') {
    return NextResponse.json({ error: 'Customer access required.' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const method = searchParams.get('method')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? '20')))
  const skip = (page - 1) * limit

  const where = {
    customerId: session.userId,
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
        order: {
          select: {
            id: true,
            status: true,
            customerName: true,
            items: {
              take: 1,
              include: { product: { select: { name: true, sellerId: true, seller: { select: { name: true } } } } },
            },
          },
        },
      },
    }),
    prisma.paymentTransaction.count({ where }),
  ])

  return NextResponse.json({ transactions, total, page, limit, pages: Math.ceil(total / limit) })
}
