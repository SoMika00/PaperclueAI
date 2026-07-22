'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

type AuthContextValue = {
  user: User | null
  /** True while there is no permanent account: no session at all, or an anonymous one. */
  isGuest: boolean
  loading: boolean
  signUp: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<{ error: string | null; needsConfirmation: boolean }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        setUser(session.user)
        setLoading(false)
        return
      }

      // No session yet: try to sign in anonymously so guests get a working
      // JWT for the free Mind Map tool (rate limiting is per-user server-side).
      // If anonymous sign-ins are disabled on the project this fails silently
      // and the user simply stays a guest without a session.
      const { data, error } = await supabase.auth.signInAnonymously()
      if (!error && data.user) {
        setUser(data.user)
      }
      setLoading(false)
    }

    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // No user at all (e.g. anonymous sign-ins disabled) is still a guest —
  // only a permanent, non-anonymous account unlocks the gated tools.
  const isGuest = !user || Boolean(user.is_anonymous)

  async function signUp(email: string, password: string, fullName?: string) {
    const metadata = fullName ? { data: { full_name: fullName } } : undefined

    if (user?.is_anonymous) {
      // Upgrade the existing anonymous user to a permanent account.
      // Same user_id is preserved, so guest activity carries over.
      const { error } = await supabase.auth.updateUser({
        email,
        password,
        ...(metadata ?? {}),
      })
      if (error) return { error: error.message, needsConfirmation: false }
      return { error: null, needsConfirmation: false }
    }

    // No anonymous session (or none at all): plain email/password sign-up
    // per the backend integration guide.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: metadata,
    })
    if (error) return { error: error.message, needsConfirmation: false }
    // With Auto Confirm enabled a session comes back immediately; without
    // it the user must confirm via email before logging in.
    return { error: null, needsConfirmation: !data.session }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return { error: null }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isGuest, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
