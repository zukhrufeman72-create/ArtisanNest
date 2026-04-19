import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { sendOrderConfirmationEmail } from '@/lib/email'
import { createNotification } from '@/lib/notifications'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const SHIPPING_FEES: Record<string, number> = {
  STANDARD: 250,
  EXPRESS: 500,
}
const TAX_RATE = 0.10

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session?.userId) {
    return NextResponse.json({ error: 'Please login to place an order' }, { status: 401 })
  }

  const body = await request.json()
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
  } = body

  if (!customerName || !customerEmail || !customerPhone) {
    return NextResponse.json({ error: 'Customer information is required' }, { status: 400 })
  }
  if (!country || !state || !city || !address || !postalCode) {
    return NextResponse.json({ error: 'Complete shipping address is required' }, { status: 400 })
  }
  if (!shippingMethod || !['STANDARD', 'EXPRESS'].includes(shippingMethod)) {
    return NextResponse.json({ error: 'Invalid shipping method' }, { status: 400 })
  }
  if (!paymentMethod || !['COD', 'STRIPE'].includes(paymentMethod)) {
    return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
  }
  if (paymentMethod === 'STRIPE') {
    if (!stripePaymentIntentId) {
      return NextResponse.json({ error: 'Payment not completed. Please complete card payment.' }, { status: 400 })
    }
    // Verify the PaymentIntent actually succeeded
    try {
      const pi = await stripe.paymentIntents.retrieve(stripePaymentIntentId)
      if (pi.status !== 'succeeded') {
        return NextResponse.json({ error: 'Payment was not successful. Please try again.' }, { status: 400 })
      }
    } catch {
      return NextResponse.json({ error: 'Could not verify payment. Please try again.' }, { status: 400 })
    }
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: session.userId },
    include: {
      items: {
        include: {
          product: { select: { id: true, price: true, discountPrice: true, stock: true, name: true } },
        },
      },
    },
  })

  if (!cart || cart.items.length === 0) {
    return NextResponse.json({ error: 'Your cart is empty' }, { status: 400 })
  }

  for (const item of cart.items) {
    if (item.quantity > item.product.stock) {
      return NextResponse.json(
        { error: `"${item.product.name}" has only ${item.product.stock} units in stock` },
        { status: 400 }
      )
    }
  }

  const subtotal = cart.items.reduce((sum, item) => {
    return sum + (item.product.discountPrice ?? item.product.price) * item.quantity
  }, 0)

  const shippingFee = subtotal >= 5000 ? 0 : SHIPPING_FEES[shippingMethod]
  const tax = Math.round(subtotal * TAX_RATE)
  const discount = discountAmount ? Math.min(Number(discountAmount), subtotal) : 0
  const totalPrice = subtotal + shippingFee + tax - discount

  const shippingAddress = JSON.stringify({ country, state, city, address, postalCode })

  const order = await prisma.order.create({
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
          quantity: item.quantity,
          price: item.product.discountPrice ?? item.product.price,
        })),
      },
    },
  })

  await Promise.all([
    ...cart.items.map((item) =>
      prisma.product.update({
        where: { id: item.product.id },
        data: { stock: { decrement: item.quantity } },
      })
    ),
    prisma.cartItem.deleteMany({ where: { cartId: cart.id } }),
    ...(couponId
      ? [prisma.coupon.update({ where: { id: Number(couponId) }, data: { usageCount: { increment: 1 } } })]
      : []),
  ])

  // Fire-and-forget: send confirmation email + in-app notification
  const emailItems = cart.items.map((i) => ({
    name: i.product.name,
    quantity: i.quantity,
    price: i.product.discountPrice ?? i.product.price,
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

  return NextResponse.json({ success: true, orderId: order.id })
}
