import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { createNotification } from '@/lib/notifications'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.role !== 'SELLER') {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

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

  // Sellers can see unassigned orders OR their own
  if (order.sellerId !== null && order.sellerId !== session.userId) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  return NextResponse.json({ success: true, order })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.role !== 'SELLER') {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const { id } = await params
  const orderId = Number(id)
  if (isNaN(orderId)) return NextResponse.json({ error: 'Invalid ID.' }, { status: 400 })

  const order = await prisma.customOrder.findUnique({ where: { id: orderId } })
  if (!order) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  if (order.sellerId !== null && order.sellerId !== session.userId) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  const body = await req.json() as {
    action: string
    reason?: string
    estimatedPrice?: number
    advancePayment?: number
    finalPrice?: number
    deliveryDays?: number
    quotationNotes?: string
    trackingNumber?: string
    courierName?: string
  }

  let updated

  switch (body.action) {
    case 'accept': {
      updated = await prisma.customOrder.update({
        where: { id: orderId },
        data: { status: 'REVIEWING', sellerId: session.userId },
      })
      await createNotification({
        title: 'Custom Order Accepted',
        body: `A seller is reviewing your custom order "${order.title}".`,
        type: 'custom_order',
        link: `/custom-orders/${orderId}`,
        userId: order.customerId,
      })
      break
    }

    case 'reject': {
      updated = await prisma.customOrder.update({
        where: { id: orderId },
        data: {
          status: 'REJECTED',
          sellerId: session.userId,
          adminNote: body.reason ?? null,
        },
      })
      await createNotification({
        title: 'Custom Order Rejected',
        body: `Your custom order "${order.title}" was not accepted. Reason: ${body.reason ?? 'N/A'}`,
        type: 'custom_order',
        link: `/custom-orders/${orderId}`,
        userId: order.customerId,
      })
      break
    }

    case 'need_more_details': {
      updated = await prisma.customOrder.update({
        where: { id: orderId },
        data: { status: 'NEED_MORE_DETAILS', sellerId: session.userId },
      })
      await createNotification({
        title: 'More Details Needed',
        body: `The seller needs more details for your custom order "${order.title}". Please check messages.`,
        type: 'custom_order',
        link: `/custom-orders/${orderId}`,
        userId: order.customerId,
      })
      break
    }

    case 'send_quotation': {
      if (!body.estimatedPrice) {
        return NextResponse.json({ error: 'estimatedPrice is required.' }, { status: 400 })
      }
      updated = await prisma.customOrder.update({
        where: { id: orderId },
        data: {
          status: 'QUOTED',
          estimatedPrice: body.estimatedPrice,
          advancePayment: body.advancePayment ?? null,
          finalPrice: body.finalPrice ?? null,
          deliveryDays: body.deliveryDays ?? null,
          quotationNotes: body.quotationNotes ?? null,
          quotedPrice: body.estimatedPrice, // backward compat
          sellerId: session.userId,
        },
      })
      await createNotification({
        title: 'Quotation Received',
        body: `You have received a price quotation for your custom order "${order.title}". Please review and accept or reject.`,
        type: 'custom_order',
        link: `/custom-orders/${orderId}`,
        userId: order.customerId,
      })
      break
    }

    case 'start_work': {
      // paymentStatus stays as-is (could be ADVANCE_PAID, PAID, or UNPAID for COD)
      updated = await prisma.customOrder.update({
        where: { id: orderId },
        data: { status: 'IN_PROGRESS' },
      })
      await createNotification({
        title: 'Work Started on Your Order',
        body: `The seller has started working on your custom order "${order.title}".`,
        type: 'custom_order',
        link: `/custom-orders/${orderId}`,
        userId: order.customerId,
      })
      break
    }

    case 'ship': {
      updated = await prisma.customOrder.update({
        where: { id: orderId },
        data: {
          status: 'SHIPPED',
          trackingNumber: body.trackingNumber ?? null,
          courierName: body.courierName ?? null,
        },
      })
      await createNotification({
        title: 'Your Order Has Been Shipped',
        body: `Your custom order "${order.title}" has been shipped. ${body.trackingNumber ? `Tracking: ${body.trackingNumber}` : ''}`,
        type: 'custom_order',
        link: `/custom-orders/${orderId}`,
        userId: order.customerId,
      })
      break
    }

    case 'deliver': {
      // If fully paid (online or COD with no advance), mark COMPLETED+PAID
      // If advance was paid, customer still needs to pay remaining → mark DELIVERED+ADVANCE_PAID
      const nextPaymentStatus = order.paymentStatus === 'ADVANCE_PAID' ? 'ADVANCE_PAID' : 'PAID'
      const nextStatus = order.paymentStatus === 'ADVANCE_PAID' ? 'DELIVERED' : 'COMPLETED'
      updated = await prisma.customOrder.update({
        where: { id: orderId },
        data: { status: nextStatus, paymentStatus: nextPaymentStatus },
      })
      await createNotification({
        title: 'Order Delivered',
        body: `Your custom order "${order.title}" has been marked as delivered.`,
        type: 'custom_order',
        link: `/custom-orders/${orderId}`,
        userId: order.customerId,
      })
      break
    }

    case 'collect_cod': {
      if (order.status !== 'DELIVERED' || order.paymentStatus !== 'ADVANCE_PAID') {
        return NextResponse.json({ error: 'Order is not in the correct state.' }, { status: 400 })
      }
      updated = await prisma.customOrder.update({
        where: { id: orderId },
        data: { status: 'COMPLETED', paymentStatus: 'PAID' },
      })
      await createNotification({
        title: 'Order Completed',
        body: `Your custom order "${order.title}" is complete. Thank you!`,
        type: 'custom_order',
        link: `/custom-orders/${orderId}`,
        userId: order.customerId,
      })
      break
    }

    case 'update_tracking': {
      updated = await prisma.customOrder.update({
        where: { id: orderId },
        data: {
          trackingNumber: body.trackingNumber ?? order.trackingNumber,
          courierName: body.courierName ?? order.courierName,
        },
      })
      break
    }

    default:
      return NextResponse.json({ error: 'Invalid action.' }, { status: 400 })
  }

  return NextResponse.json({ success: true, order: updated })
}
