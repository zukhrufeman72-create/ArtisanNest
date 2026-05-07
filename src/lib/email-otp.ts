/**
 * Thin email helper for OTP / transactional emails that don't need
 * the full template engine in email-templates.ts.
 *
 * Reuses the same Gmail SMTP transport configured in email.ts.
 */
import 'server-only'
import nodemailer from 'nodemailer'

function createTransport() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
}

export async function sendMail(options: { to: string; subject: string; html: string }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('[Email-OTP] EMAIL_USER or EMAIL_PASS not set — skipping email send.')
    return
  }
  try {
    const transporter = createTransport()
    await transporter.sendMail({
      from: `"ArtisanNest" <${process.env.EMAIL_USER}>`,
      ...options,
    })
  } catch (err) {
    console.error('[Email-OTP] Failed to send email:', err)
  }
}
