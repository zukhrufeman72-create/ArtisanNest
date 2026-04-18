'use client'

import { useRouter } from 'next/navigation'
import AuthModal from '@/components/AuthModal'

export default function RegisterPage() {
  const router = useRouter()
  return (
    <AuthModal
      open
      defaultTab="register"
      onClose={() => router.push('/')}
    />
  )
}
