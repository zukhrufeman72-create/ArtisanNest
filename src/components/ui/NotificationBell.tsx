'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, X, CheckCheck, ExternalLink } from 'lucide-react'
import Link from 'next/link'

type Notification = {
  id: number
  title: string
  body: string
  type: string
  isRead: boolean
  link: string | null
  createdAt: string
}

const TYPE_ICON: Record<string, string> = {
  NEW_SELLER: '🏪',
  NEW_CUSTOMER: '👤',
  PRODUCT_APPROVED: '✅',
  PRODUCT_REJECTED: '❌',
  PRODUCT_SUBMITTED: '📦',
  ORDER_STATUS: '🛍️',
  NEW_ORDER: '🛒',
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function NotificationBell({ accentColor = '#C8896A' }: { accentColor?: string }) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.isRead).length

  async function fetchNotifications() {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) setNotifications(await res.json())
    } finally {
      setLoading(false)
    }
  }

  async function markAllRead() {
    await fetch('/api/notifications', { method: 'PATCH' })
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  useEffect(() => {
    fetchNotifications()
    // Poll every 30s for new notifications
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutsideClick)
    return () => document.removeEventListener('mousedown', onOutsideClick)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setOpen((v) => !v)
          if (!open) fetchNotifications()
        }}
        className="relative p-2 rounded-xl text-[#6B4C3B] hover:bg-[#F5EFE6] transition-colors group"
        aria-label="Notifications"
      >
        <Bell size={18} className="transition-transform group-hover:rotate-12 duration-300" />
        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full text-white text-[9px] font-bold px-1 animate-pulse"
            style={{ background: accentColor }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl shadow-black/15 border border-[#EAE3DC] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#EAE3DC] flex items-center justify-between">
            <div>
              <p className="font-semibold text-[#2D1F1A] text-sm">Notifications</p>
              {unreadCount > 0 && (
                <p className="text-xs text-[#9E8079]">{unreadCount} unread</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-[#9E8079] hover:text-[#2D1F1A] px-2 py-1 rounded-lg hover:bg-[#F5EFE6] transition-colors"
                  title="Mark all read"
                >
                  <CheckCheck size={12} />
                  All read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-[#9E8079] hover:text-[#2D1F1A] hover:bg-[#F5EFE6] transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="max-h-[340px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="py-8 text-center">
                <div className="w-5 h-5 border-2 border-[#EAE3DC] border-t-[#C8896A] rounded-full animate-spin mx-auto" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell size={28} className="text-[#EAE3DC] mx-auto mb-2" />
                <p className="text-sm text-[#9E8079]">No notifications yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-[#F5EFE6]">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`px-4 py-3 hover:bg-[#FDF8F4] transition-colors ${!n.isRead ? 'bg-[#FDF8F4]' : ''}`}
                  >
                    <div className="flex gap-3">
                      <span className="text-lg shrink-0 mt-0.5">
                        {TYPE_ICON[n.type] ?? '🔔'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-semibold leading-tight ${!n.isRead ? 'text-[#2D1F1A]' : 'text-[#6B4C3B]'}`}>
                            {n.title}
                          </p>
                          {!n.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1" style={{ background: accentColor }} />
                          )}
                        </div>
                        <p className="text-[11px] text-[#9E8079] mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[10px] text-[#C4AEA4]">{timeAgo(n.createdAt)}</span>
                          {n.link && (
                            <Link
                              href={n.link}
                              onClick={() => setOpen(false)}
                              className="flex items-center gap-0.5 text-[10px] font-medium hover:underline transition-colors"
                              style={{ color: accentColor }}
                            >
                              View <ExternalLink size={9} />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
