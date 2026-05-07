'use server'

import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/dal'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { notifyAdmin } from '@/lib/notifications'
import { nameSchema } from '@/lib/validations'

export async function addProduct(formData: FormData) {
  const session = await verifySession()

  const name = String(formData.get('name')).trim()
  const shortDescription = String(formData.get('shortDescription')).trim()
  const price = parseFloat(String(formData.get('price')))
  const discountPriceRaw = String(formData.get('discountPrice')).trim()
  const discountPrice = discountPriceRaw ? parseFloat(discountPriceRaw) : null
  const stock = parseInt(String(formData.get('stock')), 10)
  const categoryId = parseInt(String(formData.get('categoryId')), 10)
  const material = String(formData.get('material')).trim() || null
  const origin = String(formData.get('origin')).trim() || null

  if (!name || !shortDescription || isNaN(price) || isNaN(stock) || isNaN(categoryId)) {
    return { error: 'Please fill in all required fields.' }
  }

  const product = await prisma.product.create({
    data: {
      name,
      shortDescription,
      price,
      discountPrice,
      stock,
      material,
      origin,
      sellerId: session.userId,
      categoryId,
      isApproved: false,
      isActive: true,
    },
  })

  try {
    await notifyAdmin({
      type: 'PRODUCT_SUBMITTED',
      title: '🆕 New Product Submitted',
      body: `A seller submitted "${name}" for review. Approve or reject it in the Products section.`,
      link: '/admin/products/approvals',
    })
  } catch {}

  revalidatePath('/seller/products')
  redirect(`/seller/products/${product.id}/variants`)
}

export async function updateProduct(formData: FormData) {
  const session = await verifySession()
  const productId = parseInt(String(formData.get('productId')), 10)

  const product = await prisma.product.findFirst({
    where: { id: productId, sellerId: session.userId },
  })
  if (!product) return { error: 'Product not found.' }

  const name = String(formData.get('name')).trim()
  const shortDescription = String(formData.get('shortDescription')).trim()
  const price = parseFloat(String(formData.get('price')))
  const discountPriceRaw = String(formData.get('discountPrice')).trim()
  const discountPrice = discountPriceRaw ? parseFloat(discountPriceRaw) : null
  const stock = parseInt(String(formData.get('stock')), 10)
  const categoryId = parseInt(String(formData.get('categoryId')), 10)
  const material = String(formData.get('material')).trim() || null
  const origin = String(formData.get('origin')).trim() || null

  await prisma.product.update({
    where: { id: productId },
    data: { name, shortDescription, price, discountPrice, stock, material, origin, categoryId },
  })

  revalidatePath('/seller/products')
  redirect('/seller/products')
}

export async function deleteProduct(formData: FormData) {
  const session = await verifySession()
  const productId = parseInt(String(formData.get('productId')), 10)

  await prisma.product.deleteMany({
    where: { id: productId, sellerId: session.userId },
  })

  revalidatePath('/seller/products')
  revalidatePath('/seller/inventory')
}

export async function updateStock(formData: FormData) {
  const session = await verifySession()
  const productId = parseInt(String(formData.get('productId')), 10)
  const stock = parseInt(String(formData.get('stock')), 10)

  if (isNaN(stock) || stock < 0) return

  await prisma.product.updateMany({
    where: { id: productId, sellerId: session.userId },
    data: { stock },
  })

  revalidatePath('/seller/inventory')
}

export async function updateSellerProfile(formData: FormData) {
  const session = await verifySession()

  const rawName = String(formData.get('name') ?? '').trim()
  if (!rawName) return { error: 'Name is required.' }

  // Use shared name validation (must contain at least one letter, no all-numeric names)
  const parsed = nameSchema.safeParse(rawName)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid name.' }
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: { name: parsed.data },
  })

  revalidatePath('/seller/profile')
  return { success: true }
}

