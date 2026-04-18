'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Loader2, MessageCircle } from 'lucide-react'

type Message = {
  id: number
  content: string
  createdAt: string
  senderId: number
  receiverId: number
  isRead: boolean
}

type OtherUser = {
  id: number
  name: string
  role: string
}

type Props = {
  currentUserId: number
  otherUserId: number
  initialMessages: Message[]
  otherUser: OtherUser
}

export default function ChatWindow({ currentUserId, otherUserId, initialMessages, otherUser }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat/${otherUserId}`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages)
      }
    } catch { /* silent */ }
  }, [otherUserId])

  // Poll every 3 seconds
  useEffect(() => {
    const interval = setInterval(fetchMessages, 3000)
    return () => clearInterval(interval)
  }, [fetchMessages])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending) return

    setSending(true)
    setInput('')
    try {
      const res = await fetch(`/api/chat/${otherUserId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => [...prev, data.message])
      }
    } catch { /* silent */ } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function formatDate(iso: string) {
    const d = new Date(iso)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (d.toDateString() === today.toDateString()) return 'Today'
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  // Group messages by date
  const grouped: { date: string; items: Message[] }[] = []
  for (const msg of messages) {
    const date = formatDate(msg.createdAt)
    const last = grouped[grouped.length - 1]
    if (last?.date === date) {
      last.items.push(msg)
    } else {
      grouped.push({ date, items: [msg] })
    }
  }

  const roleLabel = otherUser.role === 'SELLER' ? 'Seller' : otherUser.role === 'ADMIN' ? 'Admin' : 'Customer'

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#EAE3DC] bg-[#FDF8F4] shrink-0">
        <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#C8896A] to-[#8B5E45] flex items-center justify-center text-white text-sm font-bold shrink-0">
          {otherUser.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
        </div>
        <div>
          <p className="font-semibold text-[#2D1F1A] text-sm">{otherUser.name}</p>
          <p className="text-[11px] text-[#9E8079]">{roleLabel}</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#7D9B76] animate-pulse" />
          <span className="text-[11px] text-[#7D9B76] font-medium">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#F5F2EF] flex items-center justify-center">
              <MessageCircle size={24} className="text-[#C8896A]" />
            </div>
            <p className="text-sm text-[#9E8079]">No messages yet</p>
            <p className="text-xs text-[#C4AEA4]">Say hello to {otherUser.name}!</p>
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.date}>
              {/* Date divider */}
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-[#EAE3DC]" />
                <span className="text-[10px] text-[#C4AEA4] font-medium px-2">{group.date}</span>
                <div className="flex-1 h-px bg-[#EAE3DC]" />
              </div>

              <div className="space-y-2">
                {group.items.map((msg) => {
                  const isMine = msg.senderId === currentUserId
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isMine
                              ? 'bg-[#C8896A] text-white rounded-br-sm'
                              : 'bg-[#F5F2EF] text-[#2D1F1A] rounded-bl-sm'
                          }`}
                        >
                          {msg.content}
                        </div>
                        <span className="text-[10px] text-[#C4AEA4] px-1">{formatTime(msg.createdAt)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-[#EAE3DC] bg-[#FDF8F4] shrink-0">
        <form onSubmit={sendMessage} className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${otherUser.name}…`}
            className="flex-1 px-4 py-2.5 rounded-xl border border-[#EAE3DC] bg-white text-sm text-[#2D1F1A] placeholder-[#C4AEA4] focus:outline-none focus:ring-2 focus:ring-[#C8896A]/25 focus:border-[#C8896A] transition-all"
            maxLength={1000}
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-xl bg-[#C8896A] hover:bg-[#A8694A] disabled:bg-[#C8896A]/40 text-white flex items-center justify-center transition-all hover:shadow-md disabled:cursor-not-allowed"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>
      </div>
    </div>
  )
}
