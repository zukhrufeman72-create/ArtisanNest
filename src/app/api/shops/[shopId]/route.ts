import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ── GET /api/shops/:shopId ─────────────────────────────────────────────────────
// Public: get a single shop profile with seller's products
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> },
) {
  const { shopId } = await params
  const id = Number(shopId)
  if (!id) return NextResponse.json({ error: 'Invalid shop ID.' }, { status: 400 })

  const shop = await prisma.sellerShopProfile.findFirst({
    where: { id, status: 'ACTIVE' },
    include: {
      seller: {
        select: {
          id: true,
          name: true,
          createdAt: true,
          products: {
            where: { isApproved: true, isActive: true },
            orderBy: { createdAt: 'desc' },
            take: 20,
            select: {
              id: true,
              name: true,
              shortDescription: true,
              price: true,
              discountPrice: true,
              stock: true,
              image: true,
              category: { select: { name: true } },
              _count: { select: { reviews: true } },
            },
          },
        },
      },
    },
  })

  if (!shop) return NextResponse.json({ error: 'Shop not found.' }, { status: 404 })

  return NextResponse.json({ shop })
}
