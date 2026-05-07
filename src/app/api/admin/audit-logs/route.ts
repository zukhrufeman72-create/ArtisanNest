import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/dal'

export async function GET(req: NextRequest) {
  await requireAdmin()
  const { searchParams } = req.nextUrl
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const limit = 50
  const action = searchParams.get('action') ?? undefined
  const entity = searchParams.get('entity') ?? undefined
  const userId = searchParams.get('userId') ? Number(searchParams.get('userId')) : undefined
  const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined
  const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined

  const where = {
    ...(action ? { action: { contains: action } } : {}),
    ...(entity ? { entity } : {}),
    ...(userId ? { userId } : {}),
    ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ])

  return NextResponse.json({ logs, total, page, pages: Math.ceil(total / limit) })
}
