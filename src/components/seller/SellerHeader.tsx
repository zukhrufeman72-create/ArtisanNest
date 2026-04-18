'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Menu, Search, ChevronDown, User, LogOut, ExternalLink, X } from 'lucide-react'
import { logout } from '@/app/actions/auth'
import NotificationBell from '@/components/ui/NotificationBell'

type Props = {
  sellerName: string
  sellerEmail: string
  onMenuClick: () => void
}

export default function SellerHeader({ sellerName, sellerEmail, onMenuClick }: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutsideClick)
    return () => document.removeEventListener('mousedown', onOutsideClick)
  }, [])

  const initials = sellerName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <header className="h-16 shrink-0 z-10 relative">
      <div className="absolute inset-0 bg-white/90 backdrop-blur-md border-b border-[#EAE3DC]/80 shadow-sm shadow-black/3" />

      <div className="relative h-full px-4 sm:px-6 flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-xl text-[#6B4C3B] hover:bg-[#F5EFE6] transition-colors"
        >
          <Menu size={20} />
        </button>

        <div className="hidden lg:block">
          <p className="text-xs font-semibold text-[#2D1F1A]">Seller Portal</p>
          <p className="text-[10px] text-[#9E8079] leading-none mt-0.5">Manage your handmade store</p>
        </div>

        {/* Expanding search */}
        <div className={`flex-1 ml-auto lg:ml-0 transition-all duration-300 ${searchFocused ? 'max-w-md' : 'max-w-sm'}`}>
          <div className={`relative flex items-center rounded-xl border transition-all duration-200 ${
            searchFocused ? 'border-[#7D9B76] bg-white shadow-sm shadow-[#7D9B76]/15' : 'border-[#EAE3DC] bg-[#F5F2EF]'
          }`}>
            <Search size={15} className={`absolute left-3 transition-colors duration-200 ${searchFocused ? 'text-[#7D9B76]' : 'text-[#9E8079]'}`} />
            <input
              ref={searchRef}
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search products, orders…"
              className="w-full pl-9 pr-8 py-2 text-sm bg-transparent text-[#2D1F1A] placeholder-[#C4AEA4] focus:outline-none"
            />
            {searchValue && (
              <button onClick={() => { setSearchValue(''); searchRef.current?.focus() }}
                className="absolute right-2.5 p-0.5 rounded text-[#9E8079] hover:text-[#2D1F1A] transition-colors">
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <NotificationBell accentColor="#7D9B76" />

          <Link href="/" target="_blank"
            className="hidden sm:flex p-2 rounded-xl text-[#6B4C3B] hover:bg-[#F5EFE6] transition-colors group" title="Visit store">
            <ExternalLink size={18} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 duration-200" />
          </Link>

          {/* Profile dropdown */}
          <div className="relative ml-1" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className={`flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-xl transition-all duration-200 ${dropdownOpen ? 'bg-[#F5EFE6]' : 'hover:bg-[#F5EFE6]'}`}
            >
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-[#7D9B76] to-[#5a7a54] flex items-center justify-center text-white text-xs font-bold shadow-sm ring-2 ring-[#7D9B76]/20">
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-[#2D1F1A] leading-tight">{sellerName}</p>
                <p className="text-[10px] text-[#9E8079] leading-none mt-0.5">Seller</p>
              </div>
              <ChevronDown size={14} className={`hidden sm:block text-[#9E8079] transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl shadow-black/12 border border-[#EAE3DC] py-1.5 z-50">
                <div className="px-4 py-3 border-b border-[#EAE3DC]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#7D9B76] to-[#5a7a54] flex items-center justify-center text-white text-sm font-bold">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#2D1F1A] truncate">{sellerName}</p>
                      <p className="text-xs text-[#9E8079] truncate">{sellerEmail}</p>
                    </div>
                  </div>
                  <span className="mt-2 inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#7D9B76]/10 text-[#7D9B76]">
                    Seller
                  </span>
                </div>
                <div className="py-1">
                  <Link href="/seller/profile" onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#6B4C3B] hover:bg-[#F5EFE6] transition-colors">
                    <User size={15} className="text-[#9E8079]" /> My Profile
                  </Link>
                  <Link href="/" target="_blank" onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#6B4C3B] hover:bg-[#F5EFE6] transition-colors">
                    <ExternalLink size={15} className="text-[#9E8079]" /> Visit Store
                  </Link>
                </div>
                <div className="border-t border-[#EAE3DC] pt-1">
                  <form action={logout}>
                    <button type="submit" className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors">
                      <LogOut size={15} /> Sign out
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
