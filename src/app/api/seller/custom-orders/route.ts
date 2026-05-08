import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(_req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'SELLER') {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const orders = await prisma.customOrder.findMany({
    where: {
      OR: [
        { sellerId: session.userId },
        { sellerId: null },
      ],
    },
    select: {
      id: true,
      title: true,
      status: true,
      paymentStatus: true,
      estimatedPrice: true,
      budget: true,
      createdAt: true,
      customer: { select: { id: true, name: true, email: true } },
      images: {
        where: { imageType: 'reference' },
        take: 1,
        select: { url: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ success: true, orders })
}
