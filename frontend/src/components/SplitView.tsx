'use client'

import { PdfViewer } from '@/components/PdfViewer'

/** Workspace split view: sticky PDF on the left, feature panel on the right. */
export function SplitView({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[1360px] mx-auto px-8 pt-5 pb-10 grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)] gap-5 items-start">
      <div className="hidden lg:block sticky top-[64px] h-[calc(100vh-120px)]">
        <PdfViewer />
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
