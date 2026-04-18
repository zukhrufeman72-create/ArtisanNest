'use server'

import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/dal'
import { revalidatePath } from 'next/cache'

type ComplaintState = { error?: string; success?: boolean } | undefined

export async function submitComplaint(prevState: ComplaintState, formData: FormData): Promise<ComplaintState> {
  const session = await verifySession()

  const subject = String(formData.get('subject') ?? '').trim()
  const message = String(formData.get('message') ?? '').trim()
  const productId = formData.get('productId') ? Number(formData.get('productId')) : null
  const sellerId = formData.get('sellerId') ? Number(formData.get('sellerId')) : null

  if (!subject || !message) return { error: 'Subject and message are required.' }

  await prisma.complaint.create({
    data: {
      subject,
      message,
      userId: session.userId,
      productId: productId ?? undefined,
      sellerId: sellerId ?? undefined,
    },
  })

  // Notify admin (best-effort)
  try {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
    if (admin) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'COMPLAINT_SUBMITTED',
          title: 'New Complaint',
          body: `New complaint submitted: "${subject}"`,
        },
      })
    }
  } catch { /* notification table may not be ready */ }

  revalidatePath('/support')
  revalidatePath('/admin/complaints')
  return { success: true }
}

export async function resolveComplaint(prevState: ComplaintState, formData: FormData): Promise<ComplaintState> {
  const session = await verifySession()
  if (session.role !== 'ADMIN') return { error: 'Unauthorized' }

  const complaintId = Number(formData.get('complaintId'))
  const status = String(formData.get('status') ?? 'RESOLVED')

  await prisma.complaint.update({
    where: { id: complaintId },
    data: { status },
  })

  revalidatePath('/admin/complaints')
  return { success: true }
}

export async function deleteUser(prevState: unknown, formData: FormData) {
  const session = await verifySession()
  if (session.role !== 'ADMIN') return { error: 'Unauthorized' }

  const userId = Number(formData.get('userId'))
  if (!userId) return { error: 'Invalid user' }

  // Cascade: delete products, cart items, etc. via DB cascade or manual cleanup
  try {
    // Delete messages
    await prisma.message.deleteMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] } })
    // Delete complaints
    await prisma.complaint.deleteMany({ where: { userId } })
    await prisma.complaint.updateMany({ where: { sellerId: userId }, data: { sellerId: null } })
    // Delete wishlist
    await prisma.wishlist.deleteMany({ where: { userId } })
    // Delete notifications
    await prisma.notification.deleteMany({ where: { userId } })
    // Delete reviews
    await prisma.review.deleteMany({ where: { userId } })
    // Delete cart items and cart
    const cart = await prisma.cart.findUnique({ where: { userId } })
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
      await prisma.cart.delete({ where: { id: cart.id } })
    }
    // Delete products (and their cart items, order items, reviews, wishlist)
    const products = await prisma.product.findMany({ where: { sellerId: userId }, select: { id: true } })
    for (const p of products) {
      await prisma.cartItem.deleteMany({ where: { productId: p.id } })
      await prisma.wishlist.deleteMany({ where: { productId: p.id } })
      await prisma.review.deleteMany({ where: { productId: p.id } })
      await prisma.complaint.updateMany({ where: { productId: p.id }, data: { productId: null } })
    }
    await prisma.product.deleteMany({ where: { sellerId: userId } })
    // Delete user
    await prisma.user.delete({ where: { id: userId } })
  } catch (e) {
    console.error('deleteUser error:', e)
    return { error: 'Failed to delete user. They may have orders that cannot be removed.' }
  }

  revalidatePath('/admin/users/sellers')
  revalidatePath('/admin/users')
  return { success: true }
}
