'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { PromptExampleChip } from '@/components/PromptBar'
import { ToolIcon } from '@/components/ToolIcon'
import { useAuth } from '@/lib/auth-context'
import { toolById } from '@/lib/tools'

const tool = toolById('chat')

/**
 * Research Chat is waiting on its backend: the redeployed Supabase
 * project has no conversational edge function (verified 2026-07-15 —
 * `mind-map` only generates keywords; nothing relays free-form prompts).
 * The transcript UI from the previous iteration lives in git history and
 * can be restored the moment the backend ships a chat function.
 */
export default function ResearchChatPage() {
  const router = useRouter()
  const { isGuest, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && isGuest) {
      router.push('/sign-up')
    }
  }, [authLoading, isGuest, router])

  if (authLoading || isGuest) {
    return (
      <AppShell crumb={tool.name}>
        <div className="px-8 py-16 text-center text-sm text-muted">
          Checking your account&hellip;
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell crumb={tool.name}>
      <div className="max-w-[880px] mx-auto px-8 pt-9 pb-16">
        <div className="flex items-center gap-3.5 mb-2">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
            style={{ background: tool.tint }}
          >
            <ToolIcon id={tool.id} color={tool.color} />
          </div>
          <div>
            <div className="text-[22px] font-bold tracking-[-0.3px] text-ink">{tool.name}</div>
            <div className="text-[13px] text-muted">{tool.tagline}</div>
          </div>
        </div>

        <div className="bg-white border border-border rounded-2xl p-8 mt-6 text-center">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: tool.tint }}
          >
            <ToolIcon id={tool.id} color={tool.color} size={18} />
          </div>
          <div className="text-[15px] font-semibold text-ink mb-1.5">
            Waiting on the chat backend
          </div>
          <p className="text-[13px] text-muted leading-relaxed max-w-[440px] mx-auto">
            The demo backend doesn&rsquo;t include a conversational edge function yet — the
            deployed functions cover mind maps, paper insights, proofreading, and journal
            formatting. This tool switches on automatically once the chat function ships.
          </p>
        </div>

        <div className="text-center text-[11px] font-semibold tracking-[1.4px] text-muted-light mt-10 mb-4">
          QUESTIONS IT WILL ANSWER
        </div>
        <div className="flex flex-wrap gap-2.5 justify-center">
          {tool.chips.map((chip) => (
            <PromptExampleChip key={chip} color={tool.color} onClick={() => {}}>
              {chip}
            </PromptExampleChip>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
