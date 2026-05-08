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
  if (!order) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  if (order.customerId !== session.userId) {
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

  if (order.sellerId) {
    await createNotification({
      title: 'New Message on Custom Order',
      body: `You have a new message regarding custom order "${order.title}".`,
      type: 'custom_order_message',
      link: `/seller/custom-orders/${orderId}`,
      userId: order.sellerId,
    })
  }

  return NextResponse.json({ success: true, message: msg }, { status: 201 })
}
