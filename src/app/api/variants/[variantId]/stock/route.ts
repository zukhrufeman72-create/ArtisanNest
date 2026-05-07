import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

// ── PATCH /api/variants/:variantId/stock ──────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ variantId: string }> },
) {
  const session = await getSession()
  if (!session?.userId) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }
  if (session.role !== 'SELLER' && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Seller or admin access required.' }, { status: 403 })
  }

  const { variantId } = await params
  const id = Number(variantId)
  if (!id) return NextResponse.json({ error: 'Invalid variant ID.' }, { status: 400 })

  const variant = await prisma.productVariant.findUnique({
    where: { id },
    include: { product: { select: { sellerId: true } } },
  })
  if (!variant) return NextResponse.json({ error: 'Variant not found.' }, { status: 404 })
  if (session.role === 'SELLER' && variant.product.sellerId !== session.userId) {
    return NextResponse.json({ error: 'Access denied.' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { stockQuantity } = body as { stockQuantity?: number }

  if (stockQuantity === undefined || typeof stockQuantity !== 'number' || stockQuantity < 0) {
    return NextResponse.json({ error: 'Valid stockQuantity (>= 0) is required.' }, { status: 400 })
  }

  const updated = await prisma.productVariant.update({
    where: { id },
    data: {
      stockQuantity,
      status: stockQuantity > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK',
    },
  })

  return NextResponse.json({ success: true, variant: updated })
}
