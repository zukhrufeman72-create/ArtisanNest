import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/dal'

type Params = { params: Promise<{ productId: string }> }

// GET /api/products/[productId]/images — public
export async function GET(_req: NextRequest, { params }: Params) {
  const { productId } = await params
  const id = Number(productId)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid product ID.' }, { status: 400 })

  const images = await prisma.productImage.findMany({
    where: { productId: id },
    orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
  })
  return NextResponse.json({ images })
}

// POST /api/products/[productId]/images — seller/admin
export async function POST(req: NextRequest, { params }: Params) {
  const session = await verifySession()
  const { productId } = await params
  const id = Number(productId)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid product ID.' }, { status: 400 })

  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 })

  if (session.role === 'SELLER' && product.sellerId !== session.userId) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }
  if (session.role !== 'SELLER' && session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  const body = await req.json() as { url: string; altText?: string; isPrimary?: boolean; sortOrder?: number }
  if (!body.url) return NextResponse.json({ error: 'URL is required.' }, { status: 400 })

  // If setting as primary, clear existing primary
  if (body.isPrimary) {
    await prisma.productImage.updateMany({ where: { productId: id }, data: { isPrimary: false } })
  }

  // Auto-primary: make first uploaded image primary
  const existingCount = await prisma.productImage.count({ where: { productId: id } })
  const isPrimary = body.isPrimary ?? existingCount === 0

  const image = await prisma.productImage.create({
    data: {
      productId: id,
      url: body.url,
      altText: body.altText ?? null,
      isPrimary,
      sortOrder: body.sortOrder ?? existingCount,
    },
  })

  // Sync product.image thumbnail with primary image
  if (isPrimary) {
    await prisma.product.update({ where: { id }, data: { image: body.url } })
  }

  return NextResponse.json({ image }, { status: 201 })
}

// DELETE /api/products/[productId]/images?imageId=X — seller/admin
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await verifySession()
  const { productId } = await params
  const id = Number(productId)
  const imageId = Number(req.nextUrl.searchParams.get('imageId'))
  if (isNaN(id) || isNaN(imageId)) return NextResponse.json({ error: 'Invalid ID.' }, { status: 400 })

  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 })

  if (session.role === 'SELLER' && product.sellerId !== session.userId) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  await prisma.productImage.delete({ where: { id: imageId, productId: id } })
  return NextResponse.json({ success: true })
}

// PATCH /api/products/[productId]/images — reorder images
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await verifySession()
  const { productId } = await params
  const id = Number(productId)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid product ID.' }, { status: 400 })

  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 })
  if (session.role === 'SELLER' && product.sellerId !== session.userId) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  const body = await req.json() as { imageId: number; isPrimary?: boolean; sortOrder?: number }

  if (body.isPrimary) {
    // Clear existing primary, then set new one
    await prisma.productImage.updateMany({ where: { productId: id }, data: { isPrimary: false } })
    const img = await prisma.productImage.update({
      where: { id: body.imageId, productId: id },
      data: { isPrimary: true },
    })
    // Sync product.image thumbnail
    await prisma.product.update({ where: { id }, data: { image: img.url } })
  } else {
    await prisma.productImage.update({
      where: { id: body.imageId, productId: id },
      data: { ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}) },
    })
  }
  return NextResponse.json({ success: true })
}
