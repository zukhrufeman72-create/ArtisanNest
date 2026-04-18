'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  X, Send, Loader2, Search, ArrowLeft, PlusCircle,
  MessageCircle, Minus,
} from 'lucide-react'

type ChatUser = { id: number; name: string; role: string }

type Conversation = {
  user: ChatUser
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

type Props = { currentUserId: number | null }

export default function MessengerPanel({ currentUserId }: Props) {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [convs, setConvs] = useState<Conversation[]>([])
  const [sellers, setSellers] = useState<ChatUser[]>([])
  const [active, setActive] = useState<ChatUser | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingConvs, setLoadingConvs] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [search, setSearch] = useState('')
  const [sellerSearch, setSellerSearch] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const [unreadTotal, setUnreadTotal] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch conversation list
  const fetchConvs = useCallback(async () => {
    if (!currentUserId) return
    try {
      const res = await fetch('/api/messenger')
      if (res.ok) {
        const data = await res.json()
        setConvs(data.conversations ?? [])
        setSellers(data.sellers ?? [])
        setUnreadTotal(data.unreadTotal ?? 0)
      }
    } catch { /* silent */ }
  }, [currentUserId])

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async (userId: number) => {
    try {
      const res = await fetch(`/api/chat/${userId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages ?? [])
        setConvs((prev) => prev.map((c) => c.user.id === userId ? { ...c, unread: 0 } : c))
        setUnreadTotal((prev) => Math.max(0, prev - (convs.find((c) => c.user.id === userId)?.unread ?? 0)))
      }
    } catch { /* silent */ }
  }, [convs])

  // Open panel (with optional auto-open conversation)
  useEffect(() => {
    const handler = (e: Event) => {
      if (!currentUserId) {
        window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { tab: 'login' } }))
        return
      }
      setOpen(true)
      setMinimized(false)
      const detail = (e as CustomEvent<{ userId?: number; name?: string; role?: string }>).detail
      if (detail?.userId) {
        setActive({ id: detail.userId, name: detail.name ?? '', role: detail.role ?? 'SELLER' })
        setLoadingMsgs(true)
        setMessages([])
      }
    }
    window.addEventListener('open-messenger', handler)
    return () => window.removeEventListener('open-messenger', handler)
  }, [currentUserId])

  // Old open-chat event — redirect into panel
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ userId: number; name: string; role: string }>).detail
      window.dispatchEvent(new CustomEvent('open-messenger', { detail }))
    }
    window.addEventListener('open-chat', handler)
    return () => window.removeEventListener('open-chat', handler)
  }, [])

  // Load conversations when panel opens
  useEffect(() => {
    if (!open) return
    setLoadingConvs(true)
    fetchConvs().finally(() => setLoadingConvs(false))
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load messages when active changes
  useEffect(() => {
    if (!active || !open) return
    setLoadingMsgs(true)
    fetchMessages(active.id).finally(() => setLoadingMsgs(false))
  }, [active?.id, open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Poll messages every 3s when active conversation is open
  useEffect(() => {
    if (!open || minimized || !active) return
    const interval = setInterval(() => fetchMessages(active.id), 3000)
    return () => clearInterval(interval)
  }, [open, minimized, active?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Poll unread count every 10s when panel is closed
  useEffect(() => {
    if (open || !currentUserId) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/messenger')
        if (res.ok) {
          const data = await res.json()
          setUnreadTotal(data.unreadTotal ?? 0)
        }
      } catch { /* silent */ }
    }, 10000)
    return () => clearInterval(interval)
  }, [open, currentUserId])

  // Scroll to bottom
  useEffect(() => {
    if (!minimized) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, minimized])

  // Focus input when conversation opens
  useEffect(() => {
    if (active && !minimized) setTimeout(() => inputRef.current?.focus(), 150)
  }, [active, minimized])

  // Escape key
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open])

  async function openConv(user: ChatUser) {
    setActive(user)
    setShowNewChat(false)
    setMessages([])
  }

  async function sendMsg(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending || !active || !currentUserId) return
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
          const updated = { user: active, lastMessage: text, lastAt: data.message.createdAt, unread: 0 }
          if (exists) return [updated, ...prev.filter((c) => c.user.id !== active.id)]
          return [updated, ...prev]
        })
      }
    } catch { /* silent */ } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  function initials(name: string) {
    return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
  }

  function timeAgo(iso: string) {
    const d = Date.now() - new Date(iso).getTime()
    if (d < 60000) return 'now'
    if (d < 3600000) return `${Math.floor(d / 60000)}m`
    if (d < 86400000) return `${Math.floor(d / 3600000)}h`
    return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function groupByDate(msgs: Message[]) {
    const groups: { date: string; items: Message[] }[] = []
    for (const msg of msgs) {
      const d = new Date(msg.createdAt)
      const today = new Date()
      const y = new Date(today); y.setDate(y.getDate() - 1)
      const label = d.toDateString() === today.toDateString() ? 'Today'
        : d.toDateString() === y.toDateString() ? 'Yesterday'
        : d.toLocaleDateString([], { month: 'short', day: 'numeric' })
      const last = groups[groups.length - 1]
      if (last?.date === label) last.items.push(msg)
      else groups.push({ date: label, items: [msg] })
    }
    return groups
  }

  const filteredConvs = convs.filter((c) => c.user.name.toLowerCase().includes(search.toLowerCase()))
  const filteredSellers = sellers
    .filter((s) => s.name.toLowerCase().includes(sellerSearch.toLowerCase()))
    .filter((s) => !convs.some((c) => c.user.id === s.id))

  // Unread badge for outside button
  const badge = unreadTotal > 0 && !open ? (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
      {unreadTotal > 9 ? '9+' : unreadTotal}
    </span>
  ) : null

  if (!currentUserId) return null

  return (
    <>
      {/* Unread count updater — exposes the badge count to Navbar via event */}
      {typeof window !== 'undefined' && unreadTotal > 0 && null}

      {/* Backdrop */}
      {open && !minimized && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[150]"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sliding panel */}
      <div
        className={`fixed top-0 right-0 h-full z-[160] flex flex-col bg-white shadow-2xl border-l border-[#EAE3DC] transition-all duration-300 ease-in-out
          ${open ? 'translate-x-0' : 'translate-x-full'}
          ${minimized ? 'w-14' : 'w-full sm:w-[420px] lg:w-[480px]'}
        `}
      >
        {minimized ? (
          /* Minimized tab */
          <div className="flex flex-col h-full items-center py-4 gap-3">
            <button
              onClick={() => setMinimized(false)}
              className="w-10 h-10 rounded-xl bg-[#C8896A] text-white flex items-center justify-center hover:bg-[#A8694A] transition-colors relative"
            >
              <MessageCircle size={18} />
              {unreadTotal > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadTotal > 9 ? '9+' : unreadTotal}
                </span>
              )}
            </button>
            <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-xl hover:bg-[#F5F2EF] flex items-center justify-center text-[#9E8079] transition-colors">
              <X size={14} />
            </button>
          </div>
        ) : (
          <>
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#EAE3DC] bg-[#FDF8F4] shrink-0">
              <div className="flex items-center gap-2">
                {active && (
                  <button
                    onClick={() => setActive(null)}
                    className="w-7 h-7 rounded-lg hover:bg-[#F5EFE6] flex items-center justify-center text-[#6B4C3B] transition-colors sm:hidden"
                  >
                    <ArrowLeft size={15} />
                  </button>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#C8896A]/10 flex items-center justify-center">
                    <MessageCircle size={16} className="text-[#C8896A]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#2D1F1A] leading-tight">
                      {active ? active.name : 'Messages'}
                    </p>
                    {active && (
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#7D9B76] animate-pulse" />
                        <span className="text-[10px] text-[#7D9B76] capitalize">{active.role.toLowerCase()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMinimized(true)}
                  className="w-7 h-7 rounded-lg hover:bg-[#F5EFE6] flex items-center justify-center text-[#9E8079] transition-colors"
                >
                  <Minus size={14} />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 rounded-lg hover:bg-[#F5EFE6] flex items-center justify-center text-[#9E8079] hover:text-rose-500 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="flex flex-1 min-h-0">
              {/* ── Conversation list (desktop: always visible, mobile: hidden when chat open) ── */}
              <div className={`flex flex-col border-r border-[#EAE3DC] shrink-0 ${active ? 'hidden sm:flex sm:w-44' : 'flex w-full sm:w-44'}`}>
                {/* Search + New Chat */}
                <div className="px-2 py-2 border-b border-[#EAE3DC] space-y-1.5 shrink-0">
                  <div className="relative">
                    <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9E8079]" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search…"
                      className="w-full pl-7 pr-2 py-1.5 text-[11px] bg-[#F5F2EF] border border-[#EAE3DC] rounded-lg text-[#2D1F1A] placeholder-[#C4AEA4] focus:outline-none focus:border-[#C8896A] transition-all"
                    />
                  </div>
                  <button
                    onClick={() => setShowNewChat((v) => !v)}
                    className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                      showNewChat ? 'bg-[#C8896A] text-white' : 'bg-[#F5F2EF] text-[#6B4C3B] hover:bg-[#EAE3DC]'
                    }`}
                  >
                    <PlusCircle size={11} /> New Chat
                  </button>
                </div>

                {/* Seller picker */}
                {showNewChat && (
                  <div className="border-b border-[#EAE3DC] bg-[#FDF8F4]">
                    <div className="px-2 py-1.5">
                      <input
                        value={sellerSearch}
                        onChange={(e) => setSellerSearch(e.target.value)}
                        placeholder="Search sellers…"
                        className="w-full px-2 py-1 text-[11px] bg-white border border-[#EAE3DC] rounded-lg text-[#2D1F1A] placeholder-[#C4AEA4] focus:outline-none focus:border-[#C8896A] transition-all"
                      />
                    </div>
                    <div className="max-h-32 overflow-y-auto">
                      {filteredSellers.length === 0 ? (
                        <p className="text-[10px] text-[#C4AEA4] text-center py-2">No sellers</p>
                      ) : (
                        filteredSellers.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => openConv(s)}
                            className="w-full flex items-center gap-2 px-2 py-2 hover:bg-[#F5EFE6] transition-colors text-left"
                          >
                            <div className="w-6 h-6 rounded-full bg-[#7D9B76]/20 flex items-center justify-center text-[#7D9B76] text-[9px] font-bold shrink-0">
                              {initials(s.name)}
                            </div>
                            <p className="text-[11px] font-medium text-[#2D1F1A] truncate">{s.name}</p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Conversations */}
                <div className="flex-1 overflow-y-auto">
                  {loadingConvs ? (
                    <div className="flex items-center justify-center h-16">
                      <Loader2 size={16} className="animate-spin text-[#C4AEA4]" />
                    </div>
                  ) : filteredConvs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-24 gap-2 text-center p-2">
                      <MessageCircle size={18} className="text-[#C4AEA4]" />
                      <p className="text-[10px] text-[#9E8079]">No chats yet</p>
                    </div>
                  ) : (
                    filteredConvs.map((conv) => (
                      <button
                        key={conv.user.id}
                        onClick={() => openConv(conv.user)}
                        className={`w-full flex items-center gap-2 px-2 py-2.5 hover:bg-[#FDF8F4] transition-colors text-left border-b border-[#F5EFE6] last:border-0 ${
                          active?.id === conv.user.id ? 'bg-[#FDF8F4] border-l-2 border-l-[#C8896A] pl-1.5' : ''
                        }`}
                      >
                        <div className="relative shrink-0">
                          <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#C8896A] to-[#8B5E45] flex items-center justify-center text-white text-[10px] font-bold">
                            {initials(conv.user.name)}
                          </div>
                          {conv.unread > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-rose-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                              {conv.unread > 9 ? '9+' : conv.unread}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[11px] truncate ${conv.unread > 0 ? 'font-bold text-[#2D1F1A]' : 'font-medium text-[#2D1F1A]'}`}>
                            {conv.user.name}
                          </p>
                          <p className="text-[9px] text-[#C4AEA4] truncate">{timeAgo(conv.lastAt)}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* ── Chat area ── */}
              <div className={`flex-1 flex flex-col min-w-0 ${!active ? 'hidden sm:flex' : 'flex'}`}>
                {!active ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 p-4 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-[#F5F2EF] flex items-center justify-center">
                      <MessageCircle size={22} className="text-[#C8896A]" />
                    </div>
                    <p className="text-xs text-[#9E8079]">Pick a conversation or start a new chat</p>
                  </div>
                ) : (
                  <>
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
                      {loadingMsgs ? (
                        <div className="h-full flex items-center justify-center">
                          <Loader2 size={20} className="animate-spin text-[#C4AEA4]" />
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center gap-2 text-center">
                          <MessageCircle size={18} className="text-[#C4AEA4]" />
                          <p className="text-xs text-[#9E8079]">Say hello to {active.name}!</p>
                        </div>
                      ) : (
                        groupByDate(messages).map((group) => (
                          <div key={group.date}>
                            <div className="flex items-center gap-2 my-2">
                              <div className="flex-1 h-px bg-[#EAE3DC]" />
                              <span className="text-[9px] text-[#C4AEA4] font-medium">{group.date}</span>
                              <div className="flex-1 h-px bg-[#EAE3DC]" />
                            </div>
                            <div className="space-y-1.5">
                              {group.items.map((msg) => {
                                const isMine = msg.senderId === currentUserId
                                return (
                                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] flex flex-col gap-0.5 ${isMine ? 'items-end' : 'items-start'}`}>
                                      <div className={`px-3 py-2 rounded-2xl text-xs leading-relaxed break-words ${
                                        isMine
                                          ? 'bg-[#C8896A] text-white rounded-br-sm'
                                          : 'bg-[#F5F2EF] text-[#2D1F1A] rounded-bl-sm'
                                      }`}>
                                        {msg.content}
                                      </div>
                                      <span className="text-[9px] text-[#C4AEA4] px-1">{formatTime(msg.createdAt)}</span>
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
                    <div className="px-3 py-2.5 border-t border-[#EAE3DC] bg-[#FDF8F4] shrink-0">
                      <form onSubmit={sendMsg} className="flex items-center gap-2">
                        <input
                          ref={inputRef}
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder={`Message ${active.name}…`}
                          maxLength={1000}
                          className="flex-1 px-3 py-2 rounded-xl border border-[#EAE3DC] bg-white text-xs text-[#2D1F1A] placeholder-[#C4AEA4] focus:outline-none focus:ring-2 focus:ring-[#C8896A]/25 focus:border-[#C8896A] transition-all"
                        />
                        <button
                          type="submit"
                          disabled={!input.trim() || sending}
                          className="w-8 h-8 rounded-xl bg-[#C8896A] hover:bg-[#A8694A] disabled:bg-[#C8896A]/40 text-white flex items-center justify-center transition-all disabled:cursor-not-allowed"
                        >
                          {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                        </button>
                      </form>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Trigger button — shown when panel is closed, with unread badge */}
      {!open && currentUserId && (
        <button
          onClick={() => { setOpen(true); setMinimized(false) }}
          className="fixed bottom-6 right-6 z-[140] w-12 h-12 rounded-full bg-[#C8896A] hover:bg-[#A8694A] text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center justify-center relative"
        >
          <MessageCircle size={20} />
          {badge}
        </button>
      )}
    </>
  )
}
