'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Sanitized markdown for AI responses (react-markdown renders no raw
 * HTML by default, per the security doc). Typography matches the design's
 * result-card body text.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="text-[13.5px] text-[#3c465c] leading-relaxed [&_h1]:text-[17px] [&_h1]:font-bold [&_h1]:text-ink [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-[15px] [&_h2]:font-semibold [&_h2]:text-ink [&_h2]:mt-4 [&_h2]:mb-1.5 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-ink [&_h3]:mt-3 [&_h3]:mb-1 [&_p]:my-2 [&_ul]:my-2 [&_ul]:pl-5 [&_ul]:list-disc [&_ol]:my-2 [&_ol]:pl-5 [&_ol]:list-decimal [&_li]:my-1 [&_strong]:text-ink [&_strong]:font-semibold [&_code]:bg-background [&_code]:border [&_code]:border-border [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[12px] [&_pre]:bg-ink [&_pre]:text-white [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:border-0 [&_pre_code]:text-white [&_blockquote]:border-l-2 [&_blockquote]:border-accent [&_blockquote]:pl-3 [&_blockquote]:text-muted [&_table]:my-2 [&_table]:w-full [&_th]:text-left [&_th]:font-semibold [&_th]:text-ink [&_th]:border-b [&_th]:border-border [&_th]:py-1.5 [&_td]:border-b [&_td]:border-[#f2f2f4] [&_td]:py-1.5 [&_a]:text-accent [&_a]:underline">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  )
}
