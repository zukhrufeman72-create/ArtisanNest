import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session?.userId || session.role !== 'SELLER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const coupons = await prisma.coupon.findMany({
    where: { sellerId: session.userId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ coupons })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session?.userId || session.role !== 'SELLER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const {
    code,
    discountType,
    discountValue,
    minOrderAmount,
    expiresAt,
    usageLimit,
    isActive,
    description,
  } = body

  if (!code || !discountType || discountValue == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (!['PERCENTAGE', 'FIXED'].includes(discountType)) {
    return NextResponse.json({ error: 'Invalid discount type' }, { status: 400 })
  }
  if (discountValue <= 0) {
    return NextResponse.json({ error: 'Discount value must be positive' }, { status: 400 })
  }
  if (discountType === 'PERCENTAGE' && discountValue > 100) {
    return NextResponse.json({ error: 'Percentage discount cannot exceed 100' }, { status: 400 })
  }

  const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase().trim() } })
  if (existing) {
    return NextResponse.json({ error: 'Coupon code already exists' }, { status: 409 })
  }

  const coupon = await prisma.coupon.create({
    data: {
      code: code.toUpperCase().trim(),
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount ?? 0),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      isActive: isActive ?? true,
      description: description?.trim() || null,
      sellerId: session.userId,
    },
  })

  return NextResponse.json({ coupon }, { status: 201 })
}
