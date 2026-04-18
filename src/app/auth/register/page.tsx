'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { register } from '@/app/actions/auth'

export default function RegisterPage() {
  const [state, action, pending] = useActionState(register, undefined)

  return (
    <div className="relative min-h-screen bg-[#FDF8F4] flex items-center justify-center px-4 py-12">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#7D9B76]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#C8896A]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-[#C8896A]/10 border border-[#E8D5C4] p-8 sm:p-10">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 mb-8 group w-fit">
            <div className="w-9 h-9 rounded-xl bg-[#C8896A] flex items-center justify-center shadow-sm group-hover:bg-[#A8694A] transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 3C8.5 3 6 6.5 6 10.5C6 14.5 9 18 12 20C15 18 18 14.5 18 10.5C18 6.5 15.5 3 12 3Z" fill="white" opacity="0.95" />
                <path d="M12 20V23" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M9.5 22H14.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="12" cy="10" r="2.5" fill="#C8896A" />
              </svg>
            </div>
            <div>
              <div className="font-serif font-bold text-lg text-[#2D1F1A] leading-tight group-hover:text-[#C8896A] transition-colors">
                ArtisanNest
              </div>
              <div className="text-[10px] text-[#9E8079] tracking-[0.15em] uppercase leading-none">
                Handmade Crafts
              </div>
            </div>
          </Link>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D1F1A] mb-1">
              Create your account
            </h1>
            <p className="text-[#9E8079] text-sm">
              Join ArtisanNest and discover handmade crafts
            </p>
          </div>

          {/* Error message */}
          {state?.message && (
            <div className="mb-6 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
              {state.message}
            </div>
          )}

          {/* Form */}
          <form action={action} className="space-y-5">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#2D1F1A] mb-1.5">
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                placeholder="Jane Doe"
                className="w-full px-4 py-3 rounded-xl border border-[#E8D5C4] bg-[#FDF8F4] text-[#2D1F1A] placeholder-[#C4A99A] text-sm focus:outline-none focus:ring-2 focus:ring-[#C8896A]/40 focus:border-[#C8896A] transition-all"
              />
              {state?.errors?.name && (
                <p className="mt-1.5 text-xs text-rose-600">{state.errors.name[0]}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#2D1F1A] mb-1.5">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-[#E8D5C4] bg-[#FDF8F4] text-[#2D1F1A] placeholder-[#C4A99A] text-sm focus:outline-none focus:ring-2 focus:ring-[#C8896A]/40 focus:border-[#C8896A] transition-all"
              />
              {state?.errors?.email && (
                <p className="mt-1.5 text-xs text-rose-600">{state.errors.email[0]}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#2D1F1A] mb-1.5">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                placeholder="Min. 8 characters"
                className="w-full px-4 py-3 rounded-xl border border-[#E8D5C4] bg-[#FDF8F4] text-[#2D1F1A] placeholder-[#C4A99A] text-sm focus:outline-none focus:ring-2 focus:ring-[#C8896A]/40 focus:border-[#C8896A] transition-all"
              />
              {state?.errors?.password && (
                <p className="mt-1.5 text-xs text-rose-600">{state.errors.password[0]}</p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-[#2D1F1A] mb-2">
                I want to join as
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="CUSTOMER"
                    defaultChecked
                    className="peer sr-only"
                  />
                  <div className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border-2 border-[#E8D5C4] bg-[#FDF8F4] text-[#9E8079] peer-checked:border-[#C8896A] peer-checked:bg-[#C8896A]/5 peer-checked:text-[#C8896A] transition-all">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span className="text-xs font-semibold text-[#6B4C3B]">Customer</span>
                    <span className="text-[10px] text-center leading-tight">Browse &amp; buy crafts</span>
                  </div>
                </label>
                <label className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="SELLER"
                    className="peer sr-only"
                  />
                  <div className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border-2 border-[#E8D5C4] bg-[#FDF8F4] text-[#9E8079] peer-checked:border-[#C8896A] peer-checked:bg-[#C8896A]/5 peer-checked:text-[#C8896A] transition-all">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span className="text-xs font-semibold text-[#6B4C3B]">Seller</span>
                    <span className="text-[10px] text-center leading-tight">Sell your crafts</span>
                  </div>
                </label>
              </div>
              {state?.errors?.role && (
                <p className="mt-1.5 text-xs text-rose-600">{state.errors.role[0]}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={pending}
              className="w-full py-3 px-6 bg-[#C8896A] hover:bg-[#A8694A] disabled:bg-[#C8896A]/60 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-md hover:-translate-y-px active:translate-y-0 text-sm"
            >
              {pending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account…
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-[#E8D5C4]" />
            <span className="text-xs text-[#9E8079]">or</span>
            <div className="flex-1 h-px bg-[#E8D5C4]" />
          </div>

          {/* Login link */}
          <p className="text-center text-sm text-[#9E8079]">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="text-[#C8896A] font-semibold hover:text-[#A8694A] transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-[#9E8079] mt-6">
          By registering, you agree to our{' '}
          <span className="underline cursor-pointer">Terms of Service</span> and{' '}
          <span className="underline cursor-pointer">Privacy Policy</span>
        </p>
      </div>
    </div>
  )
}
