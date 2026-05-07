import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCustomer } from '@/lib/dal'

// POST /api/refunds — customer requests refund
export async function POST(req: NextRequest) {
  const session = await requireCustomer()
  const body = await req.json() as { orderId: number; reason: string; amount: number }

  if (!body.orderId || !body.reason || !body.amount) {
    return NextResponse.json({ error: 'orderId, reason, and amount are required.' }, { status: 400 })
  }

  const order = await prisma.order.findUnique({
    where: { id: body.orderId, userId: session.userId },
  })
  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
  if (order.status !== 'DELIVERED') {
    return NextResponse.json({ error: 'Refunds can only be requested for delivered orders.' }, { status: 400 })
  }

  const existing = await prisma.refundRequest.findFirst({
    where: { orderId: body.orderId, userId: session.userId, status: { not: 'REJECTED' } },
  })
  if (existing) {
    return NextResponse.json({ error: 'A refund request already exists for this order.' }, { status: 409 })
  }

  const refund = await prisma.refundRequest.create({
    data: {
      orderId: body.orderId,
      userId: session.userId,
      reason: body.reason,
      amount: body.amount,
    },
  })
  return NextResponse.json({ refund }, { status: 201 })
}

// GET /api/refunds — customer's own refunds
export async function GET(_req: NextRequest) {
  const session = await requireCustomer()
  const refunds = await prisma.refundRequest.findMany({
    where: { userId: session.userId },
    include: { order: { select: { id: true, totalPrice: true, createdAt: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ refunds })
}
