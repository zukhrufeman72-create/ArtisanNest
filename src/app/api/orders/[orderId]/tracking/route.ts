import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

const VALID_STATUSES = [
  'PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED',
  'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED',
] as const
type DeliveryStatus = typeof VALID_STATUSES[number]

// ── GET /api/orders/:orderId/tracking ─────────────────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const session = await getSession()
  if (!session?.userId) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  const { orderId } = await params
  const id = Number(orderId)
  if (!id) return NextResponse.json({ error: 'Invalid order ID.' }, { status: 400 })

  // Verify access
  const order = await prisma.order.findUnique({ where: { id } })
  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })

  if (session.role === 'CUSTOMER' && order.userId !== session.userId) {
    return NextResponse.json({ error: 'Access denied.' }, { status: 403 })
  }
  if (session.role === 'SELLER') {
    const sellerItem = await prisma.orderItem.findFirst({
      where: { orderId: id, product: { sellerId: session.userId } },
    })
    if (!sellerItem) return NextResponse.json({ error: 'Access denied.' }, { status: 403 })
  }

  const tracking = await prisma.deliveryTracking.findUnique({
    where: { orderId: id },
    include: {
      updatedBy: { select: { name: true, role: true } },
      history: {
        orderBy: { createdAt: 'asc' },
        include: { updatedBy: { select: { name: true, role: true } } },
      },
    },
  })

  return NextResponse.json({ tracking: tracking ?? null })
}

// ── POST /api/orders/:orderId/tracking ────────────────────────────────────────
// Create initial delivery tracking record (admin/seller after order placement)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const session = await getSession()
  if (!session?.userId) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }
  if (session.role === 'CUSTOMER') {
    return NextResponse.json({ error: 'Seller or admin access required.' }, { status: 403 })
  }

  const { orderId } = await params
  const id = Number(orderId)
  if (!id) return NextResponse.json({ error: 'Invalid order ID.' }, { status: 400 })

  const order = await prisma.order.findUnique({ where: { id } })
  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })

  if (session.role === 'SELLER') {
    const sellerItem = await prisma.orderItem.findFirst({
      where: { orderId: id, product: { sellerId: session.userId } },
    })
    if (!sellerItem) return NextResponse.json({ error: 'Access denied.' }, { status: 403 })
  }

  const existing = await prisma.deliveryTracking.findUnique({ where: { orderId: id } })
  if (existing) {
    return NextResponse.json({ error: 'Tracking already exists. Use PATCH to update.' }, { status: 409 })
  }

  let body: unknown
  try { body = await request.json() } catch { body = {} }

  const { status = 'PENDING', location, remarks, estimatedDeliveryDate } = body as {
    status?: string; location?: string; remarks?: string; estimatedDeliveryDate?: string
  }

  if (!VALID_STATUSES.includes(status as DeliveryStatus)) {
    return NextResponse.json({ error: 'Invalid delivery status.' }, { status: 400 })
  }

  const tracking = await prisma.deliveryTracking.create({
    data: {
      orderId: id,
      status: status as DeliveryStatus,
      location: location ?? null,
      remarks: remarks ?? null,
      updatedById: session.userId,
      estimatedDeliveryDate: estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : null,
      history: {
        create: {
          status: status as DeliveryStatus,
          location: location ?? null,
          remarks: remarks ?? null,
          updatedById: session.userId,
        },
      },
    },
    include: { history: true },
  })

  return NextResponse.json({ success: true, tracking }, { status: 201 })
}

// ── PATCH /api/orders/:orderId/tracking ───────────────────────────────────────
// Update delivery status (admin/seller)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const session = await getSession()
  if (!session?.userId) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }
  if (session.role === 'CUSTOMER') {
    return NextResponse.json({ error: 'Seller or admin access required.' }, { status: 403 })
  }

  const { orderId } = await params
  const id = Number(orderId)
  if (!id) return NextResponse.json({ error: 'Invalid order ID.' }, { status: 400 })

  const tracking = await prisma.deliveryTracking.findUnique({ where: { orderId: id } })
  if (!tracking) {
    return NextResponse.json({ error: 'Tracking not found. Create it first.' }, { status: 404 })
  }

  if (session.role === 'SELLER') {
    const sellerItem = await prisma.orderItem.findFirst({
      where: { orderId: id, product: { sellerId: session.userId } },
    })
    if (!sellerItem) return NextResponse.json({ error: 'Access denied.' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { status, location, remarks, estimatedDeliveryDate } = body as {
    status?: string; location?: string; remarks?: string; estimatedDeliveryDate?: string
  }

  if (!status || !VALID_STATUSES.includes(status as DeliveryStatus)) {
    return NextResponse.json({ error: 'Invalid delivery status.' }, { status: 400 })
  }

  // Update tracking + append to history in a transaction
  const [updated] = await prisma.$transaction([
    prisma.deliveryTracking.update({
      where: { orderId: id },
      data: {
        status: status as DeliveryStatus,
        location: location ?? tracking.location,
        remarks: remarks ?? null,
        updatedById: session.userId,
        ...(estimatedDeliveryDate !== undefined && {
          estimatedDeliveryDate: estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : null,
        }),
      },
    }),
    prisma.deliveryTrackingHistory.create({
      data: {
        deliveryTrackingId: tracking.id,
        status: status as DeliveryStatus,
        location: location ?? null,
        remarks: remarks ?? null,
        updatedById: session.userId,
      },
    }),
    // If delivered, also update the order status
    ...(status === 'DELIVERED'
      ? [prisma.order.update({ where: { id }, data: { status: 'DELIVERED' } })]
      : []),
    ...(status === 'CANCELLED'
      ? [prisma.order.update({ where: { id }, data: { status: 'CANCELLED' } })]
      : []),
  ])

  return NextResponse.json({ success: true, tracking: updated })
}
