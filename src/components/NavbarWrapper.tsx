import { getOptionalSession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import Navbar from './Navbar'
import MessengerPanelWrapper from './MessengerPanelWrapper'

export default async function NavbarWrapper() {
  const session = await getOptionalSession()

  let user: { name: string; email: string; role: string } | null = null
  let initialCartCount = 0

  if (session?.userId) {
    const [dbUser, countResult] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.userId },
        select: { name: true, email: true, role: true },
      }),
      prisma.cartItem.aggregate({
        where: { cart: { userId: session.userId } },
        _sum: { quantity: true },
      }),
    ])
    user = dbUser
    initialCartCount = countResult._sum.quantity ?? 0
  }

  return (
    <>
      <Navbar user={user} initialCartCount={initialCartCount} />
      <MessengerPanelWrapper currentUserId={session?.userId ?? null} />
    </>
  )
}
