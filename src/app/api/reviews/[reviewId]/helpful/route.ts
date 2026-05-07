import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/dal'

type Params = { params: Promise<{ reviewId: string }> }

// POST — toggle helpful vote
export async function POST(_req: NextRequest, { params }: Params) {
  const session = await verifySession()
  const { reviewId } = await params
  const id = Number(reviewId)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID.' }, { status: 400 })

  const existing = await prisma.reviewHelpful.findUnique({
    where: { reviewId_userId: { userId: session.userId, reviewId: id } },
  })

  if (existing) {
    await prisma.reviewHelpful.delete({ where: { reviewId_userId: { userId: session.userId, reviewId: id } } })
    await prisma.review.update({ where: { id }, data: { helpfulCount: { decrement: 1 } } })
    return NextResponse.json({ helpful: false })
  }

  await prisma.reviewHelpful.create({ data: { userId: session.userId, reviewId: id } })
  await prisma.review.update({ where: { id }, data: { helpfulCount: { increment: 1 } } })
  return NextResponse.json({ helpful: true })
}
