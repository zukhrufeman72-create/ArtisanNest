import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session?.userId || session.role !== 'SELLER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const couponId = parseInt(id)
  if (isNaN(couponId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  const existing = await prisma.coupon.findUnique({ where: { id: couponId } })
  if (!existing || existing.sellerId !== session.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
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

  if (code && code.toUpperCase().trim() !== existing.code) {
    const conflict = await prisma.coupon.findUnique({ where: { code: code.toUpperCase().trim() } })
    if (conflict) return NextResponse.json({ error: 'Coupon code already exists' }, { status: 409 })
  }

  const updated = await prisma.coupon.update({
    where: { id: couponId },
    data: {
      ...(code && { code: code.toUpperCase().trim() }),
      ...(discountType && { discountType }),
      ...(discountValue != null && { discountValue: Number(discountValue) }),
      ...(minOrderAmount != null && { minOrderAmount: Number(minOrderAmount) }),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      ...(usageLimit != null && { usageLimit: usageLimit ? Number(usageLimit) : null }),
      ...(isActive != null && { isActive }),
      ...(description !== undefined && { description: description?.trim() || null }),
    },
  })

  return NextResponse.json({ coupon: updated })
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session?.userId || session.role !== 'SELLER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const couponId = parseInt(id)
  if (isNaN(couponId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  const existing = await prisma.coupon.findUnique({ where: { id: couponId } })
  if (!existing || existing.sellerId !== session.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.coupon.delete({ where: { id: couponId } })
  return NextResponse.json({ success: true })
}
