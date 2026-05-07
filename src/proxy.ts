import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/lib/jwt'

// ── Route categories ──────────────────────────────────────────────────────────
const adminRoutes    = ['/admin']
const sellerRoutes   = ['/seller']
const authRoutes     = ['/auth/login', '/auth/register']

const customerOnlyRoutes = ['/checkout', '/cart', '/orders', '/wishlist', '/profile']

const protectedApiRoutes = [
  '/api/checkout',
  '/api/cart',
  '/api/stripe',
  '/api/orders',
  '/api/wishlist',
  '/api/upload',
  '/api/refunds',
  '/api/custom-orders',
  '/api/deals',
  '/api/notifications',
]

const customerOnlyApiRoutes = [
  '/api/checkout',
  '/api/stripe',
]

// ── In-memory rate limiter (auth routes only) ─────────────────────────────────
interface RateEntry { count: number; resetAt: number }
const rateLimitStore = new Map<string, RateEntry>()

function checkRateLimit(ip: string, limit = 20, windowMs = 60_000): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs })
    return false
  }
  entry.count++
  return entry.count > limit
}

// ── Security headers ──────────────────────────────────────────────────────────
function applySecurityHeaders(res: NextResponse): NextResponse {
  const isDev = process.env.NODE_ENV === 'development'
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com"
    : "script-src 'self' 'unsafe-inline' https://js.stripe.com"

  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-XSS-Protection', '1; mode=block')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  res.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://api.stripe.com wss: ws:",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "worker-src 'self' blob:",
    ].join('; '),
  )
  return res
}

// ── Bot / suspicious agent detection ─────────────────────────────────────────
const BOT_PATTERNS = /bot|crawler|spider|scraper|curl|wget|python-requests/i

function isSuspiciousRequest(req: NextRequest): boolean {
  const ua = req.headers.get('user-agent') ?? ''
  return BOT_PATTERNS.test(ua)
}

// ── Main middleware function ───────────────────────────────────────────────────
export default async function proxy(req: NextRequest) {
  const path    = req.nextUrl.pathname
  const cookie  = req.cookies.get('session')?.value
  const session = await decrypt(cookie)
  const ip      = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
               ?? req.headers.get('x-real-ip')
               ?? 'unknown'

  const isAdminRoute       = adminRoutes.some((r) => path.startsWith(r))
  const isSellerRoute      = sellerRoutes.some((r) => path.startsWith(r))
  const isAuthRoute        = authRoutes.some((r) => path.startsWith(r))
  const isCustomerOnlyPage = customerOnlyRoutes.some((r) => path.startsWith(r))
  const isProtectedApi     = protectedApiRoutes.some((r) => path.startsWith(r))
  const isCustomerOnlyApi  = customerOnlyApiRoutes.some((r) => path.startsWith(r))

  // Rate-limit auth routes (20 req/min per IP)
  if (isAuthRoute && checkRateLimit(`auth:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 })
  }

  // Rate-limit API routes broadly (200 req/min per IP)
  if (path.startsWith('/api/') && checkRateLimit(`api:${ip}`, 200, 60_000)) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 })
  }

  // Block obvious bots from write APIs
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && isSuspiciousRequest(req)) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  const isAdmin = session?.role === 'ADMIN' || session?.role === 'SUPER_ADMIN'

  // 1. Redirect authenticated users away from auth pages
  if (isAuthRoute && session?.userId) {
    if (isAdmin)                   return NextResponse.redirect(new URL('/admin/dashboard', req.nextUrl))
    if (session.role === 'SELLER') return NextResponse.redirect(new URL('/seller/dashboard', req.nextUrl))
    return NextResponse.redirect(new URL('/', req.nextUrl))
  }

  // 2. Protect admin routes (ADMIN or SUPER_ADMIN)
  if (isAdminRoute) {
    if (!session?.userId) return NextResponse.redirect(new URL('/auth/login', req.nextUrl))
    if (!isAdmin)         return NextResponse.redirect(new URL('/', req.nextUrl))
  }

  // 3. Protect seller routes (SELLER only)
  if (isSellerRoute) {
    if (!session?.userId)          return NextResponse.redirect(new URL('/auth/login', req.nextUrl))
    if (session.role !== 'SELLER') return NextResponse.redirect(new URL('/', req.nextUrl))
  }

  // 4. Customer-only pages
  if (isCustomerOnlyPage) {
    if (!session?.userId)              return NextResponse.redirect(new URL('/auth/login', req.nextUrl))
    if (session.role !== 'CUSTOMER')   return NextResponse.redirect(new URL('/', req.nextUrl))
  }

  // 5. Protected API routes — must be authenticated
  if (isProtectedApi && !session?.userId) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  // 6. Customer-only API routes
  if (isCustomerOnlyApi && session?.userId && session.role !== 'CUSTOMER') {
    return NextResponse.json(
      { error: 'Only customers can place orders or initiate payments.' },
      { status: 403 },
    )
  }

  const response = NextResponse.next()
  return applySecurityHeaders(response)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|.*\\.png$|.*\\.ico$|.*\\.svg$|.*\\.jpg$|.*\\.webp$|uploads/).*)',
  ],
}
