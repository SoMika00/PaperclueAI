/**
 * Sidebar navigation for the merged product: Michail's manuscript-centric
 * information architecture in our design language. QUICK TOOLS are the
 * transitional Supabase edge-function tools — each retires when its
 * workspace replacement ships (see INTEGRATION_PLAN.md).
 */

export type NavItem = {
  href: string
  label: string
  dot: string
  free: boolean
}

export const WORKSPACE_NAV: NavItem[] = [
  { href: '/', label: 'Home', dot: '#ff8a3d', free: true },
  { href: '/discover', label: 'Discover', dot: '#3d7dff', free: false },
  { href: '/mind-maps', label: 'Mind Maps', dot: '#6c4de6', free: false },
  { href: '/library', label: 'Library', dot: '#0f9b8e', free: false },
  { href: '/university', label: 'University', dot: '#e0951a', free: false },
]

export const QUICK_TOOLS_NAV: NavItem[] = [
  { href: '/paper-insights', label: 'Paper Insights', dot: '#ff5a7a', free: false },
  { href: '/proofreader', label: 'Proofreader', dot: '#e0951a', free: false },
  { href: '/journal-formatting', label: 'Journal Match', dot: '#0f9b8e', free: false },
  { href: '/manuscript-review', label: 'Manuscript Review', dot: '#ff8a3d', free: false },
]
