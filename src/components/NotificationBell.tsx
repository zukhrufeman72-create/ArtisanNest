'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, X, Check, ExternalLink, Package, ShoppingBag, Tag, Info } from 'lucide-react'
import Link from 'next/link'

interface Notification {
  id: number
  title: string
  body: string
  type: string
  isRead: boolean
  link: string | null
  imageUrl: string | null
  createdAt: string
}

const TYPE_ICON: Record<string, React.ElementType> = {
  ORDER: ShoppingBag,
  PRODUCT: Package,
  DEAL: Tag,
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const unread = notifications.filter((n) => !n.isRead).length

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) setNotifications(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [load])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const markAllRead = async () => {
    await fetch('/api/notifications', { method: 'PATCH' })
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  const markOne = async (id: number) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n))
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#F5EFE6] transition-colors text-[#6B4C3B] hover:text-[#C8896A]"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-[#C8896A] text-white text-[9px] rounded-full flex items-center justify-center font-bold animate-pulse">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-[#EAE3DC] shadow-xl shadow-black/10 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#F5EFE6]">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-[#C8896A]" />
              <span className="font-semibold text-sm text-[#2D1F1A]">Notifications</span>
              {unread > 0 && (
                <span className="bg-[#C8896A]/10 text-[#C8896A] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unread} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-[10px] text-[#9E8079] hover:text-[#C8896A] transition-colors px-2 py-1 rounded-lg hover:bg-[#F5EFE6]"
                >
                  <Check size={10} /> Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg hover:bg-[#F5EFE6] text-[#9E8079] hover:text-[#2D1F1A] transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center h-24">
                <div className="w-6 h-6 border-2 border-[#C8896A] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-10 text-[#9E8079] text-sm">
                <Bell size={28} className="mx-auto mb-2 opacity-30" />
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = TYPE_ICON[n.type] ?? Info
                const inner = (
                  <div
                    className={`flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer group ${
                      n.isRead ? 'hover:bg-[#F5F0EB]/60' : 'bg-[#FDF8F4] hover:bg-[#F5EFE6]'
                    }`}
                    onClick={() => { if (!n.isRead) void markOne(n.id) }}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      n.isRead ? 'bg-[#F5F0EB] text-[#9E8079]' : 'bg-[#C8896A]/10 text-[#C8896A]'
                    }`}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${n.isRead ? 'text-[#9E8079]' : 'text-[#2D1F1A]'}`}>
                        {n.title}
                      </p>
                      <p className="text-[11px] text-[#9E8079] leading-relaxed line-clamp-2 mt-0.5">{n.body}</p>
                      <p className="text-[10px] text-[#C8896A]/70 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.isRead && (
                      <div className="w-2 h-2 bg-[#C8896A] rounded-full mt-1.5 shrink-0" />
                    )}
                    {n.link && (
                      <ExternalLink size={11} className="text-[#9E8079] opacity-0 group-hover:opacity-100 transition-opacity mt-1 shrink-0" />
                    )}
                  </div>
                )
                return n.link ? (
                  <Link key={n.id} href={n.link} onClick={() => setOpen(false)}>
                    {inner}
                  </Link>
                ) : (
                  <div key={n.id}>{inner}</div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[#F5EFE6] px-4 py-2.5">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs text-[#C8896A] hover:text-[#A8694A] font-medium transition-colors"
            >
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
