import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { createNotification } from '@/lib/notifications'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
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

  const body = await req.json() as { message: string }
  if (!body.message?.trim()) {
    return NextResponse.json({ error: 'Message cannot be empty.' }, { status: 400 })
  }

  const msg = await prisma.customOrderMessage.create({
    data: {
      customOrderId: orderId,
      senderId: session.userId,
      message: body.message.trim(),
    },
    include: { sender: { select: { id: true, name: true, email: true } } },
  })

  await createNotification({
    title: 'New Message on Your Custom Order',
    body: `You have a new message from the seller regarding "${order.title}".`,
    type: 'custom_order_message',
    link: `/custom-orders/${orderId}`,
    userId: order.customerId,
  })

  return NextResponse.json({ success: true, message: msg }, { status: 201 })
}
