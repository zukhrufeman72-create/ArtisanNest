'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

export default function VisitorTracker() {
  const pathname = usePathname()
  const startRef = useRef<number>(Date.now())

  useEffect(() => {
    startRef.current = Date.now()

    const send = (duration?: number) => {
      void fetch('/api/visitor-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: pathname,
          referrer: document.referrer || undefined,
          duration,
        }),
      }).catch(() => null)
    }

    // Log entry immediately
    send()

    // Log duration on page leave
    const handleLeave = () => {
      const duration = Math.round((Date.now() - startRef.current) / 1000)
      send(duration)
    }

    window.addEventListener('beforeunload', handleLeave)
    return () => window.removeEventListener('beforeunload', handleLeave)
  }, [pathname])

  return null
}
