'use client'

import { useState } from 'react'
import SellerSidebar from './SellerSidebar'
import SellerHeader from './SellerHeader'

type Props = {
  children: React.ReactNode
  sellerName: string
  sellerEmail: string
}

export default function SellerShell({ children, sellerName, sellerEmail }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F2EF]">
      <SellerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden lg:ml-[260px]">
        <SellerHeader
          sellerName={sellerName}
          sellerEmail={sellerEmail}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
