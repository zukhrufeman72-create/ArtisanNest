import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCustomer } from '@/lib/dal'
import { createNotification } from '@/lib/notifications'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const session = await requireCustomer()
  const { id } = await params
  const orderId = Number(id)
  if (isNaN(orderId)) return NextResponse.json({ error: 'Invalid ID.' }, { status: 400 })

  const order = await prisma.customOrder.findUnique({ where: { id: orderId } })
  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
  if (order.customerId !== session.userId) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  const body = await req.json() as {
    type: string              // 'advance' | 'full_online' | 'full_cod' | 'final_online'
    stripePaymentIntentId?: string
    finalPaymentMethod?: string  // 'ONLINE' | 'COD' — only for type='advance'
  }

  const { type, stripePaymentIntentId, finalPaymentMethod } = body

  if (!['advance', 'full_online', 'full_cod', 'final_online'].includes(type)) {
    return NextResponse.json({ error: 'Invalid payment type.' }, { status: 400 })
  }

  // ── Advance payment (online, mandatory) ──────────────────────────────────
  if (type === 'advance') {
    if (order.status !== 'QUOTED' && order.status !== 'PAYMENT_PENDING') {
      return NextResponse.json({ error: 'Order is not awaiting payment.' }, { status: 400 })
    }
    if (!stripePaymentIntentId) {
      return NextResponse.json({ error: 'Payment confirmation required.' }, { status: 400 })
    }
    if (!finalPaymentMethod || !['ONLINE', 'COD'].includes(finalPaymentMethod)) {
      return NextResponse.json({ error: 'Final payment method must be ONLINE or COD.' }, { status: 400 })
    }

    const updated = await prisma.customOrder.update({
      where: { id: orderId },
      data: {
        status: 'ADVANCE_PAID',
        paymentStatus: 'ADVANCE_PAID',
        finalPaymentMethod,
      },
    })

    if (order.sellerId) {
      await createNotification({
        title: 'Advance Payment Received',
        body: `Customer paid the advance for custom order "${order.title}". You can now start work.`,
        type: 'custom_order',
        link: `/seller/custom-orders/${orderId}`,
        userId: order.sellerId,
      })
    }

    return NextResponse.json({ success: true, order: updated })
  }

  // ── Full payment — online ─────────────────────────────────────────────────
  if (type === 'full_online') {
    if (order.status !== 'QUOTED' && order.status !== 'PAYMENT_PENDING') {
      return NextResponse.json({ error: 'Order is not awaiting payment.' }, { status: 400 })
    }
    if (!stripePaymentIntentId) {
      return NextResponse.json({ error: 'Payment confirmation required.' }, { status: 400 })
    }

    const updated = await prisma.customOrder.update({
      where: { id: orderId },
      data: {
        status: 'ACCEPTED',
        paymentStatus: 'PAID',
        finalPaymentMethod: 'ONLINE',
      },
    })

    if (order.sellerId) {
      await createNotification({
        title: 'Full Payment Received',
        body: `Customer has paid in full for custom order "${order.title}". You can now start work.`,
        type: 'custom_order',
        link: `/seller/custom-orders/${orderId}`,
        userId: order.sellerId,
      })
    }

    return NextResponse.json({ success: true, order: updated })
  }

  // ── Full payment — COD ────────────────────────────────────────────────────
  if (type === 'full_cod') {
    if (order.status !== 'QUOTED' && order.status !== 'PAYMENT_PENDING') {
      return NextResponse.json({ error: 'Order is not awaiting payment.' }, { status: 400 })
    }

    const updated = await prisma.customOrder.update({
      where: { id: orderId },
      data: {
        status: 'ACCEPTED',
        paymentStatus: 'UNPAID',
        finalPaymentMethod: 'COD',
      },
    })

    if (order.sellerId) {
      await createNotification({
        title: 'Custom Order Confirmed (COD)',
        body: `Customer confirmed custom order "${order.title}" with Cash on Delivery. You can now start work.`,
        type: 'custom_order',
        link: `/seller/custom-orders/${orderId}`,
        userId: order.sellerId,
      })
    }

    return NextResponse.json({ success: true, order: updated })
  }

  // ── Final payment — online (after delivery, when advance was paid) ─────────
  if (type === 'final_online') {
    if (order.status !== 'DELIVERED' || order.paymentStatus !== 'ADVANCE_PAID') {
      return NextResponse.json({ error: 'Order is not in the correct state for final payment.' }, { status: 400 })
    }
    if (!stripePaymentIntentId) {
      return NextResponse.json({ error: 'Payment confirmation required.' }, { status: 400 })
    }

    const updated = await prisma.customOrder.update({
      where: { id: orderId },
      data: {
        status: 'COMPLETED',
        paymentStatus: 'PAID',
      },
    })

    if (order.sellerId) {
      await createNotification({
        title: 'Final Payment Received',
        body: `Customer has paid the remaining balance for custom order "${order.title}". Order is now complete.`,
        type: 'custom_order',
        link: `/seller/custom-orders/${orderId}`,
        userId: order.sellerId,
      })
    }

    return NextResponse.json({ success: true, order: updated })
  }

  return NextResponse.json({ error: 'Invalid action.' }, { status: 400 })
}
