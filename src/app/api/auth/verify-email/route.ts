import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.json({ status: 'invalid' })
  }

  const record = await prisma.verificationToken.findUnique({ where: { token } })

  if (!record) {
    return NextResponse.json({ status: 'invalid' })
  }

  if (new Date() > record.expiresAt) {
    await prisma.verificationToken.delete({ where: { token } })
    return NextResponse.json({ status: 'expired', email: record.email })
  }

  // Mark seller as verified
  const user = await prisma.user.update({
    where: { email: record.email },
    data: { isVerified: true },
    select: { id: true, name: true, role: true },
  })

  // Delete the used token
  await prisma.verificationToken.delete({ where: { token } })

  // Create session (auto-login)
  await createSession(user.id, user.role)

  return NextResponse.json({ status: 'success', name: user.name })
}
