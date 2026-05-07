'use server'

import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/dal'
import { nameSchema } from '@/lib/validations'
import { isRateLimited } from '@/lib/rate-limit'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { sendMail } from '@/lib/email-otp'

// ─────────────────────────────────────────────────────────────────────────────
// Helper: generate 6-digit OTP
// ─────────────────────────────────────────────────────────────────────────────
function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — Request password-change OTP
// The user must be logged in. We send a 6-digit OTP to their current email.
// ─────────────────────────────────────────────────────────────────────────────
export async function requestPasswordChangeOtp(): Promise<{ success?: boolean; message?: string }> {
  const session = await verifySession()

  // Rate limit: max 3 OTP requests per user per 10 minutes
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(`otp-pwd:${session.userId}:${ip}`, 3, 10 * 60 * 1000)) {
    return { message: 'Too many requests. Please wait 10 minutes before trying again.' }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true, name: true },
  })
  if (!user) return { message: 'User not found.' }

  const otp = generateOtp()
  const hashedOtp = await bcrypt.hash(otp, 10)
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

  // Delete any existing unused tokens for this user
  await prisma.passwordResetToken.deleteMany({ where: { email: user.email, used: false } })
  await prisma.passwordResetToken.create({ data: { email: user.email, otp: hashedOtp, expiresAt } })

  await sendMail({
    to: user.email,
    subject: '🔐 Your Password Change OTP — ArtisanNest',
    html: `
      <p>Hi ${user.name},</p>
      <p>Your one-time password (OTP) to change your password is:</p>
      <h2 style="letter-spacing:0.3em;font-size:32px;color:#C8896A;">${otp}</h2>
      <p>This OTP expires in <strong>15 minutes</strong> and can only be used once.</p>
      <p>If you did not request this, please ignore this email.</p>
    `,
  })

  return { success: true, message: 'OTP sent to your email. It expires in 15 minutes.' }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — Verify OTP and update password
// ─────────────────────────────────────────────────────────────────────────────
export async function verifyOtpAndChangePassword(formData: FormData): Promise<{ success?: boolean; message?: string; errors?: Record<string, string[]> }> {
  const session = await verifySession()

  const otp = String(formData.get('otp') ?? '').trim()
  const newPassword = String(formData.get('newPassword') ?? '').trim()
  const confirmPassword = String(formData.get('confirmPassword') ?? '').trim()

  if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
    return { errors: { otp: ['OTP must be exactly 6 digits.'] } }
  }
  if (!newPassword || newPassword.length < 8) {
    return { errors: { newPassword: ['Password must be at least 8 characters.'] } }
  }
  if (!/[A-Z]/.test(newPassword)) {
    return { errors: { newPassword: ['Password must contain at least one uppercase letter.'] } }
  }
  if (!/[0-9]/.test(newPassword)) {
    return { errors: { newPassword: ['Password must contain at least one number.'] } }
  }
  if (newPassword !== confirmPassword) {
    return { errors: { confirmPassword: ['Passwords do not match.'] } }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true },
  })
  if (!user) return { message: 'User not found.' }

  // Find the most recent valid OTP record
  const record = await prisma.passwordResetToken.findFirst({
    where: { email: user.email, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })

  if (!record) {
    return { message: 'OTP has expired or was not found. Please request a new one.' }
  }

  const otpValid = await bcrypt.compare(otp, record.otp)
  if (!otpValid) {
    return { message: 'Invalid OTP. Please check the code and try again.' }
  }

  // Mark token as used then update password
  await prisma.passwordResetToken.update({ where: { id: record.id }, data: { used: true } })
  const hashedPassword = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({ where: { id: session.userId }, data: { password: hashedPassword } })

  revalidatePath('/seller/profile')
  revalidatePath('/admin/settings')
  return { success: true, message: 'Password updated successfully.' }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — Request email-change OTP
// ─────────────────────────────────────────────────────────────────────────────
export async function requestEmailChangeOtp(formData: FormData): Promise<{ success?: boolean; message?: string; errors?: Record<string, string[]> }> {
  const session = await verifySession()

  const newEmail = String(formData.get('newEmail') ?? '').trim().toLowerCase()
  if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    return { errors: { newEmail: ['Please enter a valid email address.'] } }
  }

  // Rate limit: max 3 requests per user per 10 minutes
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(`otp-email:${session.userId}:${ip}`, 3, 10 * 60 * 1000)) {
    return { message: 'Too many requests. Please wait 10 minutes before trying again.' }
  }

  // Check new email is not already in use
  const taken = await prisma.user.findUnique({ where: { email: newEmail } })
  if (taken) return { errors: { newEmail: ['This email is already registered to another account.'] } }

  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { name: true } })
  if (!user) return { message: 'User not found.' }

  const otp = generateOtp()
  const hashedOtp = await bcrypt.hash(otp, 10)
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

  await prisma.emailChangeToken.deleteMany({ where: { userId: session.userId, used: false } })
  await prisma.emailChangeToken.create({
    data: { userId: session.userId, newEmail, otp: hashedOtp, expiresAt },
  })

  await sendMail({
    to: newEmail,
    subject: '📧 Confirm Your New Email — ArtisanNest',
    html: `
      <p>Hi ${user.name},</p>
      <p>Your OTP to confirm your new email address is:</p>
      <h2 style="letter-spacing:0.3em;font-size:32px;color:#C8896A;">${otp}</h2>
      <p>This OTP expires in <strong>15 minutes</strong>.</p>
      <p>If you did not request this, please ignore this email.</p>
    `,
  })

  return { success: true, message: `OTP sent to ${newEmail}. It expires in 15 minutes.` }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — Verify OTP and confirm email change
// ─────────────────────────────────────────────────────────────────────────────
export async function verifyOtpAndChangeEmail(formData: FormData): Promise<{ success?: boolean; message?: string; errors?: Record<string, string[]> }> {
  const session = await verifySession()

  const otp = String(formData.get('otp') ?? '').trim()
  if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
    return { errors: { otp: ['OTP must be exactly 6 digits.'] } }
  }

  const record = await prisma.emailChangeToken.findFirst({
    where: { userId: session.userId, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })

  if (!record) {
    return { message: 'OTP has expired or was not found. Please request a new one.' }
  }

  const otpValid = await bcrypt.compare(otp, record.otp)
  if (!otpValid) {
    return { message: 'Invalid OTP. Please check the code and try again.' }
  }

  // Check new email is still not taken (race condition guard)
  const taken = await prisma.user.findUnique({ where: { email: record.newEmail } })
  if (taken) {
    return { message: 'This email was registered by another account before you could confirm. Please try a different email.' }
  }

  await prisma.emailChangeToken.update({ where: { id: record.id }, data: { used: true } })
  await prisma.user.update({ where: { id: session.userId }, data: { email: record.newEmail } })

  revalidatePath('/seller/profile')
  revalidatePath('/admin/settings')
  return { success: true, message: 'Email updated successfully.' }
}

// ─────────────────────────────────────────────────────────────────────────────
// Profile name update (no OTP required — name is not sensitive)
// ─────────────────────────────────────────────────────────────────────────────
export async function updateProfileName(formData: FormData): Promise<{ success?: boolean; message?: string; errors?: Record<string, string[]> }> {
  const session = await verifySession()

  const rawName = String(formData.get('name') ?? '').trim()
  const parsed = nameSchema.safeParse(rawName)
  if (!parsed.success) {
    return { errors: { name: parsed.error.issues.map((i) => i.message) } }
  }

  await prisma.user.update({ where: { id: session.userId }, data: { name: parsed.data } })

  revalidatePath('/seller/profile')
  revalidatePath('/admin/settings')
  return { success: true, message: 'Name updated successfully.' }
}
