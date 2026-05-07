import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSession } from '@/lib/session'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  // ── Authentication ────────────────────────────────────────────────────────
  const session = await getSession()
  if (!session?.userId) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  // ── Role guard: only CUSTOMER may initiate payments ───────────────────────
  if (session.role !== 'CUSTOMER') {
    return NextResponse.json(
      { error: 'Only customer accounts can initiate payments.' },
      { status: 403 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { amount } = body as { amount?: unknown }

  // Amount is in PKR. Stripe requires smallest unit (paisa = 1/100 rupee).
  // Minimum charge is 50 PKR.
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 50) {
    return NextResponse.json({ error: 'Invalid payment amount.' }, { status: 400 })
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Rs. → paisas
    currency: 'pkr',
    automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
    metadata: {
      // Embed userId so checkout route can verify ownership
      userId: String(session.userId),
    },
  })

  return NextResponse.json({ clientSecret: paymentIntent.client_secret })
}
