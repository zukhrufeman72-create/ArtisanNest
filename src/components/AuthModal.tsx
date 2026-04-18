'use client'

import { useState, useEffect, useActionState } from 'react'
import { X, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { login, register } from '@/app/actions/auth'

type Props = {
  open: boolean
  onClose: () => void
  defaultTab?: 'login' | 'register'
}

export default function AuthModal({ open, onClose, defaultTab = 'login' }: Props) {
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab)
  const [loginState, loginAction, loginPending] = useActionState(login, undefined)
  const [registerState, registerAction, registerPending] = useActionState(register, undefined)

  useEffect(() => {
    if (open) setTab(defaultTab)
  }, [open, defaultTab])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E8D5C4] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-[#F5F2EF] hover:bg-[#EAE3DC] flex items-center justify-center text-[#9E8079] hover:text-[#2D1F1A] transition-colors"
        >
          <X size={15} />
        </button>

        {/* Logo */}
        <div className="px-8 pt-8 pb-0 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#C8896A] flex items-center justify-center shadow-sm shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 3C8.5 3 6 6.5 6 10.5C6 14.5 9 18 12 20C15 18 18 14.5 18 10.5C18 6.5 15.5 3 12 3Z" fill="white" opacity="0.95" />
              <path d="M12 20V23" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M9.5 22H14.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="12" cy="10" r="2.5" fill="#C8896A" />
            </svg>
          </div>
          <div>
            <div className="font-serif font-bold text-base text-[#2D1F1A] leading-tight">ArtisanNest</div>
            <div className="text-[9px] text-[#9E8079] tracking-[0.15em] uppercase leading-none">Handmade Crafts</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex mx-8 mt-6 border-b border-[#EAE3DC]">
          {(['login', 'register'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 pb-2.5 text-sm font-semibold transition-all duration-200 border-b-2 -mb-px ${
                tab === t
                  ? 'text-[#C8896A] border-[#C8896A]'
                  : 'text-[#9E8079] border-transparent hover:text-[#6B4C3B]'
              }`}
            >
              {t === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Forms */}
        <div className="px-8 py-6">
          {tab === 'login' ? (
            <LoginForm state={loginState} action={loginAction} pending={loginPending} onSwitchTab={() => setTab('register')} />
          ) : (
            <RegisterForm state={registerState} action={registerAction} pending={registerPending} onSwitchTab={() => setTab('login')} />
          )}
        </div>
      </div>
    </div>
  )
}

function LoginForm({ state, action, pending, onSwitchTab }: {
  state: { message?: string; email?: string; errors?: Record<string, string[]> } | undefined
  action: (formData: FormData) => void
  pending: boolean
  onSwitchTab: () => void
}) {
  return (
    <form action={action} className="space-y-4">
      <div>
        <h2 className="font-serif text-xl font-bold text-[#2D1F1A]">Welcome back</h2>
        <p className="text-xs text-[#9E8079] mt-0.5">Sign in to continue shopping</p>
      </div>

      {state?.message && (
        <div className="px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
          {state.message}
          {state.email && (
            <Link
              href={`/auth/verify-email/pending?email=${encodeURIComponent(state.email)}`}
              className="ml-2 font-semibold underline"
            >
              Verify email →
            </Link>
          )}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-[#2D1F1A] mb-1.5">Email address</label>
        <input
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="w-full px-4 py-2.5 rounded-xl border border-[#E8D5C4] bg-[#FDF8F4] text-[#2D1F1A] placeholder-[#C4A99A] text-sm focus:outline-none focus:ring-2 focus:ring-[#C8896A]/40 focus:border-[#C8896A] transition-all"
        />
        {state?.errors?.email && <p className="mt-1 text-xs text-rose-600">{state.errors.email[0]}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-[#2D1F1A] mb-1.5">Password</label>
        <input
          name="password"
          type="password"
          required
          placeholder="••••••••"
          className="w-full px-4 py-2.5 rounded-xl border border-[#E8D5C4] bg-[#FDF8F4] text-[#2D1F1A] placeholder-[#C4A99A] text-sm focus:outline-none focus:ring-2 focus:ring-[#C8896A]/40 focus:border-[#C8896A] transition-all"
        />
        {state?.errors?.password && <p className="mt-1 text-xs text-rose-600">{state.errors.password[0]}</p>}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full py-2.5 bg-[#C8896A] hover:bg-[#A8694A] disabled:bg-[#C8896A]/60 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-md text-sm flex items-center justify-center gap-2"
      >
        {pending ? <><Loader2 size={14} className="animate-spin" /> Signing in…</> : 'Sign In'}
      </button>

      <p className="text-center text-xs text-[#9E8079]">
        Don&apos;t have an account?{' '}
        <button type="button" onClick={onSwitchTab} className="text-[#C8896A] font-semibold hover:text-[#A8694A] transition-colors">
          Register here
        </button>
      </p>
    </form>
  )
}

function RegisterForm({ state, action, pending, onSwitchTab }: {
  state: { message?: string; errors?: Record<string, string[]> } | undefined
  action: (formData: FormData) => void
  pending: boolean
  onSwitchTab: () => void
}) {
  return (
    <form action={action} className="space-y-4">
      <div>
        <h2 className="font-serif text-xl font-bold text-[#2D1F1A]">Create account</h2>
        <p className="text-xs text-[#9E8079] mt-0.5">Join ArtisanNest and discover handmade crafts</p>
      </div>

      {state?.message && (
        <div className="px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
          {state.message}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-[#2D1F1A] mb-1.5">Full name</label>
        <input
          name="name"
          type="text"
          required
          placeholder="Jane Doe"
          className="w-full px-4 py-2.5 rounded-xl border border-[#E8D5C4] bg-[#FDF8F4] text-[#2D1F1A] placeholder-[#C4A99A] text-sm focus:outline-none focus:ring-2 focus:ring-[#C8896A]/40 focus:border-[#C8896A] transition-all"
        />
        {state?.errors?.name && <p className="mt-1 text-xs text-rose-600">{state.errors.name[0]}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-[#2D1F1A] mb-1.5">Email address</label>
        <input
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="w-full px-4 py-2.5 rounded-xl border border-[#E8D5C4] bg-[#FDF8F4] text-[#2D1F1A] placeholder-[#C4A99A] text-sm focus:outline-none focus:ring-2 focus:ring-[#C8896A]/40 focus:border-[#C8896A] transition-all"
        />
        {state?.errors?.email && <p className="mt-1 text-xs text-rose-600">{state.errors.email[0]}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-[#2D1F1A] mb-1.5">Password</label>
        <input
          name="password"
          type="password"
          required
          placeholder="Min. 8 characters"
          className="w-full px-4 py-2.5 rounded-xl border border-[#E8D5C4] bg-[#FDF8F4] text-[#2D1F1A] placeholder-[#C4A99A] text-sm focus:outline-none focus:ring-2 focus:ring-[#C8896A]/40 focus:border-[#C8896A] transition-all"
        />
        {state?.errors?.password && <p className="mt-1 text-xs text-rose-600">{state.errors.password[0]}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-[#2D1F1A] mb-2">I want to join as</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'CUSTOMER', label: 'Customer', desc: 'Browse & buy' },
            { value: 'SELLER', label: 'Seller', desc: 'Sell crafts' },
          ].map(({ value, label, desc }) => (
            <label key={value} className="relative cursor-pointer">
              <input type="radio" name="role" value={value} defaultChecked={value === 'CUSTOMER'} className="peer sr-only" />
              <div className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border-2 border-[#E8D5C4] bg-[#FDF8F4] peer-checked:border-[#C8896A] peer-checked:bg-[#C8896A]/5 transition-all cursor-pointer">
                <span className="text-xs font-semibold text-[#6B4C3B]">{label}</span>
                <span className="text-[10px] text-[#9E8079]">{desc}</span>
              </div>
            </label>
          ))}
        </div>
        {state?.errors?.role && <p className="mt-1 text-xs text-rose-600">{state.errors.role[0]}</p>}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full py-2.5 bg-[#C8896A] hover:bg-[#A8694A] disabled:bg-[#C8896A]/60 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-md text-sm flex items-center justify-center gap-2"
      >
        {pending ? <><Loader2 size={14} className="animate-spin" /> Creating account…</> : 'Create Account'}
      </button>

      <p className="text-center text-xs text-[#9E8079]">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchTab} className="text-[#C8896A] font-semibold hover:text-[#A8694A] transition-colors">
          Sign in
        </button>
      </p>
    </form>
  )
}
