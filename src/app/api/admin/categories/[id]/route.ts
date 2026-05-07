import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/dal'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await requireAdmin()
  const { id } = await params
  const catId = Number(id)
  if (isNaN(catId)) return NextResponse.json({ error: 'Invalid ID.' }, { status: 400 })

  const body = await req.json() as {
    name?: string
    description?: string
    image?: string
    color?: string
    icon?: string
    sortOrder?: number
    isActive?: boolean
  }

  if (body.name !== undefined && !body.name.trim()) {
    return NextResponse.json({ error: 'Name cannot be empty.' }, { status: 400 })
  }

  const category = await prisma.category.update({
    where: { id: catId },
    data: {
      ...(body.name !== undefined ? { name: body.name.trim() } : {}),
      ...(body.description !== undefined ? { description: body.description || null } : {}),
      ...(body.image !== undefined ? { image: body.image || null } : {}),
      ...(body.color !== undefined ? { color: body.color || null } : {}),
      ...(body.icon !== undefined ? { icon: body.icon || null } : {}),
      ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
      ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
    },
  })

  void prisma.auditLog.create({
    data: { userId: session.userId, userRole: session.role, action: 'UPDATE_CATEGORY', entity: 'Category', entityId: String(catId) },
  }).catch(console.error)

  return NextResponse.json({ category })
}
