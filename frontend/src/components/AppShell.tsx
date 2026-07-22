'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n'

function LanguageToggle() {
  const { locale, setLocale } = useI18n()
  return (
    <button
      onClick={() => setLocale(locale === 'en' ? 'ja' : 'en')}
      className="text-[12px] font-semibold text-muted hover:text-ink border border-border rounded-full px-2.5 py-1 whitespace-nowrap transition-colors"
      title={locale === 'en' ? '日本語に切り替え' : 'Switch to English'}
    >
      {locale === 'en' ? 'EN' : 'JA'}
    </button>
  )
}

function AccountMenu() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const fullName = (user?.user_metadata?.full_name as string | undefined)?.trim()
  const initial = (fullName || user?.email || 'R')[0].toUpperCase()

  async function handleSignOut() {
    setOpen(false)
    await signOut()
    router.push('/')
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        className="w-8 h-8 rounded-full bg-accent text-white text-[13px] font-semibold flex items-center justify-center hover:bg-accent-light transition-colors"
      >
        {initial}
      </button>
      {open && (
        <div className="absolute right-0 top-10 w-56 bg-white border border-border rounded-xl shadow-[0_8px_32px_rgba(20,33,61,0.1)] py-1.5 z-20">
          <div className="px-3.5 py-2 border-b border-border">
            {fullName && (
              <div className="text-[13px] font-semibold text-ink truncate">{fullName}</div>
            )}
            <div className="text-xs text-muted truncate">{user?.email}</div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full text-left px-3.5 py-2 text-[13px] font-medium text-ink hover:bg-[#f4f4f6] transition-colors"
          >
            {t('signout')}
          </button>
        </div>
      )}
    </div>
  )
}

export function AppShell({
  children,
  crumb,
}: {
  children: React.ReactNode
  crumb?: string
}) {
  const { isGuest, loading } = useAuth()
  const { t } = useI18n()
  const guest = loading || isGuest

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="h-14 shrink-0 bg-white border-b border-border flex items-center px-7 gap-4">
          <span className="text-[13px] text-muted flex-1 truncate">
            {crumb ?? (guest ? t('crumb_guest') : 'Mind Map')}
          </span>
          <LanguageToggle />
          {guest ? (
            <>
              <Link
                href="/login"
                className="text-[13px] font-medium text-ink hover:text-accent whitespace-nowrap transition-colors"
              >
                {t('topbar_login')}
              </Link>
              <Link
                href="/sign-up"
                className="text-[13px] font-semibold text-white bg-accent hover:bg-accent-light rounded-lg px-4 py-2 whitespace-nowrap transition-colors"
              >
                {t('topbar_signup')}
              </Link>
            </>
          ) : (
            <>
              <span className="text-xs text-muted whitespace-nowrap">{t('topbar_unlocked')}</span>
              <AccountMenu />
            </>
          )}
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">{children}</div>
      </div>
    </div>
  )
}
