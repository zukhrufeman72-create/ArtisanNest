import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/dal'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const dealId = Number(id)
  if (isNaN(dealId)) return NextResponse.json({ error: 'Invalid ID.' }, { status: 400 })

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: {
      products: { include: { product: { select: { id: true, name: true, price: true, image: true } } } },
      creator: { select: { id: true, name: true } },
    },
  })
  if (!deal) return NextResponse.json({ error: 'Deal not found.' }, { status: 404 })
  return NextResponse.json({ deal })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await requireAdmin()
  const { id } = await params
  const dealId = Number(id)
  if (isNaN(dealId)) return NextResponse.json({ error: 'Invalid ID.' }, { status: 400 })

  const body = await req.json() as {
    title?: string
    discountType?: string
    discountValue?: number
    startDate?: string
    endDate?: string
    status?: string
    bannerImage?: string
    isGlobal?: boolean
  }

  const deal = await prisma.deal.update({
    where: { id: dealId },
    data: {
      ...(body.title ? { title: body.title } : {}),
      ...(body.discountType ? { discountType: body.discountType } : {}),
      ...(body.discountValue !== undefined ? { discountValue: body.discountValue } : {}),
      ...(body.startDate ? { startDate: new Date(body.startDate) } : {}),
      ...(body.endDate ? { endDate: new Date(body.endDate) } : {}),
      ...(body.status ? { status: body.status as 'SCHEDULED' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' } : {}),
      ...(body.bannerImage !== undefined ? { bannerImage: body.bannerImage } : {}),
      ...(body.isGlobal !== undefined ? { isGlobal: body.isGlobal } : {}),
    },
  })

  void prisma.auditLog.create({
    data: { userId: session.userId, userRole: session.role, action: 'UPDATE_DEAL', entity: 'Deal', entityId: String(dealId) },
  }).catch(console.error)

  return NextResponse.json({ deal })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await requireAdmin()
  const { id } = await params
  const dealId = Number(id)
  if (isNaN(dealId)) return NextResponse.json({ error: 'Invalid ID.' }, { status: 400 })

  await prisma.deal.delete({ where: { id: dealId } })

  void prisma.auditLog.create({
    data: { userId: session.userId, userRole: session.role, action: 'DELETE_DEAL', entity: 'Deal', entityId: String(dealId) },
  }).catch(console.error)

  return NextResponse.json({ success: true })
}
