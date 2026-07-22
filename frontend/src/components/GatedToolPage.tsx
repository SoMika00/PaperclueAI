'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { Markdown } from '@/components/Markdown'
import { PromptBar, PromptExampleChip } from '@/components/PromptBar'
import { ToolIcon } from '@/components/ToolIcon'
import { useAuth } from '@/lib/auth-context'
import { callEdgeFunction, type EdgeFunctionName } from '@/lib/edge-functions'
import type { ParsedDocument } from '@/lib/parse-file'
import { toolById } from '@/lib/tools'

export function GatedToolPage({
  toolId,
  edgeFunction,
  buildBody,
  renderResult,
  requiresDocument = false,
}: {
  toolId: string
  edgeFunction: EdgeFunctionName
  buildBody: (prompt: string, doc: ParsedDocument | null) => Record<string, unknown>
  /** Renders the structured response. Return null to fall back to raw JSON. */
  renderResult: (data: Record<string, unknown>) => ReactNode
  requiresDocument?: boolean
}) {
  const tool = toolById(toolId)
  const router = useRouter()
  const { isGuest, loading: authLoading } = useAuth()
  const taRef = useRef<HTMLTextAreaElement>(null)
  const [prefill, setPrefill] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ prompt: string; data: Record<string, unknown> } | null>(
    null
  )

  useEffect(() => {
    if (!authLoading && isGuest) {
      router.push('/sign-up')
    }
  }, [authLoading, isGuest, router])

  async function handleSubmit(prompt: string, doc: ParsedDocument | null) {
    setError(null)

    if (requiresDocument && !doc) {
      setError('Attach your paper first — this tool analyzes the document itself.')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const data = await callEdgeFunction<Record<string, unknown>>(
        edgeFunction,
        buildBody(prompt, doc)
      )
      setResult({ prompt, data })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      if (message === 'RATE_LIMITED') {
        setError("You're sending requests too fast. Wait a moment and try again.")
      } else if (message.startsWith('EDGE_FUNCTION_ERROR')) {
        setError(`Could not complete this request. Backend said: ${message}`)
      } else {
        setError('Could not complete this request. Try again in a moment.')
      }
    } finally {
      setLoading(false)
    }
  }

  function fillChip(text: string) {
    setPrefill(text)
    requestAnimationFrame(() => taRef.current?.focus())
  }

  if (authLoading || isGuest) {
    return (
      <AppShell crumb={tool.name}>
        <div className="px-8 py-16 text-center text-sm text-muted">
          Checking your account&hellip;
        </div>
      </AppShell>
    )
  }

  function renderBody(data: Record<string, unknown>): ReactNode {
    // Server-side JSON parse failed — show the model's raw text as markdown.
    if (typeof data.raw_response === 'string') {
      return <Markdown>{data.raw_response}</Markdown>
    }
    return (
      renderResult(data) ?? (
        <pre className="text-xs text-[#3c465c] whitespace-pre-wrap">
          {JSON.stringify(data, null, 2)}
        </pre>
      )
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

        <div className="mt-5">
          <PromptBar
            key={prefill}
            initialValue={prefill}
            placeholder={tool.placeholder}
            onSubmit={handleSubmit}
            disabled={loading}
            accentColor={tool.color}
            arrowColor="#ffffff"
            textareaRef={taRef}
          />
        </div>

        <div className="flex flex-wrap gap-2.5 justify-center mt-[18px]">
          {tool.chips.map((chip) => (
            <PromptExampleChip key={chip} color={tool.color} onClick={() => fillChip(chip)}>
              {chip}
            </PromptExampleChip>
          ))}
        </div>

        {error && (
          <div className="text-sm text-node-coral bg-node-coral-bg border border-node-coral/20 rounded-xl px-4 py-3 mt-7">
            {error}
          </div>
        )}

        {!error && !loading && !result && (
          <div className="text-center text-[13px] text-muted-light mt-9">{tool.emptyLine}</div>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-3 mt-10">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center animate-pc-pulse"
              style={{ background: tool.tint }}
            >
              <ToolIcon id={tool.id} color={tool.color} size={18} />
            </div>
            <div className="text-[13px] text-muted">Working on it&hellip;</div>
          </div>
        )}

        {result && !loading && (
          <div className="bg-white border border-border rounded-2xl mt-7 overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: tool.color }}
              />
              <span className="text-sm font-semibold text-ink truncate">
                &ldquo;{result.prompt}&rdquo;
              </span>
            </div>
            <div className="px-5 py-3">{renderBody(result.data)}</div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
