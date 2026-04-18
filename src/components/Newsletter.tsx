"use client"

import { useState } from "react"
import AnimatedSection from "./AnimatedSection"

export default function Newsletter() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setStatus("loading")
    setTimeout(() => {
      setStatus("success")
      setEmail("")
    }, 1000)
  }

  return (
    <section className="py-20 lg:py-28 bg-gradient-to-br from-[#C8896A] via-[#B8795A] to-[#A8694A] relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-black/10 blur-3xl" />

      {/* Dot grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: "radial-gradient(white 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <AnimatedSection>
          <span className="inline-block text-4xl mb-4">📬</span>
          <h2 className="font-serif text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            Stay in the Loop
          </h2>
          <p className="text-white/80 text-base lg:text-lg leading-relaxed mb-8 max-w-xl mx-auto">
            Subscribe for new arrivals, artisan spotlights, and exclusive subscriber-only discounts.
            No spam, ever — only the good stuff.
          </p>

          {status === "success" ? (
            <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm border border-white/30 text-white font-semibold px-8 py-4 rounded-2xl text-base">
              <span className="text-2xl">🎉</span>
              You&apos;re subscribed! Welcome to the nest.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="flex-1 px-5 py-3.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 text-white placeholder-white/60 text-sm focus:outline-none focus:border-white focus:bg-white/25 transition-all duration-200"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="shrink-0 inline-flex items-center justify-center gap-2 bg-white hover:bg-[#F5EFE6] text-[#C8896A] font-bold px-7 py-3.5 rounded-full transition-all duration-200 text-sm hover:shadow-lg disabled:opacity-70"
              >
                {status === "loading" ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <>
                    Subscribe
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          )}

          <p className="text-white/50 text-xs mt-4">
            Join 12,000+ craft lovers. Unsubscribe anytime.
          </p>
        </AnimatedSection>
      </div>
    </section>
  )
}
