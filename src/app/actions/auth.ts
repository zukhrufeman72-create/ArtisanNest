'use server'

import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { randomBytes } from 'crypto'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { createSession, deleteSession } from '@/lib/session'
import {
  sendVerificationEmail,
  sendCustomerWelcomeEmail,
  sendAdminNotification,
} from '@/lib/email'
import { notifyAdmin } from '@/lib/notifications'
import { LoginSchema, RegisterSchema } from '@/lib/validations'
import { isRateLimited, retryAfterMs } from '@/lib/rate-limit'

// ── Types ────────────────────────────────────────────────────────────────────

export type FormState =
  | { errors?: Record<string, string[]>; message?: string; success?: boolean; email?: string }
  | undefined

// ── Login (rate-limited: 10 attempts / 15 min per IP) ────────────────────────

export async function login(state: FormState, formData: FormData): Promise<FormState> {
  // Rate limit by IP address to prevent brute-force attacks
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rateLimitKey = `login:${ip}`

  if (isRateLimited(rateLimitKey, 10, 15 * 60 * 1000)) {
    const waitSec = Math.ceil(retryAfterMs(rateLimitKey) / 1000)
    return {
      message: `Too many login attempts. Please wait ${waitSec} seconds before trying again.`,
    }
  }

  const validated = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { email, password } = validated.data

  // Use a constant-time comparison approach — find user without short-circuiting
  const user = await prisma.user.findUnique({ where: { email } })

  // Always run bcrypt.compare even on missing user to prevent timing attacks
  const passwordValid = user
    ? await bcrypt.compare(password, user.password)
    : await bcrypt.compare(password, '$2a$10$invalidhashtopreventtimingattack')

  if (!user || !passwordValid) {
    return { message: 'Invalid email or password.' }
  }

  // Block unverified sellers
  if (user.role === 'SELLER' && !user.isVerified) {
    return {
      message: 'Your email is not verified yet. Please check your inbox and click the verification link.',
      email: user.email,
    }
  }

  await createSession(user.id, user.role)

  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') redirect('/admin/dashboard')
  if (user.role === 'SELLER') redirect('/seller/dashboard')
  redirect('/')
}

// ── Register ─────────────────────────────────────────────────────────────────

export async function register(state: FormState, formData: FormData): Promise<FormState> {
  const validated = RegisterSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    role: formData.get('role'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { name, email, password, role } = validated.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { errors: { email: ['This email is already registered.'] } }
  }

  // Hash with cost factor 12 (stronger than default 10)
  const hashedPassword = await bcrypt.hash(password, 12)
  const now = new Date()

  if (role === 'SELLER') {
    // Sellers must verify email before logging in
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role, isVerified: false },
    })

    // Generate a secure verification token (1 hour expiry)
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000)

    await prisma.verificationToken.deleteMany({ where: { email } })
    await prisma.verificationToken.create({ data: { email, token, expiresAt } })

    await Promise.allSettled([
      sendVerificationEmail(email, name, token),
      sendAdminNotification(name, email, 'SELLER', now),
      notifyAdmin({
        type: 'NEW_SELLER',
        title: 'New Seller Registered',
        body: `${name} (${email}) signed up as a seller and is awaiting email verification.`,
        link: '/admin/users/sellers',
      }),
    ])

    redirect(`/auth/verify-email/pending?email=${encodeURIComponent(email)}`)
  } else {
    // Customers are auto-verified and auto-logged-in
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role, isVerified: true },
    })

    await Promise.allSettled([
      sendCustomerWelcomeEmail(email, name),
      sendAdminNotification(name, email, 'CUSTOMER', now),
      notifyAdmin({
        type: 'NEW_CUSTOMER',
        title: 'New Customer Registered',
        body: `${name} (${email}) created a customer account.`,
        link: '/admin/users/customers',
      }),
    ])

    await createSession(user.id, user.role)
    redirect('/')
  }
}

// ── Logout ────────────────────────────────────────────────────────────────────

export async function logout() {
  await deleteSession()
  redirect('/auth/login')
}

// ── Resend verification ───────────────────────────────────────────────────────

export async function resendVerification(formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') ?? '').trim()
  if (!email) return { message: 'Email address is required.' }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { name: true, isVerified: true, role: true },
  })

  if (!user || user.role !== 'SELLER') {
    return { message: 'No seller account found with this email.' }
  }

  if (user.isVerified) {
    return { message: 'This account is already verified. Please log in.' }
  }

  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
  await prisma.verificationToken.deleteMany({ where: { email } })
  await prisma.verificationToken.create({ data: { email, token, expiresAt } })

  await sendVerificationEmail(email, user.name, token)

  return { success: true, message: 'Verification email resent! Please check your inbox.' }
}
