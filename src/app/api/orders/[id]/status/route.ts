import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { sendOrderStatusUpdateEmail } from '@/lib/email'
import { createNotification } from '@/lib/notifications'

const VALID_STATUSES = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const
type OrderStatus = (typeof VALID_STATUSES)[number]

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session?.userId || session.role !== 'SELLER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const orderId = parseInt(id)
  if (isNaN(orderId)) return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 })

  const { status } = await request.json()
  if (!VALID_STATUSES.includes(status as OrderStatus)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  // Verify this seller has items in the order
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: {
        include: { product: { select: { sellerId: true } } },
      },
    },
  })

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const sellerOwnsItems = order.items.some((i) => i.product.sellerId === session.userId)
  if (!sellerOwnsItems) {
    return NextResponse.json({ error: 'You do not have items in this order' }, { status: 403 })
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: status as OrderStatus,
      paymentStatus: status === 'PAID' ? 'PAID' : undefined,
    },
  })

  // Send email + in-app notification to customer (fire-and-forget)
  const { name, email } = order.user
  void sendOrderStatusUpdateEmail(email, name, orderId, status).catch(console.error)
  void createNotification({
    userId: order.user.id,
    title: statusTitle(status),
    body: `Your order #${orderId} has been updated to: ${status.charAt(0) + status.slice(1).toLowerCase()}`,
    type: 'ORDER_STATUS',
    link: '/orders',
  }).catch(console.error)

  return NextResponse.json({ success: true, status: updated.status })
}

function statusTitle(status: string): string {
  const map: Record<string, string> = {
    PAID: '✅ Payment Confirmed',
    SHIPPED: '🚚 Order Shipped',
    DELIVERED: '📦 Order Delivered',
    CANCELLED: '❌ Order Cancelled',
    PENDING: '🕐 Order Pending',
  }
  return map[status] ?? '🔔 Order Update'
}
