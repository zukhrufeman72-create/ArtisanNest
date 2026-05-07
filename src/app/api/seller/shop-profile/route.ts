import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

// ── GET /api/seller/shop-profile ──────────────────────────────────────────────
export async function GET() {
  const session = await getSession()
  if (!session?.userId) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }
  if (session.role !== 'SELLER') {
    return NextResponse.json({ error: 'Seller access required.' }, { status: 403 })
  }

  const profile = await prisma.sellerShopProfile.findUnique({
    where: { sellerId: session.userId },
    include: { seller: { select: { name: true, email: true } } },
  })

  return NextResponse.json({ profile: profile ?? null })
}

// ── POST /api/seller/shop-profile ─────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session?.userId) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }
  if (session.role !== 'SELLER') {
    return NextResponse.json({ error: 'Seller access required.' }, { status: 403 })
  }

  const existing = await prisma.sellerShopProfile.findUnique({
    where: { sellerId: session.userId },
  })
  if (existing) {
    return NextResponse.json(
      { error: 'Shop profile already exists. Use PUT to update.' },
      { status: 409 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const {
    shopName, shopLogo, shopBanner, description, address,
    contactNumber, businessCategory, openingTime, closingTime,
  } = body as Record<string, string | undefined>

  if (!shopName?.trim()) {
    return NextResponse.json({ error: 'Shop name is required.' }, { status: 400 })
  }

  const profile = await prisma.sellerShopProfile.create({
    data: {
      sellerId: session.userId,
      shopName: shopName.trim(),
      shopLogo: shopLogo || null,
      shopBanner: shopBanner || null,
      description: description?.trim() || null,
      address: address?.trim() || null,
      contactNumber: contactNumber?.trim() || null,
      businessCategory: businessCategory?.trim() || null,
      openingTime: openingTime?.trim() || null,
      closingTime: closingTime?.trim() || null,
      status: 'PENDING',
    },
  })

  return NextResponse.json({ success: true, profile }, { status: 201 })
}

// ── PUT /api/seller/shop-profile ──────────────────────────────────────────────
export async function PUT(request: NextRequest) {
  const session = await getSession()
  if (!session?.userId) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }
  if (session.role !== 'SELLER') {
    return NextResponse.json({ error: 'Seller access required.' }, { status: 403 })
  }

  const existing = await prisma.sellerShopProfile.findUnique({
    where: { sellerId: session.userId },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Shop profile not found. Create one first.' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const {
    shopName, shopLogo, shopBanner, description, address,
    contactNumber, businessCategory, openingTime, closingTime,
  } = body as Record<string, string | undefined>

  if (shopName !== undefined && !shopName.trim()) {
    return NextResponse.json({ error: 'Shop name cannot be empty.' }, { status: 400 })
  }

  const profile = await prisma.sellerShopProfile.update({
    where: { sellerId: session.userId },
    data: {
      ...(shopName !== undefined && { shopName: shopName.trim() }),
      ...(shopLogo !== undefined && { shopLogo: shopLogo || null }),
      ...(shopBanner !== undefined && { shopBanner: shopBanner || null }),
      ...(description !== undefined && { description: description.trim() || null }),
      ...(address !== undefined && { address: address.trim() || null }),
      ...(contactNumber !== undefined && { contactNumber: contactNumber.trim() || null }),
      ...(businessCategory !== undefined && { businessCategory: businessCategory.trim() || null }),
      ...(openingTime !== undefined && { openingTime: openingTime.trim() || null }),
      ...(closingTime !== undefined && { closingTime: closingTime.trim() || null }),
    },
  })

  return NextResponse.json({ success: true, profile })
}
