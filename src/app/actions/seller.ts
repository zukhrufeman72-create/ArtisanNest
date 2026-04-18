'use server'

import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/dal'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'

export async function addProduct(formData: FormData) {
  const session = await verifySession()

  const name = String(formData.get('name')).trim()
  const shortDescription = String(formData.get('shortDescription')).trim()
  const price = parseFloat(String(formData.get('price')))
  const discountPriceRaw = String(formData.get('discountPrice')).trim()
  const discountPrice = discountPriceRaw ? parseFloat(discountPriceRaw) : null
  const stock = parseInt(String(formData.get('stock')), 10)
  const image = String(formData.get('image')).trim()
  const categoryId = parseInt(String(formData.get('categoryId')), 10)
  const material = String(formData.get('material')).trim() || null
  const origin = String(formData.get('origin')).trim() || null

  if (!name || !shortDescription || isNaN(price) || isNaN(stock) || !image || isNaN(categoryId)) {
    return { error: 'Please fill in all required fields.' }
  }

  await prisma.product.create({
    data: {
      name,
      shortDescription,
      price,
      discountPrice,
      stock,
      image,
      material,
      origin,
      sellerId: session.userId,
      categoryId,
      isApproved: false,
      isActive: true,
    },
  })

  revalidatePath('/seller/products')
  redirect('/seller/products')
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
  const image = String(formData.get('image')).trim()
  const categoryId = parseInt(String(formData.get('categoryId')), 10)
  const material = String(formData.get('material')).trim() || null
  const origin = String(formData.get('origin')).trim() || null

  await prisma.product.update({
    where: { id: productId },
    data: { name, shortDescription, price, discountPrice, stock, image, material, origin, categoryId },
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
  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const currentPassword = String(formData.get('currentPassword') ?? '').trim()
  const newPassword = String(formData.get('newPassword') ?? '').trim()

  if (name && email) {
    await prisma.user.update({
      where: { id: session.userId },
      data: { name, email },
    })
  }

  if (currentPassword && newPassword) {
    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { password: true } })
    if (user) {
      const valid = await bcrypt.compare(currentPassword, user.password)
      if (valid) {
        const hashed = await bcrypt.hash(newPassword, 12)
        await prisma.user.update({ where: { id: session.userId }, data: { password: hashed } })
      }
    }
  }

  revalidatePath('/seller/profile')
}
