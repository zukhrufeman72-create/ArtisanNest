import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from './session'

/**
 * Verifies that the request has a valid session.
 * Redirects to /auth/login if not authenticated.
 */
export const verifySession = cache(async () => {
  const session = await getSession()
  if (!session?.userId) redirect('/auth/login')
  return session
})

/**
 * Returns the session without throwing if unauthenticated.
 */
export const getOptionalSession = cache(async () => {
  return getSession()
})

/**
 * Ensures the authenticated user is an ADMIN.
 * Redirects non-admins to /.
 */
export const requireAdmin = cache(async () => {
  const session = await verifySession()
  if (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') redirect('/')
  return session
})

/**
 * Ensures the authenticated user is a SELLER.
 * Redirects non-sellers to /.
 */
export const requireSeller = cache(async () => {
  const session = await verifySession()
  if (session.role !== 'SELLER') redirect('/')
  return session
})

/**
 * Ensures the authenticated user is a CUSTOMER.
 * Admins and sellers are redirected to / because they must not place orders.
 */
export const requireCustomer = cache(async () => {
  const session = await verifySession()
  if (session.role !== 'CUSTOMER') redirect('/')
  return session
})
