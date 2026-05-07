import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/dal'

// POST /api/custom-orders — customer creates request
export async function POST(req: NextRequest) {
  const session = await verifySession()
  if (session.role !== 'CUSTOMER') {
    return NextResponse.json({ error: 'Only customers can create custom orders.' }, { status: 403 })
  }

  const body = await req.json() as {
    title: string
    description: string
    budget?: number
    deadline?: string
    attachments?: string[]
    sellerId?: number
  }

  if (!body.title || !body.description) {
    return NextResponse.json({ error: 'title and description are required.' }, { status: 400 })
  }

  const customOrder = await prisma.customOrder.create({
    data: {
      customerId: session.userId,
      sellerId: body.sellerId ?? null,
      title: body.title,
      description: body.description,
      budget: body.budget ?? null,
      deadline: body.deadline ? new Date(body.deadline) : null,
      attachments: body.attachments ? JSON.stringify(body.attachments) : null,
    },
  })
  return NextResponse.json({ customOrder }, { status: 201 })
}

// GET /api/custom-orders — role-based list
export async function GET(req: NextRequest) {
  const session = await verifySession()
  const { searchParams } = req.nextUrl
  const status = searchParams.get('status') ?? undefined
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const limit = 20

  let where: Record<string, unknown> = {}
  if (session.role === 'CUSTOMER') where = { customerId: session.userId }
  else if (session.role === 'SELLER') where = { sellerId: session.userId }
  // ADMIN sees all

  if (status) where.status = status

  const [orders, total] = await Promise.all([
    prisma.customOrder.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.customOrder.count({ where }),
  ])

  return NextResponse.json({ orders, total, page, pages: Math.ceil(total / limit) })
}
