'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function approveProduct(formData: FormData) {
  const productId = Number(formData.get('productId'))
  await prisma.product.update({ where: { id: productId }, data: { isApproved: true } })
  revalidatePath('/admin/products/approvals')
  revalidatePath('/admin/products')
}

export async function rejectProduct(formData: FormData) {
  const productId = Number(formData.get('productId'))
  await prisma.product.delete({ where: { id: productId } })
  revalidatePath('/admin/products/approvals')
  revalidatePath('/admin/products')
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
  await prisma.order.update({ where: { id: orderId }, data: { status } })
  revalidatePath('/admin/orders')
}
