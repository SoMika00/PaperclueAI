'use client'

/**
 * Light EN/JA i18n for the app chrome (sidebar, top bar, home, workspace
 * tabs, common actions) — the product's initial market is Japanese
 * universities. Feature-panel strings stay English for now; AI answers
 * already follow the user's language. Japanese strings seeded from the
 * research frontend's dictionary.
 */
import { createContext, useCallback, useContext, useEffect, useState } from 'react'

export type Locale = 'en' | 'ja'

const dict = {
  en: {
    nav_workspace: 'WORKSPACE',
    nav_quick_tools: 'QUICK TOOLS',
    nav_home: 'Home',
    nav_discover: 'Discover',
    nav_mindmaps: 'Mind Maps',
    nav_library: 'Library',
    nav_university: 'University',
    trying_title: 'Trying it out?',
    trying_body: 'Mind Map is free forever. Sign up to unlock the full research workspace.',
    trying_cta: 'Create free account',
    topbar_login: 'Log in',
    topbar_signup: 'Sign up',
    topbar_unlocked: 'All tools unlocked',
    signout: 'Sign out',
    crumb_guest: 'Mind Map — free, no signup needed',
    hero_badge_guest: 'Free to try — no account needed',
    hero_badge_user: 'All tools unlocked',
    hero_sub: 'Upload a paper and watch it unfold into ideas, citations, and gaps you can act on.',
    hero_cta: 'Start a mind map',
    upload_cta: 'Upload manuscript',
    tab_overview: 'Overview',
    tab_insight: 'Insight',
    tab_related: 'Related research',
    tab_mindmap: 'Mind map',
    tab_review: 'Review',
    tab_journal: 'Journal',
    tab_versions: 'Versions',
    evidence: 'Evidence',
    readiness: 'READINESS',
  },
  ja: {
    nav_workspace: 'ワークスペース',
    nav_quick_tools: 'クイックツール',
    nav_home: 'ホーム',
    nav_discover: '文献探索',
    nav_mindmaps: 'マインドマップ',
    nav_library: 'ライブラリ',
    nav_university: '大学リポジトリ',
    trying_title: 'お試し中ですか？',
    trying_body: 'マインドマップは永久無料。登録すると研究ワークスペース全体が使えます。',
    trying_cta: '無料アカウント作成',
    topbar_login: 'ログイン',
    topbar_signup: '新規登録',
    topbar_unlocked: '全ツール利用可能',
    signout: 'ログアウト',
    crumb_guest: 'マインドマップ — 登録不要・無料',
    hero_badge_guest: '登録不要で無料トライアル',
    hero_badge_user: '全ツール利用可能',
    hero_sub: '論文をアップロードすると、アイデア・引用・研究ギャップのネットワークが広がります。',
    hero_cta: 'マインドマップを作成',
    upload_cta: '原稿をアップロード',
    tab_overview: '概要',
    tab_insight: 'インサイト',
    tab_related: '関連研究',
    tab_mindmap: 'マインドマップ',
    tab_review: 'レビュー',
    tab_journal: 'ジャーナル',
    tab_versions: 'バージョン',
    evidence: 'エビデンス',
    readiness: '完成度',
  },
} as const

export type TKey = keyof (typeof dict)['en']

type I18nState = {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: TKey) => string
}

const I18nContext = createContext<I18nState | undefined>(undefined)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    // Async on purpose: the server always renders EN, so flipping the
    // locale after hydration avoids a mismatch (and satisfies the
    // set-state-in-effect rule).
    Promise.resolve().then(() => {
      const stored = localStorage.getItem('paperclue_locale')
      if (stored === 'ja' || stored === 'en') setLocaleState(stored)
    })
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    localStorage.setItem('paperclue_locale', l)
  }, [])

  const t = useCallback((key: TKey) => dict[locale][key] ?? dict.en[key], [locale])

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}
