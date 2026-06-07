import 'server-only'
import type { Role } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export type ChatRole = Extract<Role, 'CUSTOMER' | 'SELLER'>

const chatUserSelect = {
  id: true,
  name: true,
  role: true,
  isVerified: true,
  isApproved: true,
} as const

export function isChatRole(role: Role): role is ChatRole {
  return role === 'CUSTOMER' || role === 'SELLER'
}

export function getOppositeChatRole(role: ChatRole): ChatRole {
  return role === 'CUSTOMER' ? 'SELLER' : 'CUSTOMER'
}

export async function getCurrentChatUser(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: chatUserSelect,
  })

  if (!user || !user.isVerified) return null

  const role = user.role
  if (!isChatRole(role)) return null
  if (role === 'SELLER' && !user.isApproved) return null

  return { ...user, role }
}

export async function getAuthorizedChatPair(currentUserId: number, otherUserId: number) {
  if (currentUserId === otherUserId) return null

  const [currentUser, otherUser] = await Promise.all([
    getCurrentChatUser(currentUserId),
    prisma.user.findUnique({
      where: { id: otherUserId },
      select: chatUserSelect,
    }),
  ])

  if (!currentUser || !otherUser || !otherUser.isVerified) {
    return null
  }

  const otherRole = otherUser.role
  if (!isChatRole(otherRole)) return null
  if (otherRole === 'SELLER' && !otherUser.isApproved) return null
  if (otherRole !== getOppositeChatRole(currentUser.role)) return null

  return { currentUser, otherUser: { ...otherUser, role: otherRole } }
}
