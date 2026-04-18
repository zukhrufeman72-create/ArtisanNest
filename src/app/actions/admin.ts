'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { notifySeller, notifyAdmin } from '@/lib/notifications'

export async function approveProduct(formData: FormData) {
  const productId = Number(formData.get('productId'))

  const product = await prisma.product.update({
    where: { id: productId },
    data: { isApproved: true },
    select: { name: true, sellerId: true },
  })

  try {
    await notifySeller(product.sellerId, {
      type: 'PRODUCT_APPROVED',
      title: '✅ Product Approved',
      body: `Your product "${product.name}" has been approved and is now live on the marketplace!`,
      link: '/seller/products',
    })
  } catch {}

  revalidatePath('/admin/products/approvals')
  revalidatePath('/admin/products')
}

export async function rejectProduct(formData: FormData) {
  const productId = Number(formData.get('productId'))

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { name: true, sellerId: true },
  })

  await prisma.product.delete({ where: { id: productId } })

  if (product) {
    try {
      await notifySeller(product.sellerId, {
        type: 'PRODUCT_REJECTED',
        title: '❌ Product Rejected',
        body: `Your product "${product.name}" was not approved. Please review our guidelines and resubmit.`,
        link: '/seller/products/add',
      })
    } catch {}
  }

  revalidatePath('/admin/products/approvals')
  revalidatePath('/admin/products')
}

export async function adminDeleteProduct(formData: FormData) {
  const productId = Number(formData.get('productId'))
  await prisma.product.delete({ where: { id: productId } })
  revalidatePath('/admin/products')
  revalidatePath('/admin/products/approvals')
}

export async function adminUpdateProduct(formData: FormData) {
  const productId = Number(formData.get('productId'))
  const name = String(formData.get('name')).trim()
  const shortDescription = String(formData.get('shortDescription')).trim()
  const price = parseFloat(String(formData.get('price')))
  const discountPriceRaw = String(formData.get('discountPrice')).trim()
  const discountPrice = discountPriceRaw ? parseFloat(discountPriceRaw) : null
  const stock = parseInt(String(formData.get('stock')), 10)
  const categoryId = parseInt(String(formData.get('categoryId')), 10)
  const material = String(formData.get('material')).trim() || null
  const origin = String(formData.get('origin')).trim() || null
  const isApproved = formData.get('isApproved') === 'true'

  if (!name || !shortDescription || isNaN(price) || isNaN(stock) || isNaN(categoryId)) {
    return
  }

  await prisma.product.update({
    where: { id: productId },
    data: { name, shortDescription, price, discountPrice, stock, categoryId, material, origin, isApproved },
  })

  revalidatePath('/admin/products')
  revalidatePath('/admin/products/approvals')
  redirect('/admin/products')
}

export async function createCategory(formData: FormData) {
  const name = String(formData.get('name')).trim()
  if (!name) return
  await prisma.category.create({ data: { name } })
  revalidatePath('/admin/products/categories')
}

export async function deleteCategory(formData: FormData) {
  const categoryId = Number(formData.get('categoryId'))
  await prisma.category.delete({ where: { id: categoryId } })
  revalidatePath('/admin/products/categories')
}

export async function updateOrderStatus(formData: FormData) {
  const orderId = Number(formData.get('orderId'))
  const status = String(formData.get('status')) as 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'

  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status },
    select: {
      items: { select: { product: { select: { sellerId: true } } } },
    },
  })

  // Notify seller(s) of status change
  const sellerIds = [...new Set(order.items.map((i) => i.product.sellerId))]
  try {
    await Promise.allSettled(
      sellerIds.map((id) =>
        notifySeller(id, {
          type: 'ORDER_STATUS',
          title: `Order ${status.charAt(0) + status.slice(1).toLowerCase()}`,
          body: `Order #${orderId} status has been updated to ${status.toLowerCase()}.`,
          link: '/seller/orders',
        }),
      ),
    )
  } catch {}

  revalidatePath('/admin/orders')
}
