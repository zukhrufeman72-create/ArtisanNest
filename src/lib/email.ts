import 'server-only'
import nodemailer from 'nodemailer'
import {
  sellerVerificationTemplate,
  customerWelcomeTemplate,
  adminNotificationTemplate,
  orderConfirmationTemplate,
  orderStatusUpdateTemplate,
} from './email-templates'

const APP_URL = process.env.APP_URL || 'http://localhost:3000'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || ''

function createTransport() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
}

async function sendMail(options: { to: string; subject: string; html: string }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('[Email] EMAIL_USER or EMAIL_PASS not set — skipping email send.')
    return
  }
  try {
    const transporter = createTransport()
    await transporter.sendMail({
      from: `"ArtisanNest" <${process.env.EMAIL_USER}>`,
      ...options,
    })
  } catch (err) {
    console.error('[Email] Failed to send email:', err)
  }
}

// ─── Public send functions ────────────────────────────────────────────────────

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const verificationUrl = `${APP_URL}/auth/verify-email?token=${token}`
  await sendMail({
    to: email,
    subject: '✉️ Verify Your Seller Account – ArtisanNest',
    html: sellerVerificationTemplate(name, verificationUrl),
  })
}

export async function sendCustomerWelcomeEmail(email: string, name: string) {
  await sendMail({
    to: email,
    subject: '🎉 Welcome to ArtisanNest!',
    html: customerWelcomeTemplate(name, APP_URL),
  })
}

export async function sendOrderConfirmationEmail(
  email: string,
  name: string,
  orderId: number,
  items: { name: string; quantity: number; price: number }[],
  subtotal: number,
  shippingFee: number,
  tax: number,
  discount: number,
  total: number,
  paymentMethod: string,
  shippingMethod: string,
  shippingAddress: string,
  orderNotes: string | null,
) {
  await sendMail({
    to: email,
    subject: `✅ Order Confirmed #${orderId} — ArtisanNest`,
    html: orderConfirmationTemplate(
      name, orderId, items, subtotal, shippingFee, tax, discount, total,
      paymentMethod, shippingMethod, shippingAddress, orderNotes, APP_URL,
    ),
  })
}

export async function sendOrderStatusUpdateEmail(
  email: string,
  name: string,
  orderId: number,
  status: string,
) {
  const subjectMap: Record<string, string> = {
    PAID: `✅ Payment Confirmed — Order #${orderId}`,
    SHIPPED: `🚚 Your Order #${orderId} is Shipped!`,
    DELIVERED: `📦 Order #${orderId} Delivered!`,
    CANCELLED: `❌ Order #${orderId} Cancelled`,
  }
  await sendMail({
    to: email,
    subject: subjectMap[status] ?? `🔔 Order #${orderId} Update — ArtisanNest`,
    html: orderStatusUpdateTemplate(name, orderId, status, APP_URL),
  })
}

export async function sendAdminNotification(
  userName: string,
  userEmail: string,
  role: 'SELLER' | 'CUSTOMER',
  registeredAt: Date,
) {
  if (!ADMIN_EMAIL) return
  await sendMail({
    to: ADMIN_EMAIL,
    subject: `🔔 New ${role === 'SELLER' ? 'Seller' : 'Customer'} Registered – ${userName}`,
    html: adminNotificationTemplate(
      userName,
      userEmail,
      role,
      registeredAt,
      `${APP_URL}/admin/dashboard`,
    ),
  })
}
