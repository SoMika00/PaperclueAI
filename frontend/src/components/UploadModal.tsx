'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, upload } from '@/lib/api'
import type { Manuscript } from '@/lib/backend-types'

/**
 * Upload → visible ingestion pipeline, in our design. The backend returns
 * the manuscript immediately; we poll it and show each step turning green.
 * The workspace opens as soon as parsing/references/metadata are done —
 * semantic indexing continues in the background.
 */

const STEPS: { key: string; label: string; sub: string }[] = [
  { key: 'parsing', label: 'Extracting text', sub: 'Reading pages, detecting Abstract, Methods, Results…' },
  { key: 'references', label: 'Extracting references', sub: 'Reading the bibliography into resolvable citations' },
  { key: 'metadata', label: 'Understanding the paper', sub: 'Title, authors, field of study, language' },
  { key: 'indexing', label: 'Indexing for semantic search', sub: 'Continues in the background — the workspace opens first' },
]

function StepDot({ state, failed }: { state: string; failed: boolean }) {
  if (state === 'done') {
    return (
      <span className="w-5 h-5 rounded-full bg-node-teal-bg flex items-center justify-center shrink-0">
        <svg width="11" height="11" viewBox="0 0 12 12">
          <path d="M2 6.5l2.5 2.5L10 3.5" stroke="#0f9b8e" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    )
  }
  if (state === 'running') {
    return <span className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin shrink-0" />
  }
  if (failed) {
    return (
      <span className="w-5 h-5 rounded-full bg-node-coral-bg flex items-center justify-center shrink-0">
        <svg width="9" height="9" viewBox="0 0 10 10">
          <path d="M2 2l6 6M8 2l-6 6" stroke="#ff5a7a" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>
    )
  }
  return <span className="w-5 h-5 rounded-full border-2 border-border shrink-0" />
}

export function UploadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ms, setMs] = useState<Manuscript | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = null
  }, [])

  useEffect(() => () => stopPolling(), [stopPolling])

  async function handleFile(file: File | null) {
    if (!file) return
    setError(null)
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('The research workspace ingests PDF manuscripts.')
      return
    }

    try {
      const created = await upload(file)
      setMs(created)
      pollRef.current = setInterval(async () => {
        try {
          const fresh = await api<Manuscript>(`/manuscripts/${created.id}`)
          setMs(fresh)
          const core = ['parsing', 'references', 'metadata']
          const coreDone = core.every((s) => fresh.ingest_steps?.[s] === 'done')
          if (fresh.status === 'error') {
            stopPolling()
            setError('Ingestion failed — the PDF may be scanned or corrupted.')
          } else if (fresh.status === 'ready' || coreDone) {
            stopPolling()
            router.push(`/manuscripts/${fresh.id}`)
          }
        } catch {
          /* keep polling through transient errors */
        }
      }, 1500)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      setError(
        /502|504|Failed to fetch/.test(msg)
          ? 'The research backend is unreachable right now — try again in a few minutes.'
          : `Upload failed. ${msg.slice(0, 200)}`
      )
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-30 bg-[rgba(20,33,61,0.45)] backdrop-blur-[2px] flex items-center justify-center px-6"
      onClick={() => {
        if (!ms) onClose()
      }}
    >
      <div
        className="w-full max-w-[480px] bg-white rounded-[18px] p-7 shadow-[0_16px_48px_rgba(20,33,61,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        {!ms ? (
          <>
            <div className="text-[17px] font-bold text-ink mb-1">Upload a manuscript</div>
            <p className="text-[13px] text-muted mb-5">
              PaperClue parses it, extracts references, and opens your workspace — usually
              under a minute.
            </p>
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragging(false)
                handleFile(e.dataTransfer.files?.[0] ?? null)
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl px-6 py-10 text-center cursor-pointer transition-colors ${
                dragging ? 'border-accent bg-[#fff7f0]' : 'border-border hover:border-accent'
              }`}
            >
              <div className="text-[14px] font-semibold text-ink mb-1">
                Drop your PDF here
              </div>
              <div className="text-[12.5px] text-muted">or click to browse — PDF only</div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </div>
            {error && (
              <div className="text-[12.5px] text-node-coral bg-node-coral-bg rounded-lg px-3 py-2 mt-4">
                {error}
              </div>
            )}
            <button
              onClick={onClose}
              className="mt-5 text-[13px] font-medium text-muted hover:text-ink transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <div className="text-[17px] font-bold text-ink mb-1">Ingesting your manuscript</div>
            <p className="text-[13px] text-muted mb-6 truncate">{ms.title}</p>
            <ol className="flex flex-col gap-4">
              {STEPS.map((s) => {
                const state = ms.ingest_steps?.[s.key] ?? 'pending'
                return (
                  <li key={s.key} className="flex gap-3">
                    <StepDot state={state} failed={ms.status === 'error'} />
                    <div className="min-w-0">
                      <div
                        className={`text-[13.5px] font-medium ${
                          state === 'pending' ? 'text-muted-light' : 'text-ink'
                        }`}
                      >
                        {s.label}
                      </div>
                      <div className="text-[12px] text-muted">{s.sub}</div>
                    </div>
                  </li>
                )
              })}
            </ol>
            {error && (
              <div className="text-[12.5px] text-node-coral bg-node-coral-bg rounded-lg px-3 py-2 mt-5">
                {error}
                <button onClick={onClose} className="ml-2 font-semibold underline">
                  Close
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
