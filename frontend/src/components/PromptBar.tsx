'use client'

import { useState, useRef, type RefObject } from 'react'
import { parseFile, isSupportedFile, type ParsedDocument } from '@/lib/parse-file'

function AttachIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13">
      <rect x="1" y="1" width="11" height="11" rx="3" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <line x1="6.5" y1="4" x2="6.5" y2="9" stroke="currentColor" strokeWidth="1.3" />
      <line x1="4" y1="6.5" x2="9" y2="6.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

function SendArrow({ color }: { color: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15">
      <path
        d="M2 7.5h10M8.5 3.5l4 4-4 4"
        stroke={color}
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function PromptBar({
  placeholder,
  onSubmit,
  disabled,
  initialValue = '',
  accentColor = '#ff8a3d',
  arrowColor = '#14213d',
  textareaRef,
}: {
  placeholder: string
  onSubmit: (value: string, doc: ParsedDocument | null) => void
  disabled?: boolean
  initialValue?: string
  accentColor?: string
  arrowColor?: string
  textareaRef?: RefObject<HTMLTextAreaElement | null>
}) {
  const [value, setValue] = useState(initialValue)
  const [doc, setDoc] = useState<ParsedDocument | null>(null)
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File | null) {
    setParseError(null)
    setDoc(null)
    if (!file) return
    if (!isSupportedFile(file)) {
      setParseError(`Unsupported file type: ${file.name}`)
      return
    }
    setParsing(true)
    try {
      setDoc(await parseFile(file))
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Could not read this file.')
    } finally {
      setParsing(false)
    }
  }

  function handleSubmit() {
    if (!value.trim() || disabled || parsing) return
    onSubmit(value.trim(), doc)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const attachHint = parsing
    ? 'Reading your paper…'
    : parseError
    ? parseError
    : doc
    ? `Using: ${doc.filename} · ${doc.words.toLocaleString()} words`
    : 'PDF, DOCX, or LaTeX — up to 30 MB'

  return (
    <div className="bg-ink rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2.5">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-[7px] bg-ink-light border border-dashed border-[#3a4a6b] hover:border-accent rounded-[9px] px-[13px] py-2 text-[#c8d0e0] hover:text-white text-[13px] font-medium transition-colors whitespace-nowrap"
        >
          <AttachIcon />
          Attach paper
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.md,.tex"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        <span
          className={`text-xs truncate ${parseError ? 'text-node-coral' : doc ? 'text-[#8fd4c9]' : 'text-muted-navy'}`}
        >
          {attachHint}
        </span>
      </div>

      <div className="bg-ink-light rounded-[11px] py-1 pr-1 pl-3.5 flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={2}
          className="flex-1 bg-transparent border-none outline-none resize-none text-white text-[14.5px] leading-normal py-2.5"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || parsing}
          aria-label="Send"
          className="w-[38px] h-[38px] shrink-0 m-1 rounded-[9px] flex items-center justify-center transition-opacity hover:opacity-90"
          style={{
            background: accentColor,
            opacity: value.trim() && !disabled && !parsing ? 1 : 0.45,
          }}
        >
          <SendArrow color={arrowColor} />
        </button>
      </div>

      <div className="text-[11.5px] text-muted-navy mt-2 pl-0.5">
        Enter to send · Shift+Enter for a new line
      </div>
    </div>
  )
}

export function PromptExampleChip({
  children,
  onClick,
  color = '#6c4de6',
}: {
  children: React.ReactNode
  onClick: () => void
  color?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 bg-white border border-border rounded-full px-4 py-[9px] text-[13px] font-medium text-ink transition-colors"
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = color)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '')}
    >
      <svg width="11" height="11" viewBox="0 0 12 12">
        <path d="M6 0l1.5 4.5L12 6 7.5 7.5 6 12 4.5 7.5 0 6l4.5-1.5z" fill={color} />
      </svg>
      {children}
    </button>
  )
}
