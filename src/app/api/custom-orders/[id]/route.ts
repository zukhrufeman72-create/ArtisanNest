import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/dal'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await verifySession()
  const { id } = await params
  const orderId = Number(id)
  if (isNaN(orderId)) return NextResponse.json({ error: 'Invalid ID.' }, { status: 400 })

  const order = await prisma.customOrder.findUnique({
    where: { id: orderId },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true, email: true } },
    },
  })
  if (!order) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  // Access check
  if (session.role === 'CUSTOMER' && order.customerId !== session.userId) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }
  if (session.role === 'SELLER' && order.sellerId !== session.userId) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  return NextResponse.json({ order })
}

// PATCH — seller quotes price, admin/seller updates status
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await verifySession()
  const { id } = await params
  const orderId = Number(id)
  if (isNaN(orderId)) return NextResponse.json({ error: 'Invalid ID.' }, { status: 400 })

  const order = await prisma.customOrder.findUnique({ where: { id: orderId } })
  if (!order) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  if (session.role === 'SELLER' && order.sellerId !== session.userId) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  const body = await req.json() as {
    status?: string
    quotedPrice?: number
    sellerId?: number
  }

  const updated = await prisma.customOrder.update({
    where: { id: orderId },
    data: {
      ...(body.status ? { status: body.status as 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' } : {}),
      ...(body.quotedPrice !== undefined ? { quotedPrice: body.quotedPrice } : {}),
      ...(body.sellerId !== undefined ? { sellerId: body.sellerId } : {}),
    },
  })
  return NextResponse.json({ order: updated })
}
