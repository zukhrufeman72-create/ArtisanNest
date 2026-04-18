'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Menu, Bell, Search, ChevronDown, User, LogOut, Settings, ExternalLink } from 'lucide-react'
import { logout } from '@/app/actions/auth'

type Props = {
  sellerName: string
  sellerEmail: string
  onMenuClick: () => void
}

export default function SellerHeader({ sellerName, sellerEmail, onMenuClick }: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const initials = sellerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="h-16 bg-white border-b border-[#EAE3DC] px-4 sm:px-6 flex items-center gap-4 shrink-0 z-10">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 -ml-2 rounded-xl text-[#6B4C3B] hover:bg-[#F5EFE6] transition-colors"
      >
        <Menu size={20} />
      </button>

      <div className="hidden lg:block">
        <h1 className="text-sm font-semibold text-[#2D1F1A]">Seller Portal</h1>
        <p className="text-xs text-[#9E8079]">Manage your handmade store</p>
      </div>

      <div className="flex-1 max-w-sm ml-auto lg:ml-0">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8079]" />
          <input
            type="text"
            placeholder="Search products, orders…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-[#F5F2EF] border border-[#EAE3DC] rounded-xl text-[#2D1F1A] placeholder-[#C4AEA4] focus:outline-none focus:ring-2 focus:ring-[#7D9B76]/30 focus:border-[#7D9B76] transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button className="relative p-2 rounded-xl text-[#6B4C3B] hover:bg-[#F5EFE6] transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#7D9B76] rounded-full" />
        </button>

        <Link
          href="/"
          target="_blank"
          className="hidden sm:flex p-2 rounded-xl text-[#6B4C3B] hover:bg-[#F5EFE6] transition-colors"
          title="Visit store"
        >
          <ExternalLink size={18} />
        </Link>

        <div className="relative ml-1" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl hover:bg-[#F5EFE6] transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-[#7D9B76] flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-[#2D1F1A] leading-tight">{sellerName}</p>
              <p className="text-[10px] text-[#9E8079] leading-tight">Seller</p>
            </div>
            <ChevronDown
              size={14}
              className={`hidden sm:block text-[#9E8079] transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl shadow-black/10 border border-[#EAE3DC] py-1.5 z-50">
              <div className="px-4 py-2.5 border-b border-[#EAE3DC]">
                <p className="text-sm font-semibold text-[#2D1F1A]">{sellerName}</p>
                <p className="text-xs text-[#9E8079] truncate">{sellerEmail}</p>
              </div>
              <Link
                href="/seller/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#6B4C3B] hover:bg-[#F5EFE6] transition-colors"
              >
                <User size={15} />
                My Profile
              </Link>
              <div className="border-t border-[#EAE3DC] mt-1">
                <form action={logout}>
                  <button
                    type="submit"
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut size={15} />
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
