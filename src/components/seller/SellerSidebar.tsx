'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, ShoppingBag, Warehouse,
  TrendingUp, Star, User, LogOut, ChevronDown,
  MessageCircle, X,
} from 'lucide-react'
import { logout } from '@/app/actions/auth'

type NavChild = { label: string; href: string }
type NavItem = {
  label: string
  icon: React.ElementType
  href?: string
  children?: NavChild[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/seller/dashboard' },
  {
    label: 'Products', icon: Package,
    children: [
      { label: 'Add Product', href: '/seller/products/add' },
      { label: 'My Products', href: '/seller/products' },
    ],
  },
  { label: 'Orders', icon: ShoppingBag, href: '/seller/orders' },
  { label: 'Inventory', icon: Warehouse, href: '/seller/inventory' },
  { label: 'Earnings', icon: TrendingUp, href: '/seller/earnings' },
  { label: 'Reviews', icon: Star, href: '/seller/reviews' },
  { label: 'Profile', icon: User, href: '/seller/profile' },
]

type Props = { isOpen: boolean; onClose: () => void }

export default function SellerSidebar({ isOpen, onClose }: Props) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    NAV_ITEMS.forEach((item) => {
      if (item.children?.some((c) => pathname.startsWith(c.href))) {
        initial[item.label] = true
      }
    })
    return initial
  })

  const toggle = (label: string) =>
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }))

  const isActive = (href: string) => pathname === href
  const isGroupActive = (item: NavItem) =>
    item.children?.some((c) => pathname.startsWith(c.href)) ?? false

  return (
    <aside
      className={`fixed inset-y-0 left-0 w-65 bg-[#111918] z-30 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-5 border-b border-white/5 shrink-0">
        <Link href="/seller/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#7D9B76] flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 3C8.5 3 6 6.5 6 10.5C6 14.5 9 18 12 20C15 18 18 14.5 18 10.5C18 6.5 15.5 3 12 3Z" fill="white" opacity="0.95"/>
              <path d="M12 20V23" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M9.5 22H14.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="12" cy="10" r="2.5" fill="#7D9B76"/>
            </svg>
          </div>
          <div>
            <div className="font-serif font-bold text-white text-[15px] leading-tight">ArtisanNest</div>
            <div className="text-[9px] text-[#7D9B76] tracking-[0.2em] uppercase">Seller Portal</div>
          </div>
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden text-white/40 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const groupActive = isGroupActive(item)

          if (item.children) {
            const open = expanded[item.label] ?? false
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggle(item.label)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                    ${groupActive
                      ? 'text-[#7D9B76] bg-[#7D9B76]/10'
                      : 'text-[#C4AEA4] hover:text-white hover:bg-white/5'
                    }`}
                >
                  <Icon size={18} className="shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown
                    size={15}
                    className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                  />
                </button>
                <div
                  className="overflow-hidden transition-all duration-200"
                  style={{ maxHeight: open ? '200px' : '0px' }}
                >
                  <div className="ml-7 mt-0.5 space-y-0.5 border-l border-white/8 pl-3">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onClose}
                        className={`block px-3 py-2 rounded-lg text-sm transition-all duration-150
                          ${isActive(child.href)
                            ? 'text-[#7D9B76] bg-[#7D9B76]/8 font-medium'
                            : 'text-[#9E8079] hover:text-white hover:bg-white/5'
                          }`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )
          }

          return (
            <Link
              key={item.label}
              href={item.href!}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                ${isActive(item.href!)
                  ? 'text-[#7D9B76] bg-[#7D9B76]/10'
                  : 'text-[#C4AEA4] hover:text-white hover:bg-white/5'
                }`}
            >
              <Icon size={18} className="shrink-0" />
              <span>{item.label}</span>
              {isActive(item.href!) && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#7D9B76]" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/5 shrink-0">
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#C4AEA4] hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-150"
          >
            <LogOut size={18} className="shrink-0" />
            <span>Logout</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
