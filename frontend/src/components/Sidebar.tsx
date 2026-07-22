'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useI18n, type TKey } from '@/lib/i18n'
import { WORKSPACE_NAV, QUICK_TOOLS_NAV, type NavItem } from '@/lib/nav'

const NAV_LABEL_KEYS: Record<string, TKey> = {
  '/': 'nav_home',
  '/discover': 'nav_discover',
  '/mind-maps': 'nav_mindmaps',
  '/library': 'nav_library',
  '/university': 'nav_university',
}

export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <div
      className="rounded-lg bg-ink flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        width={Math.round(size * 0.53)}
        height={Math.round(size * 0.53)}
        viewBox="0 0 16 16"
      >
        <line x1="8" y1="6" x2="3.5" y2="12" stroke="#5b6b8c" strokeWidth="1.4" />
        <line x1="8" y1="6" x2="12.5" y2="12" stroke="#5b6b8c" strokeWidth="1.4" />
        <circle cx="8" cy="5" r="3" fill="#ff8a3d" />
        <circle cx="3.5" cy="12" r="2" fill="#ffffff" />
        <circle cx="12.5" cy="12" r="2" fill="#ffffff" />
      </svg>
    </div>
  )
}

function PadlockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" className="text-muted-light">
      <rect x="2" y="5.2" width="8" height="5.6" rx="1.4" fill="currentColor" />
      <path
        d="M4 5.2V3.6a2 2 0 0 1 4 0v1.6"
        stroke="currentColor"
        fill="none"
        strokeWidth="1.4"
      />
    </svg>
  )
}

function NavLink({
  item,
  active,
  locked,
}: {
  item: NavItem
  active: boolean
  locked: boolean
}) {
  const { t } = useI18n()
  const labelKey = NAV_LABEL_KEYS[item.href]
  return (
    <Link
      href={locked ? '/sign-up' : item.href}
      className={`relative flex items-center gap-2.5 px-4 py-2.5 hover:bg-[#f4f4f6] ${
        active ? 'bg-[#f7f7f9]' : ''
      }`}
    >
      <span
        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-[2px] bg-accent"
        style={{ opacity: active ? 1 : 0 }}
      />
      <span
        className="w-[9px] h-[9px] rounded-full shrink-0"
        style={{ background: item.dot, opacity: locked ? 0.35 : 1 }}
      />
      <span
        className={`text-[13.5px] font-medium flex-1 ${
          locked ? 'text-muted-light' : 'text-ink'
        }`}
      >
        {labelKey ? t(labelKey) : item.label}
      </span>
      {item.free && (
        <span className="text-[10px] font-semibold text-node-teal bg-node-teal-bg rounded-full px-2 py-0.5">
          free
        </span>
      )}
      {locked && <PadlockIcon />}
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { isGuest, loading } = useAuth()
  const { t } = useI18n()
  const guest = loading || isGuest

  function isActive(href: string) {
    if (href === '/') return pathname === '/' || pathname === '/mind-map'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside className="w-[216px] min-w-[216px] bg-white border-r border-border flex flex-col">
      <Link href="/" className="flex items-center gap-2.5 px-4 pt-[18px] pb-4">
        <LogoMark />
        <span className="text-base font-bold tracking-[-0.2px] text-ink">PaperClue</span>
      </Link>

      <div className="text-[10.5px] font-semibold tracking-[1.2px] text-muted-light px-4 pt-3.5 pb-2">
        {t('nav_workspace')}
      </div>
      <nav>
        {WORKSPACE_NAV.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isActive(item.href)}
            locked={!item.free && guest}
          />
        ))}
      </nav>

      <div className="text-[10.5px] font-semibold tracking-[1.2px] text-muted-light px-4 pt-5 pb-2">
        {t('nav_quick_tools')}
      </div>
      <nav>
        {QUICK_TOOLS_NAV.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isActive(item.href)}
            locked={!item.free && guest}
          />
        ))}
      </nav>

      <div className="flex-1" />

      {guest && !loading && (
        <div className="m-4 p-3.5 border border-border rounded-xl bg-background">
          <div className="text-[12.5px] font-semibold text-ink mb-1">{t('trying_title')}</div>
          <div className="text-xs text-muted leading-[1.45] mb-2.5">{t('trying_body')}</div>
          <button
            onClick={() => router.push('/sign-up')}
            className="inline-flex text-[12.5px] font-semibold text-white bg-ink hover:bg-ink-light rounded-lg px-3 py-[7px] whitespace-nowrap transition-colors"
          >
            {t('trying_cta')}
          </button>
        </div>
      )}
    </aside>
  )
}
