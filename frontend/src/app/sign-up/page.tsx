'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { LogoMark } from '@/components/Sidebar'
import { useAuth } from '@/lib/auth-context'

const inputClass =
  'w-full border border-border rounded-[9px] px-3.5 py-[11px] text-sm text-ink bg-background outline-none focus:border-accent focus:bg-white transition-colors'

export default function SignUpPage() {
  const router = useRouter()
  const { signUp, isGuest, loading: authLoading } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  // Already on a permanent account — nothing to sign up for.
  useEffect(() => {
    if (!authLoading && !isGuest) {
      router.push('/')
    }
  }, [authLoading, isGuest, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = await signUp(email, password, fullName.trim() || undefined)

    setLoading(false)
    if (result.error) {
      setError(
        /rate limit/i.test(result.error)
          ? 'Too many sign-up attempts right now — the demo mailer allows only a few confirmation emails per hour. Wait a bit and try again.'
          : result.error
      )
      return
    }
    if (result.needsConfirmation) {
      setNeedsConfirmation(true)
      return
    }
    router.push('/')
  }

  return (
    <AppShell crumb="Create account">
      <div className="min-h-full flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px] bg-white border border-border rounded-[18px] p-9 shadow-[0_8px_32px_rgba(20,33,61,0.06)]">
          <div className="flex justify-center mb-[18px]">
            <LogoMark size={44} />
          </div>

          {needsConfirmation ? (
            <>
              <h1 className="text-[21px] font-bold text-center tracking-[-0.3px] text-ink">
                Check your inbox
              </h1>
              <p className="text-[13px] text-muted text-center leading-relaxed mt-2 mb-6">
                We sent a confirmation link to <span className="font-semibold text-ink">{email}</span>.
                Confirm it, then log in to unlock all tools.
              </p>
              <Link
                href="/login"
                className="block bg-ink hover:bg-ink-light text-white text-sm font-semibold text-center rounded-[9px] py-3 transition-colors"
              >
                Go to log in
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-[21px] font-bold text-center tracking-[-0.3px] text-ink">
                Create your account
              </h1>
              <p className="text-[13px] text-muted text-center leading-relaxed mt-2 mb-6">
                Everything you tried as a guest — your mind maps and prompts — carries over
                automatically.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputClass}
                />
                <input
                  type="email"
                  required
                  placeholder="Academic email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
                <input
                  type="password"
                  required
                  minLength={12}
                  placeholder="Password (12+ characters)"
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
                  className="bg-accent hover:bg-accent-light disabled:opacity-50 text-ink text-sm font-semibold rounded-[9px] py-3 mt-1 transition-colors"
                >
                  {loading ? 'Creating account…' : 'Sign up — unlock all tools'}
                </button>
              </form>

              <p className="text-center text-[12.5px] text-muted mt-[18px]">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-ink hover:text-accent">
                  Log in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </AppShell>
  )
}
