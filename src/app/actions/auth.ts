'use server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createSession, deleteSession } from '@/lib/session'

const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email.').trim(),
  password: z.string().min(1, 'Password is required.'),
})

const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.').trim(),
  email: z.string().email('Please enter a valid email.').trim(),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  role: z.enum(['SELLER', 'CUSTOMER']),
})

export type FormState =
  | { errors?: Record<string, string[]>; message?: string }
  | undefined

export async function login(state: FormState, formData: FormData): Promise<FormState> {
  const validated = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { email, password } = validated.data
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return { message: 'Invalid email or password.' }
  }

  await createSession(user.id, user.role)

  if (user.role === 'ADMIN') redirect('/admin/dashboard')
  if (user.role === 'SELLER') redirect('/seller/dashboard')
  redirect('/')
}

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

  const hashedPassword = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, role },
  })

  await createSession(user.id, user.role)

  if (role === 'SELLER') redirect('/seller/dashboard')
  redirect('/')
}

export async function logout() {
  await deleteSession()
  redirect('/auth/login')
}
