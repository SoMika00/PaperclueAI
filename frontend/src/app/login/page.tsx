'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { LogoMark } from '@/components/Sidebar'
import { useAuth } from '@/lib/auth-context'

const inputClass =
  'w-full border border-border rounded-[9px] px-3.5 py-[11px] text-sm text-ink bg-background outline-none focus:border-accent focus:bg-white transition-colors'

export default function LoginPage() {
  const router = useRouter()
  const { signIn, isGuest, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Already logged in to a permanent account — go home.
  useEffect(() => {
    if (!authLoading && !isGuest) {
      router.push('/')
    }
  }, [authLoading, isGuest, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await signIn(email, password)

    setLoading(false)
    if (error) {
      setError(error)
      return
    }
    router.push('/')
  }

  return (
    <AppShell crumb="Log in">
      <div className="min-h-full flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px] bg-white border border-border rounded-[18px] p-9 shadow-[0_8px_32px_rgba(20,33,61,0.06)]">
          <div className="flex justify-center mb-[18px]">
            <LogoMark size={44} />
          </div>
          <h1 className="text-[21px] font-bold text-center tracking-[-0.3px] text-ink">
            Welcome back
          </h1>
          <p className="text-[13px] text-muted text-center leading-relaxed mt-2 mb-6">
            Log in to pick up where you left off.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />

            {error && (
              <div className="text-[12.5px] text-node-coral bg-node-coral-bg rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-ink hover:bg-ink-light disabled:opacity-50 text-white text-sm font-semibold rounded-[9px] py-3 mt-1 transition-colors"
            >
              {loading ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          <p className="text-center text-[12.5px] text-muted mt-[18px]">
            New here?{' '}
            <Link href="/sign-up" className="font-semibold text-ink hover:text-accent">
              Create a free account
            </Link>
          </p>
        </div>
      </div>
    </AppShell>
  )
}
