import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

// ── POST /api/payment/transactions ────────────────────────────────────────────
// Internal: save a payment transaction (called after checkout or by checkout route)
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session?.userId) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }
  if (session.role !== 'CUSTOMER') {
    return NextResponse.json({ error: 'Only customers can create transactions.' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { orderId, paymentMethod, paymentStatus, amount, stripePaymentIntentId } = body as {
    orderId?: number
    paymentMethod?: string
    paymentStatus?: string
    amount?: number
    stripePaymentIntentId?: string
  }

  if (!orderId || !paymentMethod || !amount) {
    return NextResponse.json({ error: 'orderId, paymentMethod, and amount are required.' }, { status: 400 })
  }

  // Verify order belongs to this customer
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: session.userId },
    include: {
      items: {
        include: { product: { select: { sellerId: true } } },
        take: 1,
      },
    },
  })
  if (!order) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
  }

  const sellerId = order.items[0]?.product.sellerId ?? null

  const transaction = await prisma.paymentTransaction.create({
    data: {
      orderId,
      customerId: session.userId,
      sellerId,
      transactionId: randomUUID(),
      paymentMethod,
      paymentStatus: (paymentStatus as 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED') ?? 'SUCCESS',
      amount,
      currency: 'PKR',
      stripePaymentIntentId: stripePaymentIntentId ?? null,
    },
  })

  return NextResponse.json({ success: true, transaction }, { status: 201 })
}
