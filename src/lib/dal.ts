import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from './session'

export const verifySession = cache(async () => {
  const session = await getSession()
  if (!session?.userId) redirect('/auth/login')
  return session
})

export const getOptionalSession = cache(async () => {
  return getSession()
})
