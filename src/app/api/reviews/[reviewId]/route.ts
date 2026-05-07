import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/dal'

type Params = { params: Promise<{ reviewId: string }> }

// PATCH — seller responds to review
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await verifySession()
  const { reviewId } = await params
  const id = Number(reviewId)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID.' }, { status: 400 })

  const body = await req.json() as { response: string }
  if (!body.response) return NextResponse.json({ error: 'Response text is required.' }, { status: 400 })

  if (session.role !== 'SELLER' && session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Only sellers can respond to reviews.' }, { status: 403 })
  }

  const existing = await prisma.reviewResponse.findFirst({ where: { reviewId: id } })
  if (existing) {
    const updated = await prisma.reviewResponse.update({
      where: { id: existing.id },
      data: { response: body.response },
    })
    return NextResponse.json({ response: updated })
  }

  const reviewResponse = await prisma.reviewResponse.create({
    data: { reviewId: id, sellerId: session.userId, response: body.response },
  })
  return NextResponse.json({ response: reviewResponse }, { status: 201 })
}

// DELETE — customer deletes own review, or admin
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await verifySession()
  const { reviewId } = await params
  const id = Number(reviewId)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID.' }, { status: 400 })

  const review = await prisma.review.findUnique({ where: { id } })
  if (!review) return NextResponse.json({ error: 'Review not found.' }, { status: 404 })

  if (session.role === 'CUSTOMER' && review.userId !== session.userId) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  await prisma.review.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
