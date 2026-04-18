'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'
import { Suspense } from 'react'

type VerifyResult =
  | { status: 'success'; name: string }
  | { status: 'expired'; email?: string }
  | { status: 'invalid' }
  | { status: 'loading' }

function VerifyContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const [result, setResult] = useState<VerifyResult>({ status: 'loading' })
  const [countdown, setCountdown] = useState(4)

  useEffect(() => {
    if (!token) {
      setResult({ status: 'invalid' })
      return
    }

    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => setResult(data))
      .catch(() => setResult({ status: 'invalid' }))
  }, [token])

  // Auto-redirect countdown after success
  useEffect(() => {
    if (result.status !== 'success') return
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval)
          router.push('/seller/dashboard')
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [result.status, router])

  return (
    <div className="min-h-screen bg-[#F5F2EF] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
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
          {result.status === 'loading' && (
            <>
              <div className="w-16 h-16 bg-[#F5F2EF] rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 size={28} className="text-[#C8896A] animate-spin" />
              </div>
              <h1 className="text-xl font-serif font-bold text-[#2D1F1A] mb-2">Verifying your email…</h1>
              <p className="text-sm text-[#9E8079]">Please wait a moment.</p>
            </>
          )}

          {result.status === 'success' && (
            <>
              <div className="w-16 h-16 bg-[#7D9B76]/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-[#7D9B76]/20">
                <CheckCircle size={32} className="text-[#7D9B76]" />
              </div>
              <h1 className="text-2xl font-serif font-bold text-[#2D1F1A] mb-2">Email Verified!</h1>
              <p className="text-[#9E8079] text-sm mb-2 leading-relaxed">
                Welcome aboard, <strong className="text-[#2D1F1A]">{result.name}</strong>! Your seller account is now active.
              </p>
              <p className="text-xs text-[#9E8079] mb-6">
                Redirecting to your dashboard in <strong className="text-[#7D9B76]">{countdown}s</strong>…
              </p>
              <div className="w-full bg-[#EAE3DC] rounded-full h-1 mb-6 overflow-hidden">
                <div
                  className="h-full bg-[#7D9B76] rounded-full transition-all duration-1000"
                  style={{ width: `${((4 - countdown) / 4) * 100}%` }}
                />
              </div>
              <Link
                href="/seller/dashboard"
                className="block w-full py-3 bg-[#7D9B76] text-white text-sm font-semibold rounded-xl text-center hover:bg-[#6a8663] transition-colors"
              >
                Go to Dashboard →
              </Link>
              <p className="mt-3 text-xs text-[#9E8079]">
                Products you submit will need admin approval before going live.
              </p>
            </>
          )}

          {result.status === 'expired' && (
            <>
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-amber-100">
                <Clock size={32} className="text-amber-500" />
              </div>
              <h1 className="text-2xl font-serif font-bold text-[#2D1F1A] mb-2">Link Expired</h1>
              <p className="text-[#9E8079] text-sm mb-6 leading-relaxed">
                This verification link has expired (links are valid for 1 hour). Request a new one below.
              </p>
              <Link
                href={result.email ? `/auth/verify-email/pending?email=${encodeURIComponent(result.email)}` : '/auth/verify-email/pending'}
                className="block w-full py-3 bg-[#C8896A] text-white text-sm font-semibold rounded-xl text-center hover:bg-[#b3775a] transition-colors"
              >
                Resend Verification Email
              </Link>
              <Link href="/auth/login" className="block mt-3 text-sm text-[#9E8079] hover:text-[#C8896A] transition-colors">
                Back to login
              </Link>
            </>
          )}

          {result.status === 'invalid' && (
            <>
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-rose-100">
                <XCircle size={32} className="text-rose-500" />
              </div>
              <h1 className="text-2xl font-serif font-bold text-[#2D1F1A] mb-2">Invalid Link</h1>
              <p className="text-[#9E8079] text-sm mb-6 leading-relaxed">
                This verification link is invalid or has already been used.
              </p>
              <Link
                href="/auth/verify-email/pending"
                className="block w-full py-3 bg-[#C8896A] text-white text-sm font-semibold rounded-xl text-center hover:bg-[#b3775a] transition-colors"
              >
                Request New Verification
              </Link>
              <Link href="/auth/login" className="block mt-3 text-sm text-[#9E8079] hover:text-[#C8896A] transition-colors">
                Back to login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  )
}
