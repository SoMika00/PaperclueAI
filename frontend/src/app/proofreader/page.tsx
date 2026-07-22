'use client'

import { GatedToolPage } from '@/components/GatedToolPage'
import { BulletList, LabeledRow, StatTile, scoreColor } from '@/components/ResultParts'
import type { ProofreadingResponse } from '@/lib/edge-functions'
import { splitIntoSections } from '@/lib/sections'

const AMBER = '#e0951a'

function ProofreadingResult(data: Record<string, unknown>) {
  const res = data as ProofreadingResponse
  const hasStats =
    typeof res.grammar_issues === 'number' || typeof res.clarity_score === 'number'
  if (!hasStats && !res.section_feedback) return null

  return (
    <div>
      <div className="flex gap-3 py-3">
        {typeof res.grammar_issues === 'number' && (
          <StatTile
            value={res.grammar_issues}
            label="grammar issues"
            color={res.grammar_issues > 10 ? '#ff5a7a' : '#14213d'}
          />
        )}
        {typeof res.clarity_score === 'number' && (
          <StatTile
            value={`${res.clarity_score}/10`}
            label="clarity"
            color={scoreColor(res.clarity_score)}
          />
        )}
        {res.passive_voice_ratio && (
          <StatTile value={res.passive_voice_ratio} label="passive voice" />
        )}
      </div>

      {res.missing_transitions && res.missing_transitions.length > 0 && (
        <LabeledRow label="Transitions" color={AMBER}>
          <BulletList items={res.missing_transitions.map((t) => `Missing: ${t}`)} />
        </LabeledRow>
      )}

      {res.section_feedback &&
        Object.entries(res.section_feedback).map(([section, note]) => (
          <LabeledRow key={section} label={section} color={AMBER}>
            {note}
          </LabeledRow>
        ))}
    </div>
  )
}

export default function ProofreaderPage() {
  return (
    <GatedToolPage
      toolId="proofreader"
      edgeFunction="proofreading"
      requiresDocument
      renderResult={ProofreadingResult}
      buildBody={(prompt, doc) => {
        const sections = splitIntoSections(doc!.text, doc!.filename)
        return {
          sections: prompt.trim() ? { ...sections, instructions: prompt } : sections,
          filename: doc!.filename,
        }
      }}
    />
  )
}
