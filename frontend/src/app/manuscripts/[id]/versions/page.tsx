'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { Version } from '@/lib/backend-types'
import { useWorkspace } from '@/lib/workspace'

export default function VersionsPage() {
  const { ms } = useWorkspace()
  const [versions, setVersions] = useState<Version[] | null>(null)

  useEffect(() => {
    if (!ms) return
    api<Version[]>(`/manuscripts/${ms.id}/versions`)
      .then(setVersions)
      .catch(() => setVersions([]))
  }, [ms])

  return (
    <div className="max-w-[880px] mx-auto px-8 pt-8 pb-16">
      <div className="mb-6">
        <div className="text-[18px] font-bold tracking-[-0.3px] text-ink">Versions</div>
        <div className="text-[13px] text-muted">
          Every accepted review fix records a version with its diff and the readiness at
          that moment
        </div>
      </div>

      {versions === null && <div className="text-[13px] text-muted-light">Loading&hellip;</div>}
      {versions?.length === 0 && (
        <div className="bg-white border border-border rounded-[14px] p-6 text-center text-[13px] text-muted">
          No versions yet — accept a fix in the Review tab to record the first one.
        </div>
      )}

      <div className="space-y-3">
        {versions?.map((v) => (
          <div key={v.id} className="bg-white border border-border rounded-[14px] p-4">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[13px] font-bold text-ink shrink-0">v{v.number}</span>
              <span className="text-[13.5px] font-medium text-ink flex-1 min-w-0 truncate">
                {v.label}
              </span>
              <span
                className="text-[12.5px] font-bold shrink-0"
                style={{ color: v.readiness >= 70 ? '#0f9b8e' : v.readiness >= 40 ? '#e0951a' : '#ff5a7a' }}
              >
                {v.readiness}%
              </span>
            </div>
            {v.created_at && (
              <div className="text-[11px] text-muted-light mb-2">
                {new Date(v.created_at).toLocaleString()}
              </div>
            )}
            {v.diff_summary?.map((d, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                <div className="bg-node-coral-bg/40 border border-node-coral/15 rounded-[10px] p-2.5">
                  <div className="text-[10px] font-semibold tracking-[1px] text-node-coral mb-1">BEFORE</div>
                  <p className="text-[12px] text-[#3c465c] leading-relaxed">{d.before}</p>
                </div>
                <div className="bg-node-teal-bg/40 border border-node-teal/15 rounded-[10px] p-2.5">
                  <div className="text-[10px] font-semibold tracking-[1px] text-node-teal mb-1">AFTER</div>
                  <p className="text-[12px] text-[#3c465c] leading-relaxed">{d.after}</p>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
