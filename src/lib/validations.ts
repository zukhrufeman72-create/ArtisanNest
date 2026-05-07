/**
 * Shared Zod validation schemas
 * ─────────────────────────────
 * Imported by server actions AND API routes so validation logic is DRY.
 */
import { z } from 'zod'

// ── Name ─────────────────────────────────────────────────────────────────────
// Must contain at least one alphabetic character (Latin or extended).
// Valid:  "Ali123", "Jane Doe", "محمد"
// Invalid: "12345", "9999"
export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters.')
  .max(60, 'Name must be 60 characters or fewer.')
  .trim()
  .refine(
    (v) => /[a-zA-Z\u00C0-\u024F\u0600-\u06FF]/.test(v),
    'Name must contain at least one letter (numbers-only names are not allowed).',
  )

// ── Auth ──────────────────────────────────────────────────────────────────────
export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email.').trim(),
  password: z.string().min(1, 'Password is required.'),
})

export const RegisterSchema = z.object({
  name: nameSchema,
  email: z.string().email('Please enter a valid email.').trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
    .regex(/[0-9]/, 'Password must contain at least one number.'),
  role: z.enum(['SELLER', 'CUSTOMER']),
})

// ── Password reset (OTP) ─────────────────────────────────────────────────────
export const RequestOtpSchema = z.object({
  email: z.string().email('Please enter a valid email.').trim(),
})

export const VerifyOtpResetSchema = z.object({
  email: z.string().email().trim(),
  otp: z.string().length(6, 'OTP must be exactly 6 digits.').regex(/^\d{6}$/, 'OTP must be numeric.'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
    .regex(/[0-9]/, 'Password must contain at least one number.'),
})

// ── Email change (OTP) ───────────────────────────────────────────────────────
export const RequestEmailChangeSchema = z.object({
  newEmail: z.string().email('Please enter a valid new email.').trim(),
})

export const VerifyEmailChangeSchema = z.object({
  otp: z.string().length(6, 'OTP must be exactly 6 digits.').regex(/^\d{6}$/, 'OTP must be numeric.'),
})

// ── Profile update ────────────────────────────────────────────────────────────
export const UpdateProfileNameSchema = z.object({
  name: nameSchema,
})

// ── Checkout ──────────────────────────────────────────────────────────────────
export const CheckoutBodySchema = z.object({
  customerName: nameSchema,
  customerEmail: z.string().email('Invalid customer email.').trim(),
  customerPhone: z.string().min(7, 'Phone number is too short.').max(20),
  country: z.string().min(1, 'Country is required.'),
  state: z.string().min(1, 'State is required.'),
  city: z.string().min(1, 'City is required.'),
  address: z.string().min(5, 'Address is too short.'),
  postalCode: z.string().min(1, 'Postal code is required.'),
  addressLabel: z.string().optional(),
  shippingMethod: z.enum(['STANDARD', 'EXPRESS']),
  paymentMethod: z.enum(['COD', 'STRIPE']),
  stripePaymentIntentId: z.string().optional(),
  couponId: z.union([z.number(), z.string()]).optional(),
  couponCode: z.string().optional(),
  discountAmount: z.union([z.number(), z.string()]).optional(),
  orderNotes: z.string().max(500).optional(),
})

// ── Stock alert threshold ─────────────────────────────────────────────────────
export const LOW_STOCK_THRESHOLD = 5
