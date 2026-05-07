import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOptionalSession } from '@/lib/dal'

// POST /api/visitor-log — fire-and-forget from client
export async function POST(req: NextRequest) {
  const session = await getOptionalSession()
  const body = await req.json() as { path: string; referrer?: string; duration?: number }
  if (!body.path) return NextResponse.json({ ok: true })

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
           ?? req.headers.get('x-real-ip')
           ?? undefined
  const ua = req.headers.get('user-agent') ?? undefined

  void prisma.visitorLog.create({
    data: {
      userId: session?.userId ?? null,
      path: body.path.substring(0, 500),
      ipAddress: ip,
      userAgent: ua?.substring(0, 300),
      referrer: body.referrer?.substring(0, 500),
      duration: body.duration ?? null,
    },
  }).catch(console.error)

  return NextResponse.json({ ok: true })
}
