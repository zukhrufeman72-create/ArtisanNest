'use client'

import { useState, useTransition } from 'react'
import {
  User, Lock, Mail, ShoppingBag, Heart, Calendar,
  CheckCircle, AlertCircle, Loader2, Eye, EyeOff, ChevronRight,
} from 'lucide-react'
import {
  requestPasswordChangeOtp,
  verifyOtpAndChangePassword,
  requestEmailChangeOtp,
  verifyOtpAndChangeEmail,
  updateProfileName,
} from '@/app/actions/profile'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Props {
  name: string
  email: string
  createdAt: string
  orderCount: number
  wishlistCount: number
}

type Tab = 'profile' | 'password' | 'email'
type Step = 'idle' | 'otp-sent' | 'done'

// ─── Shared helpers ───────────────────────────────────────────────────────────
const inputCls =
  'w-full px-4 py-3 text-sm bg-[#F5F2EF] border border-[#EAE3DC] rounded-xl text-[#2D1F1A] placeholder-[#C4AEA4] focus:outline-none focus:ring-2 focus:ring-[#C8896A]/30 focus:border-[#C8896A] transition-all'

function SuccessMsg({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
      <CheckCircle size={15} className="shrink-0" /> {msg}
    </div>
  )
}
function ErrorMsg({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
      <AlertCircle size={15} className="shrink-0" /> {msg}
    </div>
  )
}

// ─── Root Component ───────────────────────────────────────────────────────────
export default function ProfileView({ name, email, createdAt, orderCount, wishlistCount }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [displayName, setDisplayName] = useState(name)

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Edit Profile', icon: User },
    { id: 'password', label: 'Change Password', icon: Lock },
    { id: 'email', label: 'Change Email', icon: Mail },
  ]

  return (
    <div className="space-y-6">
      {/* ── Page heading ─────────────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-[#2D1F1A]">My Profile</h1>
        <p className="text-sm text-[#9E8079] mt-1">Manage your account details and security settings</p>
      </div>

      {/* ── Avatar / stats card ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] p-6 flex flex-col sm:flex-row items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#C8896A] to-[#b3775a] flex items-center justify-center text-white text-3xl font-bold shrink-0 shadow-md">
          {displayName.charAt(0).toUpperCase() || '?'}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-xl font-bold text-[#2D1F1A]">{displayName}</p>
          <p className="text-sm text-[#9E8079] mt-0.5">{email}</p>
          <div className="flex items-center gap-1 mt-1 justify-center sm:justify-start text-xs text-[#C4AEA4]">
            <Calendar size={11} />
            <span>
              Member since{' '}
              {new Date(createdAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'long' })}
            </span>
          </div>
        </div>
        <div className="flex gap-6 text-center shrink-0">
          <div>
            <p className="text-2xl font-bold text-[#C8896A]">{orderCount}</p>
            <p className="text-xs text-[#9E8079] flex items-center gap-1 justify-center mt-0.5">
              <ShoppingBag size={10} /> Orders
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#C8896A]">{wishlistCount}</p>
            <p className="text-xs text-[#9E8079] flex items-center gap-1 justify-center mt-0.5">
              <Heart size={10} /> Wishlist
            </p>
          </div>
        </div>
      </div>

      {/* ── Tab card ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
        {/* Tab nav */}
        <div className="flex border-b border-[#EAE3DC]">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition-all ${active
                    ? 'text-[#C8896A] border-b-2 border-[#C8896A] bg-[#FDF8F4]'
                    : 'text-[#9E8079] hover:text-[#2D1F1A] hover:bg-[#F5F2EF]'
                  }`}
              >
                <Icon size={15} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Tab panels */}
        <div className="p-6">
          {activeTab === 'profile' && <NameTab currentName={displayName} onSuccess={(n) => setDisplayName(n)} />}
          {activeTab === 'password' && <PasswordTab email={email} />}
          {activeTab === 'email' && <EmailTab currentEmail={email} />}
        </div>
      </div>

      {/* ── Quick links ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] divide-y divide-[#F5EFE6]">
        {[
          { href: '/orders', label: 'My Orders', icon: ShoppingBag, sub: 'View your order history' },
          { href: '/wishlist', label: 'My Wishlist', icon: Heart, sub: 'Products you have saved' },
        ].map((item) => {
          const Icon = item.icon
          return (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 px-5 py-4 hover:bg-[#FDF8F4] transition-colors group"
            >
              <div className="w-9 h-9 rounded-xl bg-[#C8896A]/10 flex items-center justify-center shrink-0">
                <Icon size={16} className="text-[#C8896A]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#2D1F1A]">{item.label}</p>
                <p className="text-xs text-[#9E8079]">{item.sub}</p>
              </div>
              <ChevronRight size={16} className="text-[#C4AEA4] group-hover:text-[#C8896A] transition-colors" />
            </a>
          )
        })}
      </div>
    </div>
  )
}

// ─── Tab: Edit Name ───────────────────────────────────────────────────────────
function NameTab({ currentName, onSuccess }: { currentName: string; onSuccess: (n: string) => void }) {
  const [name, setName] = useState(currentName)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMsg(''); setErr('')
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateProfileName(fd)
      if (result?.success) {
        setMsg(result.message ?? 'Name updated successfully!')
        onSuccess(fd.get('name') as string)
      } else if (result?.errors?.name) {
        setErr(result.errors.name[0])
      } else {
        setErr(result?.message ?? 'Something went wrong.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <h2 className="text-base font-semibold text-[#2D1F1A] mb-0.5">Display Name</h2>
        <p className="text-xs text-[#9E8079] mb-4">
          Must contain at least one letter — purely numeric names are not allowed.
        </p>
        <label className="block text-xs font-semibold text-[#9E8079] uppercase tracking-wide mb-1.5">
          Full Name
        </label>
        <input
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder='e.g. "Ali Ahmad" or "Sara123"'
          className={inputCls}
        />
        <p className="text-[11px] text-[#C4AEA4] mt-1.5">
          Valid: &quot;Ali123&quot;&nbsp;&nbsp;·&nbsp;&nbsp;Invalid: &quot;12345&quot; (numbers only)
        </p>
      </div>
      {msg && <SuccessMsg msg={msg} />}
      {err && <ErrorMsg msg={err} />}
      <button
        type="submit"
        disabled={isPending || name.trim() === currentName}
        className="px-5 py-2.5 bg-[#C8896A] text-white text-sm font-semibold rounded-xl hover:bg-[#b3775a] transition-colors disabled:opacity-50 flex items-center gap-2"
      >
        {isPending
          ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
          : 'Save Name'}
      </button>
    </form>
  )
}

// ─── Tab: Change Password ─────────────────────────────────────────────────────
function PasswordTab({ email }: { email: string }) {
  const [step, setStep] = useState<Step>('idle')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [fieldErrs, setFieldErrs] = useState<Record<string, string[]>>({})
  const [showPwd, setShowPwd] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleRequestOtp() {
    setMsg(''); setErr('')
    startTransition(async () => {
      const result = await requestPasswordChangeOtp()
      if (result?.success) { setStep('otp-sent'); setMsg(result.message ?? 'OTP sent!') }
      else setErr(result?.message ?? 'Something went wrong.')
    })
  }

  function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMsg(''); setErr(''); setFieldErrs({})
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await verifyOtpAndChangePassword(fd)
      if (result?.success) { setStep('done'); setMsg(result.message ?? 'Password changed!') }
      else if (result?.errors) setFieldErrs(result.errors)
      else setErr(result?.message ?? 'Something went wrong.')
    })
  }

  return (
    <div className="max-w-md space-y-4">
      <div>
        <h2 className="text-base font-semibold text-[#2D1F1A] mb-0.5">Change Password</h2>
        <p className="text-xs text-[#9E8079] mb-4">
          A 6-digit one-time code will be sent to <strong>{email}</strong>.
        </p>
      </div>

      {step === 'idle' && (
        <>
          {err && <ErrorMsg msg={err} />}
          <div className="bg-[#FDF8F4] border border-[#EAE3DC] rounded-xl p-4 space-y-1 text-xs text-[#9E8079]">
            <p className="font-semibold text-[#6B4C3B] text-sm mb-1">Requirements</p>
            <p>✓ At least 8 characters</p>
            <p>✓ At least one uppercase letter (A–Z)</p>
            <p>✓ At least one number (0–9)</p>
          </div>
          <button
            onClick={handleRequestOtp}
            disabled={isPending}
            className="px-5 py-2.5 bg-[#C8896A] text-white text-sm font-semibold rounded-xl hover:bg-[#b3775a] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isPending
              ? <><Loader2 size={14} className="animate-spin" /> Sending OTP…</>
              : 'Send OTP to Email'}
          </button>
        </>
      )}

      {step === 'otp-sent' && (
        <form onSubmit={handleVerify} className="space-y-4">
          {msg && <SuccessMsg msg={msg} />}

          <div>
            <label className="block text-xs font-semibold text-[#9E8079] uppercase tracking-wide mb-1.5">OTP Code</label>
            <input name="otp" required maxLength={6} placeholder="Enter 6-digit code" className={inputCls} />
            {fieldErrs.otp && <p className="text-xs text-rose-600 mt-1">{fieldErrs.otp[0]}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#9E8079] uppercase tracking-wide mb-1.5">New Password</label>
            <div className="relative">
              <input
                name="newPassword"
                type={showPwd ? 'text' : 'password'}
                required
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                className={`${inputCls} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9E8079] hover:text-[#2D1F1A] transition-colors"
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrs.newPassword && <p className="text-xs text-rose-600 mt-1">{fieldErrs.newPassword[0]}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#9E8079] uppercase tracking-wide mb-1.5">Confirm Password</label>
            <input name="confirmPassword" type="password" required placeholder="Re-enter new password" className={inputCls} />
            {fieldErrs.confirmPassword && <p className="text-xs text-rose-600 mt-1">{fieldErrs.confirmPassword[0]}</p>}
          </div>

          {err && <ErrorMsg msg={err} />}

          <div className="flex gap-3">
            <button type="submit" disabled={isPending}
              className="px-5 py-2.5 bg-[#C8896A] text-white text-sm font-semibold rounded-xl hover:bg-[#b3775a] transition-colors disabled:opacity-50 flex items-center gap-2">
              {isPending ? <><Loader2 size={14} className="animate-spin" /> Verifying…</> : 'Confirm New Password'}
            </button>
            <button type="button"
              onClick={() => { setStep('idle'); setMsg(''); setErr(''); setFieldErrs({}) }}
              className="px-4 py-2.5 text-sm text-[#9E8079] hover:text-[#2D1F1A] rounded-xl hover:bg-[#F5F2EF] transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {step === 'done' && <SuccessMsg msg={msg || 'Password updated successfully.'} />}
    </div>
  )
}

// ─── Tab: Change Email ────────────────────────────────────────────────────────
function EmailTab({ currentEmail }: { currentEmail: string }) {
  const [step, setStep] = useState<Step>('idle')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [fieldErrs, setFieldErrs] = useState<Record<string, string[]>>({})
  const [pendingEmail, setPendingEmail] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleRequest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMsg(''); setErr(''); setFieldErrs({})
    const fd = new FormData(e.currentTarget)
    const newEmail = String(fd.get('newEmail') ?? '')
    startTransition(async () => {
      const result = await requestEmailChangeOtp(fd)
      if (result?.success) { setPendingEmail(newEmail); setStep('otp-sent'); setMsg(result.message ?? 'OTP sent!') }
      else if (result?.errors) setFieldErrs(result.errors)
      else setErr(result?.message ?? 'Something went wrong.')
    })
  }

  function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMsg(''); setErr(''); setFieldErrs({})
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await verifyOtpAndChangeEmail(fd)
      if (result?.success) { setStep('done'); setMsg(result.message ?? 'Email updated!') }
      else if (result?.errors) setFieldErrs(result.errors)
      else setErr(result?.message ?? 'Something went wrong.')
    })
  }

  return (
    <div className="max-w-md space-y-4">
      <div>
        <h2 className="text-base font-semibold text-[#2D1F1A] mb-0.5">Change Email Address</h2>
        <p className="text-xs text-[#9E8079] mb-4">
          Current: <strong>{currentEmail}</strong>.<br />
          A verification code will be sent to your <em>new</em> email to confirm the change.
        </p>
      </div>

      {step === 'idle' && (
        <form onSubmit={handleRequest} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#9E8079] uppercase tracking-wide mb-1.5">New Email Address</label>
            <input name="newEmail" type="email" required placeholder="new@example.com" className={inputCls} />
            {fieldErrs.newEmail && <p className="text-xs text-rose-600 mt-1">{fieldErrs.newEmail[0]}</p>}
          </div>
          {err && <ErrorMsg msg={err} />}
          <button type="submit" disabled={isPending}
            className="px-5 py-2.5 bg-[#C8896A] text-white text-sm font-semibold rounded-xl hover:bg-[#b3775a] transition-colors disabled:opacity-50 flex items-center gap-2">
            {isPending ? <><Loader2 size={14} className="animate-spin" /> Sending OTP…</> : 'Send OTP to New Email'}
          </button>
        </form>
      )}

      {step === 'otp-sent' && (
        <form onSubmit={handleVerify} className="space-y-4">
          {msg && <SuccessMsg msg={msg} />}
          <div className="text-xs text-[#9E8079] bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            📬 Check <strong>{pendingEmail}</strong> for your 6-digit code. It expires in 15 minutes.
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#9E8079] uppercase tracking-wide mb-1.5">OTP Code</label>
            <input name="otp" required maxLength={6} placeholder="Enter 6-digit code" className={inputCls} />
            {fieldErrs.otp && <p className="text-xs text-rose-600 mt-1">{fieldErrs.otp[0]}</p>}
          </div>
          {err && <ErrorMsg msg={err} />}
          <div className="flex gap-3">
            <button type="submit" disabled={isPending}
              className="px-5 py-2.5 bg-[#C8896A] text-white text-sm font-semibold rounded-xl hover:bg-[#b3775a] transition-colors disabled:opacity-50 flex items-center gap-2">
              {isPending ? <><Loader2 size={14} className="animate-spin" /> Verifying…</> : 'Confirm Email Change'}
            </button>
            <button type="button"
              onClick={() => { setStep('idle'); setMsg(''); setErr(''); setFieldErrs({}) }}
              className="px-4 py-2.5 text-sm text-[#9E8079] hover:text-[#2D1F1A] rounded-xl hover:bg-[#F5F2EF] transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {step === 'done' && (
        <div className="space-y-3">
          <SuccessMsg msg={msg || 'Email updated successfully.'} />
          <p className="text-xs text-[#9E8079]">Your new email is active. Use it to log in next time.</p>
        </div>
      )}
    </div>
  )
}
