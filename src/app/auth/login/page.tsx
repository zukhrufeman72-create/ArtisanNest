'use client'

import { useRouter } from 'next/navigation'
import AuthModal from '@/components/AuthModal'

export default function LoginPage() {
  const router = useRouter()
  return (
    <AuthModal
      open
      defaultTab="login"
      onClose={() => router.push('/')}
    />
  )
}
