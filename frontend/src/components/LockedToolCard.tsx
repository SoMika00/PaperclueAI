'use client'

import { useRouter } from 'next/navigation'
import { ToolIcon } from '@/components/ToolIcon'
import type { ToolDef } from '@/lib/tools'

export function LockedToolCard({ tool, guest }: { tool: ToolDef; guest: boolean }) {
  const router = useRouter()

  return (
    <div
      className="relative bg-white border border-border rounded-[14px] p-[22px] overflow-hidden cursor-pointer"
      onClick={() => router.push(guest ? '/sign-up' : tool.href)}
    >
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center mb-3.5"
        style={{ background: tool.tint }}
      >
        <ToolIcon id={tool.id} color={tool.color} />
      </div>
      <div className="text-[15px] font-semibold text-ink mb-1.5">{tool.name}</div>
      <div className="text-[13px] italic text-muted leading-normal">
        &ldquo;{tool.lockedQuote}&rdquo;
      </div>

      {guest && (
        <div className="absolute inset-0 backdrop-blur-[3px] bg-[rgba(250,250,250,0.55)] flex flex-col items-center justify-center gap-2">
          <span className="w-[34px] h-[34px] rounded-full bg-white shadow-[0_2px_8px_rgba(20,33,61,0.12)] flex items-center justify-center text-ink">
            <svg width="14" height="14" viewBox="0 0 12 12">
              <rect x="2" y="5.2" width="8" height="5.6" rx="1.4" fill="currentColor" />
              <path
                d="M4 5.2V3.6a2 2 0 0 1 4 0v1.6"
                stroke="currentColor"
                fill="none"
                strokeWidth="1.4"
              />
            </svg>
          </span>
          <span className="text-[13px] font-semibold text-ink">Sign up to prompt this</span>
        </div>
      )}
    </div>
  )
}
