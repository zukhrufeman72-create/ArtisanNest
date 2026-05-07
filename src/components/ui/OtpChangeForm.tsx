'use client'

import { useState, useTransition } from 'react'
import { Loader2, Eye, EyeOff, Mail, Lock, CheckCircle, AlertCircle } from 'lucide-react'
import {
  requestPasswordChangeOtp,
  verifyOtpAndChangePassword,
  requestEmailChangeOtp,
  verifyOtpAndChangeEmail,
} from '@/app/actions/profile'

interface Props {
  currentEmail: string
  /** 'orange' for admin, 'green' for seller */
  accentColor?: 'orange' | 'green'
}

type Step = 'idle' | 'otp-sent' | 'done'

const accent = {
  orange: {
    btn: 'bg-[#C8896A] hover:bg-[#b3775a]',
    ring: 'focus:ring-[#C8896A]/30 focus:border-[#C8896A]',
  },
  green: {
    btn: 'bg-[#7D9B76] hover:bg-[#6a8663]',
    ring: 'focus:ring-[#7D9B76]/30 focus:border-[#7D9B76]',
  },
}

export default function OtpChangeForm({ currentEmail, accentColor = 'orange' }: Props) {
  const colors = accent[accentColor]

  // ── Password change state ─────────────────────────────────────────────────
  const [pwdStep, setPwdStep] = useState<Step>('idle')
  const [pwdMsg, setPwdMsg] = useState('')
  const [pwdErrors, setPwdErrors] = useState<Record<string, string[]>>({})
  const [showPwd, setShowPwd] = useState(false)
  const [isPwdPending, startPwdTransition] = useTransition()

  // ── Email change state ────────────────────────────────────────────────────
  const [emailStep, setEmailStep] = useState<Step>('idle')
  const [emailMsg, setEmailMsg] = useState('')
  const [emailErrors, setEmailErrors] = useState<Record<string, string[]>>({})
  const [pendingEmail, setPendingEmail] = useState('')
  const [isEmailPending, startEmailTransition] = useTransition()

  // ── Password: request OTP ─────────────────────────────────────────────────
  function handleRequestPwdOtp() {
    startPwdTransition(async () => {
      setPwdMsg('')
      setPwdErrors({})
      const result = await requestPasswordChangeOtp()
      if (result?.success) {
        setPwdStep('otp-sent')
        setPwdMsg(result.message ?? 'OTP sent!')
      } else {
        setPwdMsg(result?.message ?? 'Something went wrong.')
      }
    })
  }

  // ── Password: verify OTP ──────────────────────────────────────────────────
  function handleVerifyPwdOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startPwdTransition(async () => {
      setPwdMsg('')
      setPwdErrors({})
      const result = await verifyOtpAndChangePassword(fd)
      if (result?.success) {
        setPwdStep('done')
        setPwdMsg(result.message ?? 'Password updated!')
      } else if (result?.errors) {
        setPwdErrors(result.errors)
      } else {
        setPwdMsg(result?.message ?? 'Something went wrong.')
      }
    })
  }

  // ── Email: request OTP ────────────────────────────────────────────────────
  function handleRequestEmailOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const newEmail = String(fd.get('newEmail') ?? '')
    startEmailTransition(async () => {
      setEmailMsg('')
      setEmailErrors({})
      const result = await requestEmailChangeOtp(fd)
      if (result?.success) {
        setPendingEmail(newEmail)
        setEmailStep('otp-sent')
        setEmailMsg(result.message ?? 'OTP sent!')
      } else if (result?.errors) {
        setEmailErrors(result.errors)
      } else {
        setEmailMsg(result?.message ?? 'Something went wrong.')
      }
    })
  }

  // ── Email: verify OTP ─────────────────────────────────────────────────────
  function handleVerifyEmailOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startEmailTransition(async () => {
      setEmailMsg('')
      setEmailErrors({})
      const result = await verifyOtpAndChangeEmail(fd)
      if (result?.success) {
        setEmailStep('done')
        setEmailMsg(result.message ?? 'Email updated!')
      } else if (result?.errors) {
        setEmailErrors(result.errors)
      } else {
        setEmailMsg(result?.message ?? 'Something went wrong.')
      }
    })
  }

  const inputClass = `w-full px-4 py-2.5 text-sm bg-[#F5F2EF] border border-[#EAE3DC] rounded-xl text-[#2D1F1A] focus:outline-none focus:ring-2 ${colors.ring} transition-all`

  return (
    <div className="space-y-6">
      {/* ── Change Password ─────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Lock size={14} className="text-[#9E8079]" />
          <h3 className="text-sm font-semibold text-[#2D1F1A]">Change Password</h3>
        </div>

        {pwdStep === 'idle' && (
          <div className="space-y-3">
            <p className="text-xs text-[#9E8079]">
              For security, a 6-digit OTP will be sent to <strong>{currentEmail}</strong>. Enter it to confirm your new password.
            </p>
            {pwdMsg && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                <AlertCircle size={13} /> {pwdMsg}
              </div>
            )}
            <button
              type="button"
              onClick={handleRequestPwdOtp}
              disabled={isPwdPending}
              className={`${colors.btn} disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors flex items-center gap-2`}
            >
              {isPwdPending ? <><Loader2 size={13} className="animate-spin" /> Sending…</> : 'Send OTP to Email'}
            </button>
          </div>
        )}

        {pwdStep === 'otp-sent' && (
          <form onSubmit={handleVerifyPwdOtp} className="space-y-3">
            {pwdMsg && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs">
                <CheckCircle size={13} /> {pwdMsg}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-[#9E8079] uppercase tracking-wide mb-1.5">OTP Code</label>
              <input name="otp" required maxLength={6} placeholder="6-digit code" className={inputClass} />
              {pwdErrors.otp && <p className="text-xs text-rose-600 mt-1">{pwdErrors.otp[0]}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#9E8079] uppercase tracking-wide mb-1.5">New Password</label>
              <div className="relative">
                <input name="newPassword" type={showPwd ? 'text' : 'password'} required placeholder="Min 8 chars, 1 uppercase, 1 number" className={`${inputClass} pr-10`} />
                <button type="button" onClick={() => setShowPwd((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9E8079]">
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {pwdErrors.newPassword && <p className="text-xs text-rose-600 mt-1">{pwdErrors.newPassword[0]}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#9E8079] uppercase tracking-wide mb-1.5">Confirm Password</label>
              <input name="confirmPassword" type="password" required placeholder="Re-enter new password" className={inputClass} />
              {pwdErrors.confirmPassword && <p className="text-xs text-rose-600 mt-1">{pwdErrors.confirmPassword[0]}</p>}
            </div>
            {pwdMsg && pwdStep === 'otp-sent' && !pwdErrors.otp && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                <AlertCircle size={13} /> {pwdMsg}
              </div>
            )}
            <div className="flex gap-2">
              <button type="submit" disabled={isPwdPending} className={`${colors.btn} disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-2`}>
                {isPwdPending ? <><Loader2 size={13} className="animate-spin" /> Verifying…</> : 'Confirm New Password'}
              </button>
              <button type="button" onClick={() => { setPwdStep('idle'); setPwdMsg(''); setPwdErrors({}) }} className="text-sm text-[#9E8079] hover:text-[#2D1F1A] px-3 py-2">
                Cancel
              </button>
            </div>
          </form>
        )}

        {pwdStep === 'done' && (
          <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
            <CheckCircle size={16} /> {pwdMsg}
          </div>
        )}
      </section>

      <hr className="border-[#EAE3DC]" />

      {/* ── Change Email ────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Mail size={14} className="text-[#9E8079]" />
          <h3 className="text-sm font-semibold text-[#2D1F1A]">Change Email</h3>
        </div>
        <p className="text-xs text-[#9E8079] mb-3">
          Current email: <strong>{currentEmail}</strong>. A 6-digit OTP will be sent to your <em>new</em> email to confirm the change.
        </p>

        {emailStep === 'idle' && (
          <form onSubmit={handleRequestEmailOtp} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#9E8079] uppercase tracking-wide mb-1.5">New Email Address</label>
              <input name="newEmail" type="email" required placeholder="new@example.com" className={inputClass} />
              {emailErrors.newEmail && <p className="text-xs text-rose-600 mt-1">{emailErrors.newEmail[0]}</p>}
            </div>
            {emailMsg && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                <AlertCircle size={13} /> {emailMsg}
              </div>
            )}
            <button type="submit" disabled={isEmailPending} className={`${colors.btn} disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-2`}>
              {isEmailPending ? <><Loader2 size={13} className="animate-spin" /> Sending…</> : 'Send OTP to New Email'}
            </button>
          </form>
        )}

        {emailStep === 'otp-sent' && (
          <form onSubmit={handleVerifyEmailOtp} className="space-y-3">
            {emailMsg && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs">
                <CheckCircle size={13} /> {emailMsg}
              </div>
            )}
            <p className="text-xs text-[#9E8079]">Enter the 6-digit OTP sent to <strong>{pendingEmail}</strong>:</p>
            <div>
              <label className="block text-xs font-semibold text-[#9E8079] uppercase tracking-wide mb-1.5">OTP Code</label>
              <input name="otp" required maxLength={6} placeholder="6-digit code" className={inputClass} />
              {emailErrors.otp && <p className="text-xs text-rose-600 mt-1">{emailErrors.otp[0]}</p>}
            </div>
            {emailMsg && emailStep === 'otp-sent' && !emailErrors.otp && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                <AlertCircle size={13} /> {emailMsg}
              </div>
            )}
            <div className="flex gap-2">
              <button type="submit" disabled={isEmailPending} className={`${colors.btn} disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-2`}>
                {isEmailPending ? <><Loader2 size={13} className="animate-spin" /> Verifying…</> : 'Confirm New Email'}
              </button>
              <button type="button" onClick={() => { setEmailStep('idle'); setEmailMsg(''); setEmailErrors({}) }} className="text-sm text-[#9E8079] hover:text-[#2D1F1A] px-3 py-2">
                Cancel
              </button>
            </div>
          </form>
        )}

        {emailStep === 'done' && (
          <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
            <CheckCircle size={16} /> {emailMsg}
          </div>
        )}
      </section>
    </div>
  )
}
