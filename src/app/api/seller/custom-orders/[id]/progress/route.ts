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

  const body = await req.json() as {
    title: string
    description?: string
    imageUrl?: string
  }

  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'Progress title is required.' }, { status: 400 })
  }

  const progressEntry = await prisma.customOrderProgress.create({
    data: {
      customOrderId: orderId,
      title: body.title.trim(),
      description: body.description ?? null,
      imageUrl: body.imageUrl ?? null,
    },
  })

  // If there's an image, also create a CustomOrderImage record
  if (body.imageUrl) {
    await prisma.customOrderImage.create({
      data: {
        customOrderId: orderId,
        url: body.imageUrl,
        imageType: 'progress',
        caption: body.title.trim(),
      },
    })
  }

  await createNotification({
    title: 'Progress Update on Your Order',
    body: `New progress update on "${order.title}": ${body.title}`,
    type: 'custom_order_progress',
    link: `/custom-orders/${orderId}`,
    userId: order.customerId,
  })

  return NextResponse.json({ success: true, progress: progressEntry }, { status: 201 })
}
