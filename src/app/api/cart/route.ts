import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { LOW_STOCK_THRESHOLD } from '@/lib/validations'

// ── GET /api/cart ─────────────────────────────────────────────────────────────
export async function GET() {
  const session = await getSession()
  if (!session?.userId) {
    return NextResponse.json({ items: [], count: 0, total: 0 })
  }

  if (session.role !== 'CUSTOMER') {
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
              isApproved: true, isActive: true,
              seller: { select: { name: true } },
              category: { select: { name: true } },
            },
          },
          variant: {
            select: {
              id: true, color: true, size: true, material: true, design: true,
              price: true, stockQuantity: true, imageUrl: true, status: true, sku: true,
            },
          },
        },
        orderBy: { id: 'asc' },
      },
    },
  })

  if (!cart) return NextResponse.json({ items: [], count: 0, total: 0 })

  const availableItems = cart.items.filter(
    (i) => i.product.isApproved && i.product.isActive,
  )

  const count = availableItems.reduce((s, i) => s + i.quantity, 0)
  const total = availableItems.reduce((s, i) => {
    const unitPrice = i.variant?.price ?? (i.product.discountPrice ?? i.product.price)
    return s + unitPrice * i.quantity
  }, 0)

  const itemsWithFlags = availableItems.map((i) => {
    const effectiveStock = i.variant ? i.variant.stockQuantity : i.product.stock
    return {
      ...i,
      effectivePrice: i.variant?.price ?? (i.product.discountPrice ?? i.product.price),
      lowStock: effectiveStock > 0 && effectiveStock < LOW_STOCK_THRESHOLD,
      outOfStock: effectiveStock === 0 || i.variant?.status === 'OUT_OF_STOCK',
    }
  })

  return NextResponse.json({ items: itemsWithFlags, count, total })
}

// ── POST /api/cart ────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session?.userId) {
    return NextResponse.json({ error: 'Please login to add items to cart.' }, { status: 401 })
  }

  if (session.role !== 'CUSTOMER') {
    return NextResponse.json(
      { error: 'Only customer accounts can add items to a cart.' },
      { status: 403 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { productId, variantId, quantity = 1 } = body as {
    productId?: number; variantId?: number; quantity?: number
  }

  if (!productId || typeof productId !== 'number' || quantity < 1) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  // Verify product exists, is approved and active
  const product = await prisma.product.findFirst({
    where: { id: productId, isApproved: true, isActive: true },
    select: { id: true, stock: true, name: true },
  })
  if (!product) {
    return NextResponse.json({ error: 'Product not found or unavailable.' }, { status: 404 })
  }

  // Validate variant if provided
  if (variantId) {
    const variant = await prisma.productVariant.findFirst({
      where: { id: variantId, productId },
    })
    if (!variant) {
      return NextResponse.json({ error: 'Variant not found for this product.' }, { status: 404 })
    }
    if (variant.status === 'OUT_OF_STOCK' || variant.stockQuantity === 0) {
      return NextResponse.json({ error: `Selected variant of "${product.name}" is out of stock.` }, { status: 400 })
    }
    if (variant.status === 'DISCONTINUED') {
      return NextResponse.json({ error: `Selected variant of "${product.name}" is discontinued.` }, { status: 400 })
    }
    if (quantity > variant.stockQuantity) {
      return NextResponse.json(
        { error: `Only ${variant.stockQuantity} unit(s) available for this variant.` },
        { status: 400 },
      )
    }
  } else {
    // No variant: check product stock
    if (product.stock === 0) {
      return NextResponse.json({ error: `"${product.name}" is out of stock.` }, { status: 400 })
    }
  }

  // Upsert cart
  const cart = await prisma.cart.upsert({
    where: { userId: session.userId },
    create: { userId: session.userId },
    update: {},
  })

  // Check existing cart item (same product + same variant)
  const existing = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId,
      variantId: variantId ?? null,
    },
  })

  const newQuantity = (existing?.quantity ?? 0) + quantity

  // Re-check stock for combined quantity
  if (variantId) {
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } })
    if (variant && newQuantity > variant.stockQuantity) {
      return NextResponse.json(
        { error: `Only ${variant.stockQuantity} unit(s) available for this variant.` },
        { status: 400 },
      )
    }
  } else if (newQuantity > product.stock) {
    return NextResponse.json(
      { error: `Only ${product.stock} unit(s) available for "${product.name}".` },
      { status: 400 },
    )
  }

  const item = existing
    ? await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQuantity },
      })
    : await prisma.cartItem.create({
        data: { cartId: cart.id, productId, variantId: variantId ?? null, quantity },
      })

  const countResult = await prisma.cartItem.aggregate({
    where: { cartId: cart.id },
    _sum: { quantity: true },
  })
  const cartCount = countResult._sum.quantity ?? 0

  return NextResponse.json({ success: true, item, cartCount })
}
