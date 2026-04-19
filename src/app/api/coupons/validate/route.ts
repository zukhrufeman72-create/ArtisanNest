import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const { code, subtotal } = await request.json()

  if (!code || subtotal == null) {
    return NextResponse.json({ error: 'Missing code or subtotal' }, { status: 400 })
  }

  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase().trim() },
  })

  if (!coupon) {
    return NextResponse.json({ error: 'Invalid coupon code' }, { status: 404 })
  }
  if (!coupon.isActive) {
    return NextResponse.json({ error: 'This coupon is no longer active' }, { status: 400 })
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return NextResponse.json({ error: 'This coupon has expired' }, { status: 400 })
  }
  if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) {
    return NextResponse.json({ error: 'This coupon has reached its usage limit' }, { status: 400 })
  }
  if (subtotal < coupon.minOrderAmount) {
    return NextResponse.json(
      { error: `Minimum order amount is Rs. ${coupon.minOrderAmount.toLocaleString()} for this coupon` },
      { status: 400 }
    )
  }

  const discountAmount =
    coupon.discountType === 'PERCENTAGE'
      ? Math.min((subtotal * coupon.discountValue) / 100, subtotal)
      : Math.min(coupon.discountValue, subtotal)

  return NextResponse.json({
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      description: coupon.description,
    },
    discountAmount: Math.round(discountAmount),
  })
}
