import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/dal'

// GET /api/admin/refunds
export async function GET(req: NextRequest) {
  await requireAdmin()
  const { searchParams } = req.nextUrl
  const status = searchParams.get('status') ?? undefined
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const limit = 20

  const where = status ? { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED' } : {}

  const [refunds, total] = await Promise.all([
    prisma.refundRequest.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        order: { select: { id: true, totalPrice: true, createdAt: true } },
        processedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.refundRequest.count({ where }),
  ])

  return NextResponse.json({ refunds, total, page, pages: Math.ceil(total / limit) })
}
