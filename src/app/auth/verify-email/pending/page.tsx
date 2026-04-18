'use client'

import { useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { resendVerification } from '@/app/actions/auth'
import { Mail, RefreshCw, CheckCircle } from 'lucide-react'
import { Suspense } from 'react'

function PendingContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''

  const [state, formAction, isPending] = useActionState(
    async (_prev: any, formData: FormData) => {
      return resendVerification(formData)
    },
    null,
  )

  return (
    <div className="min-h-screen bg-[#F5F2EF] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#C8896A] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 3C8.5 3 6 6.5 6 10.5C6 14.5 9 18 12 20C15 18 18 14.5 18 10.5C18 6.5 15.5 3 12 3Z" fill="white" opacity="0.95"/>
                <path d="M12 20V23" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M9.5 22H14.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="12" cy="10" r="2.5" fill="#C8896A"/>
              </svg>
            </div>
            <span className="font-serif font-bold text-[#2D1F1A] text-xl">ArtisanNest</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-[#EAE3DC] p-8 shadow-sm text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-[#C8896A]/10 rounded-full flex items-center justify-center mx-auto mb-5 relative">
            <Mail size={36} className="text-[#C8896A]" />
            <span className="absolute -top-1 -right-1 w-6 h-6 bg-[#7D9B76] rounded-full flex items-center justify-center text-white text-xs font-bold">
              ✓
            </span>
          </div>

          <h1 className="text-2xl font-serif font-bold text-[#2D1F1A] mb-2">Check Your Inbox</h1>
          <p className="text-[#9E8079] text-sm mb-2 leading-relaxed">
            We&apos;ve sent a verification email to:
          </p>
          {email && (
            <p className="font-semibold text-[#2D1F1A] text-sm mb-6 bg-[#F5F2EF] px-4 py-2 rounded-xl inline-block">
              {email}
            </p>
          )}
          <p className="text-[#9E8079] text-sm mb-6 leading-relaxed">
            Click the link in the email to activate your seller account.
            The link expires in <strong className="text-[#C8896A]">1 hour</strong>.
          </p>

          {/* Steps */}
          <div className="bg-[#F5F2EF] rounded-xl p-4 mb-6 text-left space-y-3">
            {[
              'Open your email inbox',
              'Look for an email from ArtisanNest',
              'Click "Verify My Email Address"',
              'Log in to start selling',
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-[#6B4C3B]">
                <span className="w-6 h-6 rounded-full bg-[#C8896A]/20 text-[#C8896A] text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                {step}
              </div>
            ))}
          </div>

          {/* Success/error from resend */}
          {state?.success && (
            <div className="flex items-center gap-2 bg-[#7D9B76]/10 border border-[#7D9B76]/20 text-[#7D9B76] text-sm px-4 py-3 rounded-xl mb-4">
              <CheckCircle size={16} className="shrink-0" />
              {state.message}
            </div>
          )}
          {state && !state.success && state.message && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-xl mb-4">
              {state.message}
            </div>
          )}

          {/* Resend form */}
          <div className="border-t border-[#EAE3DC] pt-5">
            <p className="text-xs text-[#9E8079] mb-3">Didn&apos;t receive the email? Check your spam folder or resend:</p>
            <form action={formAction}>
              <input type="hidden" name="email" value={email} />
              <button
                type="submit"
                disabled={isPending || state?.success === true}
                className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-[#F5F2EF] border border-[#EAE3DC] text-[#6B4C3B] text-sm font-semibold rounded-xl hover:bg-[#EAE3DC] transition-colors disabled:opacity-50"
              >
                <RefreshCw size={14} className={isPending ? 'animate-spin' : ''} />
                {isPending ? 'Sending…' : 'Resend Email'}
              </button>
            </form>
          </div>

          <Link
            href="/auth/login"
            className="block mt-4 text-xs text-[#9E8079] hover:text-[#C8896A] transition-colors"
          >
            Back to login
          </Link>
        </div>

        <p className="text-center text-xs text-[#C4AEA4] mt-6">
          Having trouble? Contact us at{' '}
          <a href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'support@artisannest.com'}`} className="text-[#C8896A]">
            support@artisannest.com
          </a>
        </p>
      </div>
    </div>
  )
}

export default function PendingPage() {
  return (
    <Suspense>
      <PendingContent />
    </Suspense>
  )
}
