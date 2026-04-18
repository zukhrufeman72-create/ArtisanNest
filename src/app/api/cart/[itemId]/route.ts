import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const session = await getSession()
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { itemId } = await params
  const { quantity } = await request.json()

  if (!quantity || quantity < 1) {
    return NextResponse.json({ error: 'Invalid quantity.' }, { status: 400 })
  }

  // Verify the item belongs to this user's cart
  const item = await prisma.cartItem.findFirst({
    where: { id: Number(itemId), cart: { userId: session.userId } },
  })
  if (!item) return NextResponse.json({ error: 'Item not found.' }, { status: 404 })

  const updated = await prisma.cartItem.update({
    where: { id: item.id },
    data: { quantity },
  })

  const countResult = await prisma.cartItem.aggregate({
    where: { cartId: item.cartId },
    _sum: { quantity: true },
  })

  return NextResponse.json({ success: true, item: updated, cartCount: countResult._sum.quantity ?? 0 })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const session = await getSession()
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { itemId } = await params

  // Verify the item belongs to this user's cart
  const item = await prisma.cartItem.findFirst({
    where: { id: Number(itemId), cart: { userId: session.userId } },
  })
  if (!item) return NextResponse.json({ error: 'Item not found.' }, { status: 404 })

  await prisma.cartItem.delete({ where: { id: item.id } })

  const countResult = await prisma.cartItem.aggregate({
    where: { cartId: item.cartId },
    _sum: { quantity: true },
  })

  return NextResponse.json({ success: true, cartCount: countResult._sum.quantity ?? 0 })
}
