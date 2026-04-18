import 'server-only'
import { prisma } from './prisma'

type NotifInput = {
  title: string
  body: string
  type: string
  link?: string
  userId?: number // undefined = admin notification
}

export async function createNotification(data: NotifInput) {
  try {
    await prisma.notification.create({
      data: {
        title: data.title,
        body: data.body,
        type: data.type,
        link: data.link,
        userId: data.userId ?? null,
      },
    })
  } catch (err) {
    console.error('[Notification] Failed to create:', err)
  }
}

export async function notifyAdmin(input: Omit<NotifInput, 'userId'>) {
  return createNotification({ ...input, userId: undefined })
}

export async function notifySeller(sellerId: number, input: Omit<NotifInput, 'userId'>) {
  return createNotification({ ...input, userId: sellerId })
}
