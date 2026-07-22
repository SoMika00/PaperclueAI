'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

/** Redirects guests to sign-up; returns true while unusable (loading/guest). */
export function useRequireAccount(): boolean {
  const router = useRouter()
  const { isGuest, loading } = useAuth()

  useEffect(() => {
    if (!loading && isGuest) {
      router.push('/sign-up')
    }
  }, [loading, isGuest, router])

  return loading || isGuest
}
