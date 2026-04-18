import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/lib/jwt'

const adminRoutes = ['/admin']
const sellerRoutes = ['/seller']
const authRoutes = ['/auth/login', '/auth/register']

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname
  const cookie = req.cookies.get('session')?.value
  const session = await decrypt(cookie)

  const isAdminRoute = adminRoutes.some((r) => path.startsWith(r))
  const isSellerRoute = sellerRoutes.some((r) => path.startsWith(r))
  const isAuthRoute = authRoutes.some((r) => path.startsWith(r))

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && session?.userId) {
    if (session.role === 'ADMIN') return NextResponse.redirect(new URL('/admin/dashboard', req.nextUrl))
    if (session.role === 'SELLER') return NextResponse.redirect(new URL('/seller/dashboard', req.nextUrl))
    return NextResponse.redirect(new URL('/', req.nextUrl))
  }

  // Protect admin routes
  if (isAdminRoute) {
    if (!session?.userId) return NextResponse.redirect(new URL('/auth/login', req.nextUrl))
    if (session.role !== 'ADMIN') return NextResponse.redirect(new URL('/', req.nextUrl))
  }

  // Protect seller routes
  if (isSellerRoute) {
    if (!session?.userId) return NextResponse.redirect(new URL('/auth/login', req.nextUrl))
    if (session.role !== 'SELLER') return NextResponse.redirect(new URL('/', req.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$|.*\\.ico$|.*\\.svg$).*)'],
}
