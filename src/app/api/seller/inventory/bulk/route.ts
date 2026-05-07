import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSeller } from '@/lib/dal'

interface BulkItem {
  productId: number
  stock: number
  reason?: string
}

export async function POST(req: NextRequest) {
  const session = await requireSeller()
  const body = await req.json() as { items: BulkItem[] }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: 'No items provided.' }, { status: 400 })
  }

  // Verify all products belong to this seller
  const productIds = body.items.map((i) => i.productId)
  const owned = await prisma.product.findMany({
    where: { id: { in: productIds }, sellerId: session.userId },
    select: { id: true, stock: true },
  })
  const ownedIds = new Set(owned.map((p) => p.id))
  const forbidden = productIds.filter((id) => !ownedIds.has(id))
  if (forbidden.length > 0) {
    return NextResponse.json({ error: 'Some products do not belong to you.' }, { status: 403 })
  }

  const stockMap = Object.fromEntries(owned.map((p) => [p.id, p.stock]))

  await prisma.$transaction(
    body.items.map((item) =>
      prisma.product.update({
        where: { id: item.productId },
        data: { stock: Math.max(0, item.stock) },
      })
    )
  )

  // Log inventory history for each update
  void Promise.all(
    body.items.map((item) =>
      prisma.inventoryHistory.create({
        data: {
          productId: item.productId,
          action: 'ADJUSTMENT',
          quantity: item.stock - (stockMap[item.productId] ?? 0),
          stockBefore: stockMap[item.productId] ?? 0,
          stockAfter: Math.max(0, item.stock),
          reason: item.reason ?? 'Bulk update',
          createdBy: session.userId,
        },
      })
    )
  ).catch(console.error)

  return NextResponse.json({ ok: true, updated: body.items.length })
}
