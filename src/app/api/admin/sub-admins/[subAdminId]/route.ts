import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/dal'

type Params = { params: Promise<{ subAdminId: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await requireAdmin()
  if (session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Only super admins can update sub-admins.' }, { status: 403 })
  }

  const { subAdminId } = await params
  const id = Number(subAdminId)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID.' }, { status: 400 })

  const body = await req.json() as { permissions?: string[]; isActive?: boolean }
  const subAdmin = await prisma.user.update({
    where: { id, isSubAdmin: true },
    data: {
      ...(body.permissions !== undefined ? { permissions: JSON.stringify(body.permissions) } : {}),
    },
    select: { id: true, name: true, email: true, permissions: true },
  })

  void prisma.auditLog.create({
    data: { userId: session.userId, userRole: session.role, action: 'UPDATE_SUB_ADMIN', entity: 'User', entityId: String(id) },
  }).catch(console.error)

  return NextResponse.json({ subAdmin })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await requireAdmin()
  if (session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Only super admins can delete sub-admins.' }, { status: 403 })
  }

  const { subAdminId } = await params
  const id = Number(subAdminId)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID.' }, { status: 400 })

  await prisma.user.delete({ where: { id, isSubAdmin: true } })

  void prisma.auditLog.create({
    data: { userId: session.userId, userRole: session.role, action: 'DELETE_SUB_ADMIN', entity: 'User', entityId: String(id) },
  }).catch(console.error)

  return NextResponse.json({ success: true })
}
