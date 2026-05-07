import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/dal'
import bcrypt from 'bcryptjs'

export async function GET(_req: NextRequest) {
  const session = await requireAdmin()
  if (session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Only super admins can manage sub-admins.' }, { status: 403 })
  }

  const subAdmins = await prisma.user.findMany({
    where: { role: 'ADMIN', isSubAdmin: true },
    select: { id: true, name: true, email: true, permissions: true, createdAt: true, lastLoginAt: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ subAdmins })
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Only super admins can create sub-admins.' }, { status: 403 })
  }

  const body = await req.json() as {
    name: string
    email: string
    password: string
    permissions: string[]
  }

  if (!body.name || !body.email || !body.password) {
    return NextResponse.json({ error: 'name, email, and password are required.' }, { status: 400 })
  }

  const exists = await prisma.user.findUnique({ where: { email: body.email } })
  if (exists) return NextResponse.json({ error: 'Email already in use.' }, { status: 409 })

  const hashed = await bcrypt.hash(body.password, 12)
  const subAdmin = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      password: hashed,
      role: 'ADMIN',
      isSubAdmin: true,
      permissions: body.permissions ? JSON.stringify(body.permissions) : null,
    },
    select: { id: true, name: true, email: true, permissions: true, createdAt: true },
  })

  void prisma.auditLog.create({
    data: { userId: session.userId, userRole: session.role, action: 'CREATE_SUB_ADMIN', entity: 'User', entityId: String(subAdmin.id) },
  }).catch(console.error)

  return NextResponse.json({ subAdmin }, { status: 201 })
}
