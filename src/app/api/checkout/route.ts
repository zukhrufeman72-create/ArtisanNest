import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { sendOrderConfirmationEmail } from '@/lib/email'
import { createNotification } from '@/lib/notifications'
import { CheckoutBodySchema, LOW_STOCK_THRESHOLD } from '@/lib/validations'
import { randomUUID } from 'crypto'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const SHIPPING_FEES: Record<string, number> = {
  STANDARD: 250,
  EXPRESS: 500,
}
const TAX_RATE = 0.10

export async function POST(request: NextRequest) {
  // ── Authentication ────────────────────────────────────────────────────────
  const session = await getSession()
  if (!session?.userId) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  // ── Role guard: only CUSTOMER may place orders ────────────────────────────
  if (session.role !== 'CUSTOMER') {
    return NextResponse.json(
      { error: 'Only customers can place orders. Admin and seller accounts cannot checkout.' },
      { status: 403 },
    )
  }

  // ── Input validation (Zod) ────────────────────────────────────────────────
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const parsed = CheckoutBodySchema.safeParse(body)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Invalid request.'
    return NextResponse.json({ error: firstError }, { status: 400 })
  }

  const {
    customerName,
    customerEmail,
    customerPhone,
    country,
    state,
    city,
    address,
    postalCode,
    addressLabel,
    shippingMethod,
    paymentMethod,
    stripePaymentIntentId,
    couponId,
    couponCode,
    discountAmount,
    orderNotes,
  } = parsed.data

  // ── Stripe payment verification ───────────────────────────────────────────
  if (paymentMethod === 'STRIPE') {
    if (!stripePaymentIntentId) {
      return NextResponse.json({ error: 'Payment not completed. Please complete card payment.' }, { status: 400 })
    }
    try {
      const pi = await stripe.paymentIntents.retrieve(stripePaymentIntentId)
      if (pi.status !== 'succeeded') {
        return NextResponse.json({ error: 'Payment was not successful. Please try again.' }, { status: 400 })
      }
      if (pi.metadata?.userId !== String(session.userId)) {
        return NextResponse.json({ error: 'Payment intent does not belong to this session.' }, { status: 403 })
      }
    } catch {
      return NextResponse.json({ error: 'Could not verify payment. Please try again.' }, { status: 400 })
    }
  }

  // ── Fetch cart ────────────────────────────────────────────────────────────
  const cart = await prisma.cart.findUnique({
    where: { userId: session.userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true, price: true, discountPrice: true,
              stock: true, name: true, isApproved: true, isActive: true, sellerId: true,
            },
          },
          variant: {
            select: {
              id: true, price: true, stockQuantity: true,
              status: true, color: true, size: true, material: true, design: true,
            },
          },
        },
      },
    },
  })

  if (!cart || cart.items.length === 0) {
    return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 })
  }

  // ── Stock & product status validation ─────────────────────────────────────
  for (const item of cart.items) {
    if (!item.product.isApproved || !item.product.isActive) {
      return NextResponse.json(
        { error: `"${item.product.name}" is no longer available.` },
        { status: 400 },
      )
    }

    if (item.variant) {
      // Variant stock check
      if (item.variant.status === 'OUT_OF_STOCK' || item.variant.stockQuantity === 0) {
        return NextResponse.json(
          { error: `Selected variant of "${item.product.name}" is out of stock.` },
          { status: 400 },
        )
      }
      if (item.variant.status === 'DISCONTINUED') {
        return NextResponse.json(
          { error: `Selected variant of "${item.product.name}" is discontinued.` },
          { status: 400 },
        )
      }
      if (item.quantity > item.variant.stockQuantity) {
        return NextResponse.json(
          { error: `"${item.product.name}" variant has only ${item.variant.stockQuantity} unit(s) in stock.` },
          { status: 400 },
        )
      }
    } else {
      // Base product stock check
      if (item.product.stock === 0) {
        return NextResponse.json(
          { error: `"${item.product.name}" is out of stock and cannot be ordered.` },
          { status: 400 },
        )
      }
      if (item.quantity > item.product.stock) {
        return NextResponse.json(
          { error: `"${item.product.name}" has only ${item.product.stock} unit(s) in stock.` },
          { status: 400 },
        )
      }
    }
  }

  // ── Calculate totals ──────────────────────────────────────────────────────
  const subtotal = cart.items.reduce((sum, item) => {
    const unitPrice = item.variant?.price ?? (item.product.discountPrice ?? item.product.price)
    return sum + unitPrice * item.quantity
  }, 0)

  const shippingFee = subtotal >= 5000 ? 0 : SHIPPING_FEES[shippingMethod]
  const tax = Math.round(subtotal * TAX_RATE)
  const discount = discountAmount ? Math.min(Number(discountAmount), subtotal) : 0
  const totalPrice = subtotal + shippingFee + tax - discount
  const shippingAddress = JSON.stringify({ country, state, city, address, postalCode })

  // ── Create order in a database transaction ────────────────────────────────
  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        userId: session.userId,
        totalPrice,
        subtotal,
        shippingFee,
        tax,
        discount,
        status: paymentMethod === 'COD' ? 'PENDING' : 'PAID',
        customerName,
        customerEmail,
        customerPhone,
        shippingMethod,
        shippingAddress,
        addressLabel: addressLabel || null,
        paymentMethod,
        paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PAID',
        stripePaymentId: stripePaymentIntentId ?? null,
        couponId: couponId ? Number(couponId) : null,
        couponCode: couponCode || null,
        orderNotes: orderNotes?.trim() || null,
        items: {
          create: cart.items.map((item) => ({
            productId: item.product.id,
            variantId: item.variant?.id ?? null,
            quantity: item.quantity,
            price: item.variant?.price ?? (item.product.discountPrice ?? item.product.price),
            color: item.variant?.color ?? null,
            size: item.variant?.size ?? null,
            material: item.variant?.material ?? null,
            design: item.variant?.design ?? null,
          })),
        },
      },
    })

    // Decrement variant stock or product stock
    await Promise.all(
      cart.items.map((item) => {
        if (item.variant) {
          return tx.productVariant.update({
            where: { id: item.variant.id },
            data: {
              stockQuantity: { decrement: item.quantity },
              status: item.variant.stockQuantity - item.quantity <= 0 ? 'OUT_OF_STOCK' : 'AVAILABLE',
            },
          })
        } else {
          return tx.product.update({
            where: { id: item.product.id },
            data: { stock: { decrement: item.quantity } },
          })
        }
      }),
    )

    // Clear cart
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } })

    // Update coupon usage
    if (couponId) {
      await tx.coupon.update({
        where: { id: Number(couponId) },
        data: { usageCount: { increment: 1 } },
      })
    }

    // Create payment transaction record
    const sellerId = cart.items[0]?.product.sellerId ?? null
    await tx.paymentTransaction.create({
      data: {
        orderId: newOrder.id,
        customerId: session.userId,
        sellerId,
        transactionId: randomUUID(),
        paymentMethod,
        paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'SUCCESS',
        amount: totalPrice,
        currency: 'PKR',
        stripePaymentIntentId: stripePaymentIntentId ?? null,
      },
    })

    // Create delivery tracking record
    await tx.deliveryTracking.create({
      data: {
        orderId: newOrder.id,
        status: 'PENDING',
        history: {
          create: {
            status: 'PENDING',
            remarks: 'Order placed successfully.',
          },
        },
      },
    })

    return newOrder
  })

  // ── Fire-and-forget notifications ─────────────────────────────────────────
  const emailItems = cart.items.map((i) => ({
    name: i.product.name,
    quantity: i.quantity,
    price: i.variant?.price ?? (i.product.discountPrice ?? i.product.price),
  }))
  const readableAddress = `${address}, ${city}, ${state}, ${country} ${postalCode}`

  void sendOrderConfirmationEmail(
    customerEmail, customerName, order.id,
    emailItems, subtotal, shippingFee, tax, discount, totalPrice,
    paymentMethod, shippingMethod, readableAddress, orderNotes ?? null,
  ).catch(console.error)

  void createNotification({
    userId: session.userId,
    title: '🎉 Order Placed Successfully!',
    body: `Your order #${order.id} has been confirmed. We'll keep you updated.`,
    type: 'NEW_ORDER',
    link: '/orders',
  }).catch(console.error)

  // Low-stock alerts for sellers
  void (async () => {
    for (const item of cart.items) {
      if (item.variant) {
        const updated = await prisma.productVariant.findUnique({
          where: { id: item.variant.id },
          select: { stockQuantity: true, product: { select: { name: true, sellerId: true } } },
        })
        if (updated && updated.stockQuantity < LOW_STOCK_THRESHOLD) {
          await createNotification({
            userId: updated.product.sellerId,
            title: updated.stockQuantity === 0 ? '🚨 Variant Out of Stock!' : '⚠️ Variant Low Stock',
            body: `Variant of "${updated.product.name}" has ${updated.stockQuantity} unit(s) left.`,
            type: 'STOCK_ALERT',
            link: '/seller/inventory',
          })
        }
      } else {
        const updated = await prisma.product.findUnique({
          where: { id: item.product.id },
          select: { stock: true, name: true, sellerId: true },
        })
        if (updated && updated.stock < LOW_STOCK_THRESHOLD) {
          await createNotification({
            userId: updated.sellerId,
            title: updated.stock === 0 ? '🚨 Product Out of Stock!' : '⚠️ Low Stock Alert',
            body: updated.stock === 0
              ? `"${updated.name}" is now out of stock.`
              : `"${updated.name}" has only ${updated.stock} unit(s) left.`,
            type: 'STOCK_ALERT',
            link: '/seller/inventory',
          })
        }
      }
    }
  })().catch(console.error)

  return NextResponse.json({ success: true, orderId: order.id })
}
