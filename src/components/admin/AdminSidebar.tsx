'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Package, ShoppingBag,
  BarChart3, MessageSquare, Settings, LogOut,
  ChevronDown, X, Store, Receipt, Truck,
  RefreshCw, Tag, Shield, UserCheck, ClipboardList, ScrollText, Activity,
} from 'lucide-react'
import { logout } from '@/app/actions/auth'
import BrandLogo from '@/components/BrandLogo'

type NavChild = { label: string; href: string }
type NavItem = {
  label: string
  icon: React.ElementType
  href?: string
  children?: NavChild[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
  {
    label: 'Users', icon: Users,
    children: [
      { label: 'All Users', href: '/admin/users' },
      { label: 'Sellers', href: '/admin/users/sellers' },
      { label: 'Customers', href: '/admin/users/customers' },
    ],
  },
  {
    label: 'Products', icon: Package,
    children: [
      { label: 'All Products', href: '/admin/products' },
      { label: 'Approvals', href: '/admin/products/approvals' },
      { label: 'Categories', href: '/admin/products/categories' },
    ],
  },
  { label: 'Orders', icon: ShoppingBag, href: '/admin/orders' },
  { label: 'Shops', icon: Store, href: '/admin/shops' },
  { label: 'Transactions', icon: Receipt, href: '/admin/transactions' },
  { label: 'Delivery Tracking', icon: Truck, href: '/admin/delivery-tracking' },
  { label: 'Refunds', icon: RefreshCw, href: '/admin/refunds' },
  { label: 'Deals & Sales', icon: Tag, href: '/admin/deals' },
  { label: 'Custom Orders', icon: ClipboardList, href: '/admin/custom-orders' },
  { label: 'Seller Approval', icon: UserCheck, href: '/admin/sellers' },
  { label: 'Sub-Admins', icon: Shield, href: '/admin/sub-admins' },
  { label: 'Audit Logs', icon: ScrollText, href: '/admin/audit-logs' },
  { label: 'Analytics', icon: Activity, href: '/admin/analytics' },
  { label: 'Reports', icon: BarChart3, href: '/admin/reports' },
  { label: 'Complaints', icon: MessageSquare, href: '/admin/complaints' },
  { label: 'Settings', icon: Settings, href: '/admin/settings' },
]

type Props = { isOpen: boolean; onClose: () => void }

export default function AdminSidebar({ isOpen, onClose }: Props) {
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
      className={`fixed inset-y-0 left-0 w-65 bg-[#1C1511] z-30 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-5 border-b border-white/5 shrink-0">
        <Link href="/admin/dashboard">
          <BrandLogo compact dark subtitle="Admin Panel" imageClassName="size-9" />
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
                      ? 'text-[#C8896A] bg-[#C8896A]/10'
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

                {/* Submenu */}
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
                            ? 'text-[#C8896A] bg-[#C8896A]/8 font-medium'
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
                  ? 'text-[#C8896A] bg-[#C8896A]/10'
                  : 'text-[#C4AEA4] hover:text-white hover:bg-white/5'
                }`}
            >
              <Icon size={18} className="shrink-0" />
              <span>{item.label}</span>
              {isActive(item.href!) && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#C8896A]" />
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
