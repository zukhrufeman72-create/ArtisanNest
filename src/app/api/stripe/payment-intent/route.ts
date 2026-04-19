import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSession } from '@/lib/session'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session?.userId) {
    return NextResponse.json({ error: 'Please login to proceed' }, { status: 401 })
  }

  const { amount } = await request.json()

  // amount is in PKR. Stripe requires smallest unit (paisa = 1/100 rupee)
  // Minimum charge is 50 PKR
  if (!amount || typeof amount !== 'number' || amount < 50) {
    return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 })
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Rs. → paisas
    currency: 'pkr',
    automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
    metadata: {
      userId: String(session.userId),
    },
  })

  return NextResponse.json({ clientSecret: paymentIntent.client_secret })
}
