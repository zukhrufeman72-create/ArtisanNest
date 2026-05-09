import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { requireCustomer } from '@/lib/dal'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const session = await requireCustomer()

  const body = await req.json() as {
    orderId?: unknown
    paymentType?: unknown  // 'advance' | 'full' | 'final'
  }

  const orderId = typeof body.orderId === 'number' ? body.orderId : NaN
  const paymentType = body.paymentType

  if (isNaN(orderId)) {
    return NextResponse.json({ error: 'Invalid order ID.' }, { status: 400 })
  }
  if (!['advance', 'full', 'final'].includes(paymentType as string)) {
    return NextResponse.json({ error: 'Invalid payment type.' }, { status: 400 })
  }

  const order = await prisma.customOrder.findUnique({ where: { id: orderId } })
  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
  if (order.customerId !== session.userId) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }
  if (!order.estimatedPrice) {
    return NextResponse.json({ error: 'No quotation price set for this order.' }, { status: 400 })
  }

  let amount: number

  if (paymentType === 'advance') {
    if (!order.advancePayment || order.advancePayment <= 0) {
      return NextResponse.json({ error: 'No advance payment amount set by seller.' }, { status: 400 })
    }
    amount = order.advancePayment
  } else if (paymentType === 'full') {
    amount = order.estimatedPrice
  } else {
    // 'final' — remaining balance after advance
    const paid = order.advancePayment ?? 0
    amount = order.estimatedPrice - paid
    if (amount <= 0) {
      return NextResponse.json({ error: 'No remaining balance to pay.' }, { status: 400 })
    }
  }

  if (amount < 50) {
    return NextResponse.json({ error: 'Minimum payment amount is Rs. 50.' }, { status: 400 })
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // PKR → paisas
    currency: 'pkr',
    automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
    metadata: {
      userId: String(session.userId),
      customOrderId: String(orderId),
      paymentType: paymentType as string,
    },
  })

  return NextResponse.json({ clientSecret: paymentIntent.client_secret })
}
