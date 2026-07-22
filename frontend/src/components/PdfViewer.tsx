'use client'

/**
 * The living PDF: react-pdf with quote-anchored highlights (feature → PDF)
 * and selection → Explain / Find sources (PDF → feature). Ported from the
 * research backend's frontend, restyled to our tokens.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import { BASE, api, authHeaders } from '@/lib/api'
import { useWorkspace } from '@/lib/workspace'

// Served from public/ (copied by the copy-worker script) — the version
// matches react-pdf's nested pdfjs-dist, not our top-level parser copy.
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function PdfViewer() {
  const { ms, highlight, refreshEvidence } = useWorkspace()
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [numPages, setNumPages] = useState(0)
  const [width, setWidth] = useState(620)
  const [selMenu, setSelMenu] = useState<{ x: number; y: number; text: string; page: number } | null>(null)
  const [explain, setExplain] = useState<{ loading: boolean; text: string } | null>(null)

  const fileUrl = useMemo(() => (ms ? `${BASE}/manuscripts/${ms.id}/pdf` : ''), [ms])
  const [file, setFile] = useState<{ url: string; httpHeaders?: Record<string, string> } | null>(null)

  useEffect(() => {
    if (!fileUrl) return
    let cancelled = false
    authHeaders().then((headers) => {
      if (!cancelled) setFile({ url: fileUrl, httpHeaders: headers })
    })
    return () => {
      cancelled = true
    }
  }, [fileUrl])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() =>
      setWidth(Math.min(Math.max(el.clientWidth - 40, 360), 860))
    )
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Feature → PDF: scroll to the highlighted page and flash it.
  useEffect(() => {
    if (!highlight) return
    const t = setTimeout(() => {
      const el = document.getElementById(`pdf-page-${highlight.page}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        el.classList.remove('hl-flash')
        void el.offsetWidth
        el.classList.add('hl-flash')
      }
    }, 60)
    return () => clearTimeout(t)
  }, [highlight])

  // Quote-anchored highlighting on the text layer.
  const textRenderer = useCallback(
    (pageNumber: number) =>
      ({ str }: { str: string }) => {
        const safe = escapeHtml(str)
        if (!highlight || highlight.page !== pageNumber || !str.trim()) return safe
        const q = norm(highlight.quote)
        const s = norm(str)
        if (!q || s.length < 4) return safe
        const cls = `hl-${highlight.kind}`
        if (s.length > 10 && q.includes(s)) return `<mark class="${cls}">${safe}</mark>`
        const idx = s.indexOf(q)
        if (idx >= 0) {
          const rawIdx = str.toLowerCase().indexOf(highlight.quote.trim().slice(0, 20).toLowerCase())
          if (rawIdx >= 0) {
            const end = Math.min(rawIdx + highlight.quote.length, str.length)
            return (
              escapeHtml(str.slice(0, rawIdx)) +
              `<mark class="${cls}">${escapeHtml(str.slice(rawIdx, end))}</mark>` +
              escapeHtml(str.slice(end))
            )
          }
          return `<mark class="${cls}">${safe}</mark>`
        }
        return safe
      },
    [highlight]
  )

  // PDF → feature: text selection opens contextual actions.
  const onMouseUp = useCallback(() => {
    const sel = window.getSelection()
    const text = sel?.toString().trim() || ''
    if (!sel || text.length < 15 || text.length > 1500) {
      setSelMenu(null)
      return
    }
    const range = sel.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    const cont = containerRef.current?.getBoundingClientRect()
    if (!cont) return
    let page = 1
    let node: Node | null = range.startContainer
    while (node) {
      if (node instanceof HTMLElement && node.dataset?.pdfPage) {
        page = parseInt(node.dataset.pdfPage, 10)
        break
      }
      node = node.parentNode
    }
    setSelMenu({
      x: rect.left - cont.left + rect.width / 2,
      y: rect.top - cont.top + (containerRef.current?.scrollTop ?? 0) - 10,
      text,
      page,
    })
  }, [])

  const runExplain = useCallback(async () => {
    if (!selMenu || !ms) return
    const { text, page } = selMenu
    setSelMenu(null)
    setExplain({ loading: true, text: '' })
    try {
      const res = await api<{ explanation: string }>(`/insight/${ms.id}/explain`, {
        method: 'POST',
        body: JSON.stringify({ text, page }),
      })
      setExplain({ loading: false, text: res.explanation })
      void refreshEvidence()
    } catch (e) {
      setExplain({
        loading: false,
        text: `Explain failed: ${e instanceof Error ? e.message.slice(0, 140) : 'unknown error'}`,
      })
    }
  }, [selMenu, ms, refreshEvidence])

  if (!ms) return null

  return (
    <div
      ref={containerRef}
      className="relative h-full overflow-y-auto bg-[#eef0f4] rounded-xl border border-border"
      onMouseUp={onMouseUp}
    >
      {file === null ? (
        <div className="p-8 text-[13px] text-muted">Loading PDF&hellip;</div>
      ) : (
        <Document
          file={file}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={<div className="p-8 text-[13px] text-muted">Rendering PDF&hellip;</div>}
          error={
            <div className="p-8 text-[13px] text-node-coral">
              Could not load the PDF from the backend.
            </div>
          }
        >
          <div className="flex flex-col items-center gap-4 py-5">
            {Array.from({ length: numPages }, (_, i) => i + 1).map((n) => (
              <div
                key={n}
                id={`pdf-page-${n}`}
                data-pdf-page={n}
                className="shadow-[0_2px_12px_rgba(20,33,61,0.1)] rounded-[3px] bg-white"
              >
                <Page
                  pageNumber={n}
                  width={width}
                  // react-pdf's CustomTextRenderer type expects more props than we use
                  customTextRenderer={textRenderer(n) as never}
                  renderAnnotationLayer={false}
                  loading={<div style={{ width, height: width * 1.35 }} className="bg-white" />}
                />
              </div>
            ))}
          </div>
        </Document>
      )}

      {selMenu && (
        <div
          className="absolute z-20 -translate-x-1/2 -translate-y-full flex rounded-[9px] shadow-[0_8px_24px_rgba(20,33,61,0.25)] overflow-hidden"
          style={{ left: selMenu.x, top: selMenu.y }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <button
            className="bg-accent hover:bg-accent-light text-ink px-3.5 py-2 text-[12.5px] font-semibold transition-colors"
            onClick={runExplain}
          >
            Explain
          </button>
          <button
            className="bg-ink hover:bg-ink-light text-white px-3.5 py-2 text-[12.5px] font-semibold transition-colors"
            onClick={() => {
              const q = selMenu.text.slice(0, 220)
              setSelMenu(null)
              router.push(`/manuscripts/${ms.id}/related-research?q=${encodeURIComponent(q)}`)
            }}
          >
            Find sources
          </button>
        </div>
      )}

      {explain && (
        <div className="fixed bottom-6 right-6 z-30 w-[380px] bg-white border border-accent/50 rounded-2xl p-4 shadow-[0_16px_48px_rgba(20,33,61,0.2)]">
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-[13px] font-semibold text-ink">Explanation</span>
            <button
              onClick={() => setExplain(null)}
              className="text-muted hover:text-ink text-[15px] leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          {explain.loading ? (
            <div className="text-[13px] text-muted">Reading the surrounding context&hellip;</div>
          ) : (
            <p className="text-[13px] text-[#3c465c] leading-relaxed max-h-56 overflow-y-auto">
              {explain.text}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
