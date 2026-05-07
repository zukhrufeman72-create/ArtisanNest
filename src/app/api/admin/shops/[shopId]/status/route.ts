import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

// ── PATCH /api/admin/shops/:shopId/status ─────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> },
) {
  const session = await getSession()
  if (!session?.userId || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 })
  }

  const { shopId } = await params
  const id = Number(shopId)
  if (!id) return NextResponse.json({ error: 'Invalid shop ID.' }, { status: 400 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { status } = body as { status?: string }
  const allowed = ['PENDING', 'ACTIVE', 'BLOCKED', 'INACTIVE']
  if (!status || !allowed.includes(status)) {
    return NextResponse.json(
      { error: `Status must be one of: ${allowed.join(', ')}` },
      { status: 400 },
    )
  }

  const shop = await prisma.sellerShopProfile.findUnique({ where: { id } })
  if (!shop) return NextResponse.json({ error: 'Shop not found.' }, { status: 404 })

  const updated = await prisma.sellerShopProfile.update({
    where: { id },
    data: { status: status as 'PENDING' | 'ACTIVE' | 'BLOCKED' | 'INACTIVE' },
  })

  return NextResponse.json({ success: true, shop: updated })
}
