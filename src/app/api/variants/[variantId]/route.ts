import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

async function getVariantAndCheckAccess(variantId: number, session: { userId: number; role: string }) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: { select: { sellerId: true } } },
  })
  if (!variant) return { variant: null, error: 'Variant not found.', status: 404 }
  if (session.role === 'SELLER' && variant.product.sellerId !== session.userId) {
    return { variant: null, error: 'You can only manage your own product variants.', status: 403 }
  }
  return { variant, error: null, status: 200 }
}

// ── GET /api/variants/:variantId ──────────────────────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ variantId: string }> },
) {
  const { variantId } = await params
  const id = Number(variantId)
  if (!id) return NextResponse.json({ error: 'Invalid variant ID.' }, { status: 400 })

  const variant = await prisma.productVariant.findUnique({
    where: { id },
    include: { product: { select: { name: true, image: true } } },
  })
  if (!variant) return NextResponse.json({ error: 'Variant not found.' }, { status: 404 })

  return NextResponse.json({ variant })
}

// ── PUT /api/variants/:variantId ──────────────────────────────────────────────
export async function PUT(
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

  const { variant, error, status } = await getVariantAndCheckAccess(id, session)
  if (!variant) return NextResponse.json({ error }, { status })

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

  try {
    const updated = await prisma.productVariant.update({
      where: { id },
      data: {
        ...(color !== undefined && { color: color.trim() || null }),
        ...(size !== undefined && { size: size.trim() || null }),
        ...(material !== undefined && { material: material.trim() || null }),
        ...(design !== undefined && { design: design.trim() || null }),
        ...(sku !== undefined && { sku: sku.trim() || null }),
        ...(price !== undefined && { price }),
        ...(stockQuantity !== undefined && {
          stockQuantity,
          status: stockQuantity > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK',
        }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
      },
    })
    return NextResponse.json({ success: true, variant: updated })
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'SKU must be unique.' }, { status: 409 })
    }
    throw e
  }
}

// ── DELETE /api/variants/:variantId ───────────────────────────────────────────
export async function DELETE(
  _request: NextRequest,
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

  const { variant, error, status } = await getVariantAndCheckAccess(id, session)
  if (!variant) return NextResponse.json({ error }, { status })

  await prisma.productVariant.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
