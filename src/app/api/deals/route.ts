import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, getOptionalSession } from '@/lib/dal'

// GET /api/deals — public active deals
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const active = searchParams.get('active') === 'true'
  const now = new Date()

  const where = active
    ? { status: 'ACTIVE' as const, startDate: { lte: now }, endDate: { gte: now } }
    : {}

  const deals = await prisma.deal.findMany({
    where,
    include: {
      products: {
        include: {
          product: {
            select: { id: true, name: true, price: true, image: true },
          },
        },
      },
      creator: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ deals })
}

// POST /api/deals — admin creates deal
export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  const body = await req.json() as {
    title: string
    discountType: 'PERCENTAGE' | 'FIXED'
    discountValue: number
    startDate: string
    endDate: string
    bannerImage?: string
    isGlobal?: boolean
    productIds?: number[]
  }

  if (!body.title || !body.discountType || !body.discountValue || !body.startDate || !body.endDate) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  const deal = await prisma.deal.create({
    data: {
      title: body.title,
      discountType: body.discountType,
      discountValue: body.discountValue,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      bannerImage: body.bannerImage ?? null,
      isGlobal: body.isGlobal ?? false,
      createdBy: session.userId,
      status: new Date(body.startDate) <= new Date() ? 'ACTIVE' : 'SCHEDULED',
      products: body.productIds?.length
        ? {
            create: body.productIds.map((productId) => ({ productId })),
          }
        : undefined,
    },
    include: { products: true },
  })

  void prisma.auditLog.create({
    data: { userId: session.userId, userRole: session.role, action: 'CREATE_DEAL', entity: 'Deal', entityId: String(deal.id) },
  }).catch(console.error)

  return NextResponse.json({ deal }, { status: 201 })
}
