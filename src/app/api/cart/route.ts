import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session?.userId) {
    return NextResponse.json({ items: [], count: 0, total: 0 })
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: session.userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true, name: true, shortDescription: true,
              price: true, discountPrice: true, image: true, stock: true,
              seller: { select: { name: true } },
              category: { select: { name: true } },
            },
          },
        },
        orderBy: { id: 'asc' },
      },
    },
  })

  if (!cart) return NextResponse.json({ items: [], count: 0, total: 0 })

  const count = cart.items.reduce((s, i) => s + i.quantity, 0)
  const total = cart.items.reduce((s, i) => {
    return s + (i.product.discountPrice ?? i.product.price) * i.quantity
  }, 0)

  return NextResponse.json({ items: cart.items, count, total })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session?.userId) {
    return NextResponse.json({ error: 'Please login to add items to cart.' }, { status: 401 })
  }

  const { productId, quantity = 1 } = await request.json()
  if (!productId || quantity < 1) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  // Verify product exists and is in stock
  const product = await prisma.product.findFirst({
    where: { id: productId, isApproved: true, isActive: true },
  })
  if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 })

  // Upsert cart
  const cart = await prisma.cart.upsert({
    where: { userId: session.userId },
    create: { userId: session.userId },
    update: {},
  })

  // Increment if exists, create if not
  const existing = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId },
  })

  const item = existing
    ? await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      })
    : await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity },
      })

  const countResult = await prisma.cartItem.aggregate({
    where: { cartId: cart.id },
    _sum: { quantity: true },
  })
  const cartCount = countResult._sum.quantity ?? 0

  return NextResponse.json({ success: true, item, cartCount })
}
