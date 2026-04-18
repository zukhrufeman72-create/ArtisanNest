'use client'

import { ShoppingCart, LogIn } from 'lucide-react'

export default function CartLoginGate() {
  function open(tab: 'login' | 'register') {
    window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { tab } }))
  }

  return (
    <div className="bg-white rounded-2xl border border-[#EAE3DC] p-10 text-center max-w-sm shadow-sm">
      <div className="w-16 h-16 rounded-2xl bg-[#C8896A]/10 flex items-center justify-center mx-auto mb-4">
        <ShoppingCart size={28} className="text-[#C8896A]" />
      </div>
      <h1 className="text-xl font-serif font-bold text-[#2D1F1A] mb-2">Sign in to view cart</h1>
      <p className="text-sm text-[#9E8079] mb-6">Your cart is saved to your account.</p>
      <button
        onClick={() => open('login')}
        className="inline-flex items-center gap-2 px-6 py-3 bg-[#C8896A] text-white text-sm font-semibold rounded-xl hover:bg-[#A8694A] transition-colors"
      >
        <LogIn size={15} /> Sign In
      </button>
      <p className="mt-3 text-xs text-[#9E8079]">
        No account?{' '}
        <button onClick={() => open('register')} className="text-[#C8896A] hover:underline font-medium">
          Register free
        </button>
      </p>
    </div>
  )
}
