import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/dal'

type Params = { params: Promise<{ refundId: string }> }

// PATCH /api/admin/refunds/[refundId] — approve or reject
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await requireAdmin()
  const { refundId } = await params
  const id = Number(refundId)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID.' }, { status: 400 })

  const body = await req.json() as { status: 'APPROVED' | 'REJECTED' | 'PROCESSED'; adminNote?: string }
  if (!['APPROVED', 'REJECTED', 'PROCESSED'].includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
  }

  const refund = await prisma.refundRequest.update({
    where: { id },
    data: {
      status: body.status,
      adminNote: body.adminNote ?? null,
      processedById: session.userId,
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  })

  // Log audit trail
  void prisma.auditLog.create({
    data: {
      userId: session.userId,
      userRole: session.role,
      action: `REFUND_${body.status}`,
      entity: 'RefundRequest',
      entityId: String(id),
    },
  }).catch(console.error)

  return NextResponse.json({ refund })
}
