'use client'

import { useActionState, useState } from 'react'
import { submitComplaint } from '@/app/actions/complaint'
import { Loader2, Send, CheckCircle } from 'lucide-react'

type Props = { isLoggedIn: boolean }

export default function SupportForm({ isLoggedIn }: Props) {
  const [state, action, pending] = useActionState(submitComplaint, undefined)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  if (!isLoggedIn) {
    return (
      <div className="bg-white rounded-2xl border border-[#EAE3DC] p-8 text-center">
        <p className="text-sm text-[#9E8079] mb-4">Please sign in to submit a complaint.</p>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { tab: 'login' } }))}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C8896A] text-white text-sm font-semibold rounded-full hover:bg-[#A8694A] transition-all hover:shadow-md"
        >
          Sign In
        </button>
      </div>
    )
  }

  if (state?.success) {
    return (
      <div className="bg-white rounded-2xl border border-[#EAE3DC] p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#7D9B76]/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={28} className="text-[#7D9B76]" />
        </div>
        <h3 className="font-semibold text-[#2D1F1A] mb-1">Complaint Submitted</h3>
        <p className="text-sm text-[#9E8079]">We'll review your complaint and get back to you soon.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-5 px-5 py-2 text-sm font-semibold text-[#C8896A] hover:text-[#A8694A] transition-colors"
        >
          Submit another
        </button>
      </div>
    )
  }

  return (
    <form action={action} className="bg-white rounded-2xl border border-[#EAE3DC] p-6 space-y-5">
      <h2 className="font-semibold text-[#2D1F1A]">Submit a Complaint</h2>

      {state?.error && (
        <div className="px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
          {state.error}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-[#2D1F1A] mb-1.5">Subject</label>
        <input
          name="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          placeholder="Brief description of your issue"
          className="w-full px-4 py-2.5 rounded-xl border border-[#EAE3DC] bg-[#FDF8F4] text-sm text-[#2D1F1A] placeholder-[#C4AEA4] focus:outline-none focus:ring-2 focus:ring-[#C8896A]/25 focus:border-[#C8896A] transition-all"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[#2D1F1A] mb-1.5">Message</label>
        <textarea
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={5}
          placeholder="Describe your issue in detail…"
          className="w-full px-4 py-2.5 rounded-xl border border-[#EAE3DC] bg-[#FDF8F4] text-sm text-[#2D1F1A] placeholder-[#C4AEA4] focus:outline-none focus:ring-2 focus:ring-[#C8896A]/25 focus:border-[#C8896A] transition-all resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={pending || !subject.trim() || !message.trim()}
        className="flex items-center gap-2 px-6 py-2.5 bg-[#C8896A] hover:bg-[#A8694A] disabled:bg-[#C8896A]/50 text-white text-sm font-semibold rounded-xl transition-all hover:shadow-md disabled:cursor-not-allowed"
      >
        {pending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        {pending ? 'Submitting…' : 'Submit Complaint'}
      </button>
    </form>
  )
}
