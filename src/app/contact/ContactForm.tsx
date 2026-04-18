'use client'

import { useState } from 'react'
import { Send, CheckCircle, Loader2 } from 'lucide-react'

const TOPICS = ['Order Issue', 'Product Question', 'Seller Inquiry', 'Payment Problem', 'Other']

export default function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [topic, setTopic] = useState(TOPICS[0])
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim()) return
    setSubmitting(true)
    // Simulate submission (could wire to a real API/email)
    await new Promise((r) => setTimeout(r, 1200))
    setSubmitted(true)
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl border border-[#EAE3DC] p-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#7D9B76]/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-[#7D9B76]" />
        </div>
        <h3 className="font-serif text-xl font-bold text-[#2D1F1A] mb-2">Message Sent!</h3>
        <p className="text-sm text-[#9E8079] mb-5 leading-relaxed">
          Thanks for reaching out. We&apos;ll get back to you at <span className="font-medium text-[#2D1F1A]">{email}</span> within 24 hours.
        </p>
        <button
          onClick={() => { setSubmitted(false); setName(''); setEmail(''); setMessage('') }}
          className="text-sm text-[#C8896A] hover:text-[#A8694A] font-semibold transition-colors"
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#EAE3DC] p-6 space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-medium text-[#2D1F1A] mb-1.5">Full Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Jane Doe"
            className="w-full px-4 py-2.5 rounded-xl border border-[#EAE3DC] bg-[#FDF8F4] text-sm text-[#2D1F1A] placeholder-[#C4AEA4] focus:outline-none focus:ring-2 focus:ring-[#C8896A]/25 focus:border-[#C8896A] transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#2D1F1A] mb-1.5">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="w-full px-4 py-2.5 rounded-xl border border-[#EAE3DC] bg-[#FDF8F4] text-sm text-[#2D1F1A] placeholder-[#C4AEA4] focus:outline-none focus:ring-2 focus:ring-[#C8896A]/25 focus:border-[#C8896A] transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#2D1F1A] mb-1.5">Topic</label>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTopic(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                topic === t
                  ? 'bg-[#C8896A] text-white shadow-sm'
                  : 'bg-[#F5F2EF] text-[#6B4C3B] hover:bg-[#EAE3DC]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#2D1F1A] mb-1.5">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={5}
          placeholder="Describe your issue or question in detail…"
          className="w-full px-4 py-2.5 rounded-xl border border-[#EAE3DC] bg-[#FDF8F4] text-sm text-[#2D1F1A] placeholder-[#C4AEA4] focus:outline-none focus:ring-2 focus:ring-[#C8896A]/25 focus:border-[#C8896A] transition-all resize-none"
        />
        <p className="text-[10px] text-[#C4AEA4] mt-1 text-right">{message.length}/1000</p>
      </div>

      <button
        type="submit"
        disabled={submitting || !name.trim() || !email.trim() || !message.trim()}
        className="w-full py-3 bg-[#C8896A] hover:bg-[#A8694A] disabled:bg-[#C8896A]/50 text-white text-sm font-semibold rounded-xl transition-all hover:shadow-md hover:-translate-y-px disabled:cursor-not-allowed disabled:translate-y-0 flex items-center justify-center gap-2"
      >
        {submitting ? (
          <><Loader2 size={15} className="animate-spin" /> Sending…</>
        ) : (
          <><Send size={15} /> Send Message</>
        )}
      </button>
    </form>
  )
}
