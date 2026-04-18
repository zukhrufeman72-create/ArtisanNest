'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, Send, Loader2, Search, X, ArrowLeft, PlusCircle } from 'lucide-react'

type ConvUser = { id: number; name: string; role: string }

type Conversation = {
  user: ConvUser
  lastMessage: string
  lastAt: string
  unread: number
}

type Message = {
  id: number
  content: string
  createdAt: string
  senderId: number
  receiverId: number
  isRead: boolean
}

type Props = {
  conversations: Conversation[]
  currentUserId: number
  currentUserRole: string
  sellers: ConvUser[]
}

export default function MessengerView({ conversations: initialConvs, currentUserId, currentUserRole, sellers }: Props) {
  const [convs, setConvs] = useState(initialConvs)
  const [active, setActive] = useState<ConvUser | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [search, setSearch] = useState('')
  const [mobileShowChat, setMobileShowChat] = useState(false)
  const [showNewChat, setShowNewChat] = useState(false)
  const [sellerSearch, setSellerSearch] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const fetchMessages = useCallback(async (userId: number) => {
    try {
      const res = await fetch(`/api/chat/${userId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages ?? [])
        setConvs((prev) => prev.map((c) => c.user.id === userId ? { ...c, unread: 0 } : c))
      }
    } catch { /* silent */ }
  }, [])

  async function openConv(user: ConvUser) {
    setActive(user)
    setMobileShowChat(true)
    setShowNewChat(false)
    setLoadingMsgs(true)
    setMessages([])
    await fetchMessages(user.id)
    setLoadingMsgs(false)
  }

  useEffect(() => {
    if (!active) return
    const interval = setInterval(() => fetchMessages(active.id), 3000)
    return () => clearInterval(interval)
  }, [active, fetchMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (active) setTimeout(() => inputRef.current?.focus(), 100)
  }, [active])

  useEffect(() => {
    const handler = (e: Event) => {
      const { userId, name, role } = (e as CustomEvent<{ userId: number; name: string; role: string }>).detail
      openConv({ id: userId, name, role })
    }
    window.addEventListener('open-chat', handler)
    return () => window.removeEventListener('open-chat', handler)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function sendMsg(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending || !active) return
    setSending(true)
    setInput('')
    try {
      const res = await fetch(`/api/chat/${active.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => [...prev, data.message])
        setConvs((prev) => {
          const exists = prev.find((c) => c.user.id === active.id)
          if (exists) return [{ ...exists, lastMessage: text, lastAt: data.message.createdAt, unread: 0 }, ...prev.filter((c) => c.user.id !== active.id)]
          return [{ user: active, lastMessage: text, lastAt: data.message.createdAt, unread: 0 }, ...prev]
        })
      }
    } catch { /* silent */ } finally {
      setSending(false)
    }
  }

  const filtered = convs.filter((c) => c.user.name.toLowerCase().includes(search.toLowerCase()))
  const filteredSellers = sellers.filter((s) =>
    s.name.toLowerCase().includes(sellerSearch.toLowerCase()) &&
    !convs.some((c) => c.user.id === s.id)
  )

  function initials(name: string) {
    return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
  }

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    if (diff < 60000) return 'now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
    return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function formatDate(iso: string) {
    const d = new Date(iso)
    const today = new Date()
    if (d.toDateString() === today.toDateString()) return 'Today'
    const y = new Date(today); y.setDate(y.getDate() - 1)
    if (d.toDateString() === y.toDateString()) return 'Yesterday'
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  const grouped: { date: string; items: Message[] }[] = []
  for (const msg of messages) {
    const date = formatDate(msg.createdAt)
    const last = grouped[grouped.length - 1]
    if (last?.date === date) last.items.push(msg)
    else grouped.push({ date, items: [msg] })
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white rounded-3xl border border-[#EAE3DC] overflow-hidden shadow-sm" style={{ height: 'calc(100vh - 160px)', minHeight: '520px' }}>
        <div className="flex h-full">

          {/* ── Sidebar ── */}
          <div className={`w-full lg:w-80 xl:w-96 border-r border-[#EAE3DC] flex flex-col shrink-0 ${mobileShowChat ? 'hidden lg:flex' : 'flex'}`}>
            {/* Header */}
            <div className="px-4 py-4 border-b border-[#EAE3DC] shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-base font-serif font-bold text-[#2D1F1A]">Messages</h1>
                {currentUserRole !== 'ADMIN' && (
                  <button
                    onClick={() => setShowNewChat((v) => !v)}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${showNewChat ? 'bg-[#C8896A] text-white' : 'bg-[#F5F2EF] text-[#6B4C3B] hover:bg-[#EAE3DC]'}`}
                  >
                    <PlusCircle size={13} /> New Chat
                  </button>
                )}
              </div>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8079]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="w-full pl-8 pr-3 py-2 text-xs bg-[#F5F2EF] border border-[#EAE3DC] rounded-xl text-[#2D1F1A] placeholder-[#C4AEA4] focus:outline-none focus:ring-2 focus:ring-[#C8896A]/20 transition-all"
                />
              </div>
            </div>

            {/* New chat — seller list */}
            {showNewChat && (
              <div className="border-b border-[#EAE3DC] bg-[#FDF8F4]">
                <div className="px-4 py-2.5 flex items-center justify-between">
                  <p className="text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Sellers</p>
                  <button onClick={() => setShowNewChat(false)} className="text-[#C4AEA4] hover:text-[#6B4C3B]"><X size={13} /></button>
                </div>
                <div className="px-3 pb-2">
                  <input
                    value={sellerSearch}
                    onChange={(e) => setSellerSearch(e.target.value)}
                    placeholder="Search sellers…"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-[#EAE3DC] rounded-lg text-[#2D1F1A] placeholder-[#C4AEA4] focus:outline-none focus:border-[#C8896A] transition-all"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredSellers.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-[#C4AEA4] text-center">
                      {sellers.length === 0 ? 'No sellers available' : 'No new sellers found'}
                    </p>
                  ) : (
                    filteredSellers.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => openConv(s)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F5F2EF] transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#7D9B76] to-[#5a7258] flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {initials(s.name)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#2D1F1A]">{s.name}</p>
                          <p className="text-[10px] text-[#9E8079]">Seller</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Conversations list */}
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
                  <MessageCircle size={24} className="text-[#C4AEA4]" />
                  <p className="text-sm text-[#9E8079]">No conversations yet</p>
                  {currentUserRole !== 'ADMIN' && (
                    <button
                      onClick={() => setShowNewChat(true)}
                      className="text-xs text-[#C8896A] font-semibold hover:text-[#A8694A] transition-colors"
                    >
                      Start a new chat →
                    </button>
                  )}
                </div>
              ) : (
                filtered.map((conv) => (
                  <button
                    key={conv.user.id}
                    onClick={() => openConv(conv.user)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#FDF8F4] transition-colors text-left border-b border-[#F5EFE6] last:border-0 ${
                      active?.id === conv.user.id ? 'bg-[#FDF8F4] border-l-2 border-l-[#C8896A]' : ''
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#C8896A] to-[#8B5E45] flex items-center justify-center text-white text-xs font-bold">
                        {initials(conv.user.name)}
                      </div>
                      {conv.unread > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#C8896A] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                          {conv.unread > 9 ? '9+' : conv.unread}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-sm truncate ${conv.unread > 0 ? 'font-bold text-[#2D1F1A]' : 'font-medium text-[#2D1F1A]'}`}>
                          {conv.user.name}
                        </p>
                        <span className="text-[10px] text-[#C4AEA4] shrink-0">{timeAgo(conv.lastAt)}</span>
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${conv.unread > 0 ? 'text-[#6B4C3B] font-medium' : 'text-[#9E8079]'}`}>
                        {conv.lastMessage}
                      </p>
                      <p className="text-[10px] text-[#C4AEA4] capitalize mt-0.5">{conv.user.role.toLowerCase()}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* ── Chat panel ── */}
          <div className={`flex-1 flex flex-col min-w-0 ${!mobileShowChat && !active ? 'hidden lg:flex' : 'flex'}`}>
            {!active ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
                <div className="w-20 h-20 rounded-3xl bg-[#F5F2EF] flex items-center justify-center">
                  <MessageCircle size={36} className="text-[#C8896A]" />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-bold text-[#2D1F1A] mb-1">Your Messages</h2>
                  <p className="text-sm text-[#9E8079]">Select a conversation to start chatting</p>
                </div>
                {currentUserRole !== 'ADMIN' && sellers.length > 0 && (
                  <button
                    onClick={() => setShowNewChat(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#C8896A] text-white text-sm font-semibold rounded-xl hover:bg-[#A8694A] transition-all hover:shadow-md"
                  >
                    <PlusCircle size={15} /> Message a Seller
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-[#EAE3DC] bg-[#FDF8F4] shrink-0">
                  <button
                    onClick={() => { setActive(null); setMobileShowChat(false) }}
                    className="lg:hidden w-8 h-8 rounded-full hover:bg-[#F5EFE6] flex items-center justify-center text-[#6B4C3B] transition-colors"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#C8896A] to-[#8B5E45] flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {initials(active.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#2D1F1A] text-sm">{active.name}</p>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7D9B76] animate-pulse" />
                      <span className="text-[11px] text-[#7D9B76] capitalize">{active.role.toLowerCase()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => { setActive(null); setMobileShowChat(false) }}
                    className="hidden lg:flex w-8 h-8 rounded-full hover:bg-[#F5EFE6] items-center justify-center text-[#9E8079] hover:text-[#2D1F1A] transition-colors"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                  {loadingMsgs ? (
                    <div className="h-full flex items-center justify-center">
                      <Loader2 size={24} className="animate-spin text-[#C4AEA4]" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
                      <MessageCircle size={24} className="text-[#C4AEA4]" />
                      <p className="text-sm text-[#9E8079]">No messages yet — say hello!</p>
                    </div>
                  ) : (
                    grouped.map((group) => (
                      <div key={group.date}>
                        <div className="flex items-center gap-3 my-4">
                          <div className="flex-1 h-px bg-[#EAE3DC]" />
                          <span className="text-[10px] text-[#C4AEA4] font-medium px-2">{group.date}</span>
                          <div className="flex-1 h-px bg-[#EAE3DC]" />
                        </div>
                        <div className="space-y-2">
                          {group.items.map((msg) => {
                            const isMine = msg.senderId === currentUserId
                            return (
                              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[65%] flex flex-col gap-0.5 ${isMine ? 'items-end' : 'items-start'}`}>
                                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                    isMine ? 'bg-[#C8896A] text-white rounded-br-sm' : 'bg-[#F5F2EF] text-[#2D1F1A] rounded-bl-sm'
                                  }`}>
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
                  <form onSubmit={sendMsg} className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={`Message ${active.name}…`}
                      maxLength={1000}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-[#EAE3DC] bg-white text-sm text-[#2D1F1A] placeholder-[#C4AEA4] focus:outline-none focus:ring-2 focus:ring-[#C8896A]/25 focus:border-[#C8896A] transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || sending}
                      className="w-10 h-10 rounded-xl bg-[#C8896A] hover:bg-[#A8694A] disabled:bg-[#C8896A]/40 text-white flex items-center justify-center transition-all hover:shadow-md disabled:cursor-not-allowed"
                    >
                      {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
