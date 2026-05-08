import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCustomer } from '@/lib/dal'
import { createNotification } from '@/lib/notifications'

export async function GET(_req: NextRequest) {
  const session = await requireCustomer()

  const orders = await prisma.customOrder.findMany({
    where: { customerId: session.userId },
    select: {
      id: true,
      title: true,
      status: true,
      paymentStatus: true,
      budget: true,
      deadline: true,
      estimatedPrice: true,
      advancePayment: true,
      createdAt: true,
      seller: { select: { id: true, name: true } },
      images: {
        where: { imageType: 'reference' },
        take: 1,
        select: { url: true, imageType: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ success: true, orders })
}

export async function POST(req: NextRequest) {
  const session = await requireCustomer()

  const body = await req.json() as {
    title: string
    description: string
    categoryId?: number
    quantity?: number
    size?: string
    color?: string
    material?: string
    designStyle?: string
    budget?: number
    deadline?: string
    personalizationText?: string
    customMessage?: string
    fontStyle?: string
    giftPackaging?: boolean
    specialInstructions?: string
    customerName?: string
    customerEmail?: string
    customerPhone?: string
    deliveryAddress?: string
    imageUrls?: { url: string; imageType: string; caption?: string }[]
  }

  if (!body.title?.trim() || !body.description?.trim()) {
    return NextResponse.json({ error: 'Title and description are required.' }, { status: 400 })
  }

  const order = await prisma.customOrder.create({
    data: {
      customerId: session.userId,
      categoryId: body.categoryId ?? null,
      title: body.title.trim(),
      description: body.description.trim(),
      quantity: body.quantity ?? 1,
      size: body.size ?? null,
      color: body.color ?? null,
      material: body.material ?? null,
      designStyle: body.designStyle ?? null,
      budget: body.budget ?? null,
      deadline: body.deadline ? new Date(body.deadline) : null,
      personalizationText: body.personalizationText ?? null,
      customMessage: body.customMessage ?? null,
      fontStyle: body.fontStyle ?? null,
      giftPackaging: body.giftPackaging ?? false,
      specialInstructions: body.specialInstructions ?? null,
      customerName: body.customerName ?? null,
      customerEmail: body.customerEmail ?? null,
      customerPhone: body.customerPhone ?? null,
      deliveryAddress: body.deliveryAddress ?? null,
      images: body.imageUrls && body.imageUrls.length > 0
        ? {
            create: body.imageUrls.map((img) => ({
              url: img.url,
              imageType: img.imageType || 'reference',
              caption: img.caption ?? null,
            })),
          }
        : undefined,
    },
  })

  // Notify admins
  await createNotification({
    title: 'New Custom Order',
    body: `A new custom order "${body.title}" has been submitted.`,
    type: 'custom_order',
    link: `/admin/custom-orders/${order.id}`,
    userId: undefined,
  })

  // Notify all sellers
  const sellers = await prisma.user.findMany({
    where: { role: 'SELLER', isApproved: true },
    select: { id: true },
  })
  await Promise.all(
    sellers.map((seller) =>
      createNotification({
        title: 'New Custom Order Request',
        body: `A customer has requested a custom order: "${body.title}"`,
        type: 'custom_order',
        link: `/seller/custom-orders/${order.id}`,
        userId: seller.id,
      })
    )
  )

  return NextResponse.json({ success: true, order: { id: order.id } }, { status: 201 })
}
