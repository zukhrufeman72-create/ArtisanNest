import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

// ── GET /api/products/:productId/variants ─────────────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params
  const id = Number(productId)
  if (!id) return NextResponse.json({ error: 'Invalid product ID.' }, { status: 400 })

  const variants = await prisma.productVariant.findMany({
    where: { productId: id },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ variants })
}

// ── POST /api/products/:productId/variants ────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const session = await getSession()
  if (!session?.userId) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }
  if (session.role !== 'SELLER' && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Seller or admin access required.' }, { status: 403 })
  }

  const { productId } = await params
  const id = Number(productId)
  if (!id) return NextResponse.json({ error: 'Invalid product ID.' }, { status: 400 })

  // Verify product ownership (sellers can only add to their own products)
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 })
  if (session.role === 'SELLER' && product.sellerId !== session.userId) {
    return NextResponse.json({ error: 'You can only manage your own products.' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { color, size, material, design, sku, price, stockQuantity, imageUrl } = body as {
    color?: string; size?: string; material?: string; design?: string
    sku?: string; price?: number; stockQuantity?: number; imageUrl?: string
  }

  if (price === undefined || price < 0) {
    return NextResponse.json({ error: 'Valid price is required.' }, { status: 400 })
  }
  if (stockQuantity === undefined || stockQuantity < 0) {
    return NextResponse.json({ error: 'Valid stock quantity is required.' }, { status: 400 })
  }

  // Ensure at least one attribute is set
  if (!color && !size && !material && !design) {
    return NextResponse.json(
      { error: 'At least one variant attribute (color, size, material, design) is required.' },
      { status: 400 },
    )
  }

  try {
    const variant = await prisma.productVariant.create({
      data: {
        productId: id,
        color: color?.trim() || null,
        size: size?.trim() || null,
        material: material?.trim() || null,
        design: design?.trim() || null,
        sku: sku?.trim() || null,
        price,
        stockQuantity,
        imageUrl: imageUrl || null,
        status: stockQuantity > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK',
      },
    })

    return NextResponse.json({ success: true, variant }, { status: 201 })
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'SKU must be unique.' }, { status: 409 })
    }
    throw e
  }
}
