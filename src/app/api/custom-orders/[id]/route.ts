import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCustomer } from '@/lib/dal'
import { createNotification } from '@/lib/notifications'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await requireCustomer()
  const { id } = await params
  const orderId = Number(id)
  if (isNaN(orderId)) return NextResponse.json({ error: 'Invalid ID.' }, { status: 400 })

  const order = await prisma.customOrder.findUnique({
    where: { id: orderId },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true, email: true } },
      category: { select: { id: true, name: true } },
      images: { orderBy: { createdAt: 'asc' } },
      messages: {
        include: { sender: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'asc' },
      },
      progress: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!order) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  if (order.customerId !== session.userId) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  return NextResponse.json({ success: true, order })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await requireCustomer()
  const { id } = await params
  const orderId = Number(id)
  if (isNaN(orderId)) return NextResponse.json({ error: 'Invalid ID.' }, { status: 400 })

  const order = await prisma.customOrder.findUnique({ where: { id: orderId } })
  if (!order) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  if (order.customerId !== session.userId) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  const body = await req.json() as { action: string }

  let updated

  if (body.action === 'accept_quotation') {
    if (order.status !== 'QUOTED') {
      return NextResponse.json({ error: 'Order is not in QUOTED state.' }, { status: 400 })
    }
    updated = await prisma.customOrder.update({
      where: { id: orderId },
      data: { status: 'PAYMENT_PENDING' },
    })
    if (order.sellerId) {
      await createNotification({
        title: 'Quotation Accepted',
        body: `The customer has accepted your quotation for "${order.title}".`,
        type: 'custom_order',
        link: `/seller/custom-orders/${orderId}`,
        userId: order.sellerId,
      })
    }
  } else if (body.action === 'reject_quotation') {
    if (order.status !== 'QUOTED') {
      return NextResponse.json({ error: 'Order is not in QUOTED state.' }, { status: 400 })
    }
    updated = await prisma.customOrder.update({
      where: { id: orderId },
      data: { status: 'REVIEWING' },
    })
    if (order.sellerId) {
      await createNotification({
        title: 'Quotation Rejected',
        body: `The customer has rejected your quotation for "${order.title}" and wants a revision.`,
        type: 'custom_order',
        link: `/seller/custom-orders/${orderId}`,
        userId: order.sellerId,
      })
    }
  } else if (body.action === 'cancel') {
    const nonCancellableStatuses = ['IN_PROGRESS', 'ADVANCE_PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED']
    if (nonCancellableStatuses.includes(order.status)) {
      return NextResponse.json({ error: 'Cannot cancel order at this stage.' }, { status: 400 })
    }
    updated = await prisma.customOrder.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
    })
    if (order.sellerId) {
      await createNotification({
        title: 'Custom Order Cancelled',
        body: `The customer has cancelled their custom order "${order.title}".`,
        type: 'custom_order',
        link: `/seller/custom-orders/${orderId}`,
        userId: order.sellerId,
      })
    }
  } else {
    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 })
  }

  return NextResponse.json({ success: true, order: updated })
}
