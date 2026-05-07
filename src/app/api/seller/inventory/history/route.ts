import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSeller } from '@/lib/dal'

export async function GET(req: NextRequest) {
  const session = await requireSeller()
  const { searchParams } = req.nextUrl
  const productId = searchParams.get('productId') ? Number(searchParams.get('productId')) : undefined
  const action = searchParams.get('action') ?? undefined
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const limit = 30

  // Get all product IDs for this seller
  const sellerProducts = await prisma.product.findMany({
    where: { sellerId: session.userId },
    select: { id: true },
  })
  const productIds = sellerProducts.map((p) => p.id)
  if (productId && !productIds.includes(productId)) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  const where = {
    productId: productId ? productId : { in: productIds },
    ...(action ? { action: action as 'RESTOCK' | 'SOLD' | 'ADJUSTMENT' | 'RETURN' | 'DAMAGE' | 'INITIAL' } : {}),
  }

  const [history, total] = await Promise.all([
    prisma.inventoryHistory.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, image: true } },
        variant: { select: { id: true, color: true, size: true } },
        createdByUser: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.inventoryHistory.count({ where }),
  ])

  return NextResponse.json({ history, total, page, pages: Math.ceil(total / limit) })
}
