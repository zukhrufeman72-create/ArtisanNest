import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/dal'
import { sendMail } from '@/lib/email-otp'

type Params = { params: Promise<{ sellerId: string }> }

// PATCH /api/admin/sellers/[sellerId]/approve
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await requireAdmin()
  const { sellerId } = await params
  const id = Number(sellerId)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID.' }, { status: 400 })

  const body = await req.json() as { approved: boolean; reason?: string }

  const seller = await prisma.user.findUnique({ where: { id, role: 'SELLER' } })
  if (!seller) return NextResponse.json({ error: 'Seller not found.' }, { status: 404 })

  await prisma.user.update({ where: { id }, data: { isApproved: body.approved } })

  void prisma.notification.create({
    data: {
      userId: id,
      type: 'SYSTEM',
      title: body.approved ? 'Account Approved' : 'Account Not Approved',
      body: body.approved
        ? 'Congratulations! Your seller account has been approved. You can now list products.'
        : `Your seller account was not approved. Reason: ${body.reason ?? 'Not specified.'}`,
    },
  }).catch(console.error)

  void sendMail({
    to: seller.email,
    subject: body.approved
      ? 'Your ArtisanNest seller account is approved'
      : 'Update on your ArtisanNest account',
    html: body.approved
      ? `<p>Hi ${seller.name},</p><p>Great news! Your seller account has been <strong>approved</strong>. You can now log in and start listing your products.</p>`
      : `<p>Hi ${seller.name},</p><p>Unfortunately your seller account was <strong>not approved</strong>. Reason: ${body.reason ?? 'Not specified.'}</p>`,
  }).catch(console.error)

  void prisma.auditLog.create({
    data: {
      userId: session.userId,
      userRole: session.role,
      action: body.approved ? 'APPROVE_SELLER' : 'REJECT_SELLER',
      entity: 'User',
      entityId: String(id),
      newData: JSON.stringify({ approved: body.approved, reason: body.reason }),
    },
  }).catch(console.error)

  return NextResponse.json({ success: true, approved: body.approved })
}
