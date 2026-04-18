import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session?.userId) return NextResponse.json({ productIds: [] })

  const items = await prisma.wishlist.findMany({
    where: { userId: session.userId },
    select: { productId: true },
  })

  return NextResponse.json({ productIds: items.map((w) => w.productId) })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session?.userId) {
    return NextResponse.json({ error: 'Please login to save items to your wishlist.' }, { status: 401 })
  }

  const { productId } = await request.json()
  if (!productId) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })

  const existing = await prisma.wishlist.findUnique({
    where: { userId_productId: { userId: session.userId, productId } },
  })

  if (existing) {
    await prisma.wishlist.delete({ where: { id: existing.id } })
    return NextResponse.json({ added: false })
  } else {
    await prisma.wishlist.create({ data: { userId: session.userId, productId } })
    return NextResponse.json({ added: true })
  }
}
