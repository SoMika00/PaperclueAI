/**
 * Single source of truth for the five tools, mirroring the design
 * mockup (PaperClue.dc.html). Colors are the "node" palette; each
 * tool keeps its accent + tint pair everywhere it appears.
 */
export type ToolDef = {
  id: string
  href: string
  name: string
  color: string
  tint: string
  free: boolean
  tagline: string
  placeholder: string
  emptyLine: string
  chips: string[]
  lockedQuote: string
}

export const TOOLS: ToolDef[] = [
  {
    id: 'mindmap',
    href: '/',
    name: 'Mind Map',
    color: '#6c4de6',
    tint: '#ede6ff',
    free: true,
    tagline: 'Explore any research topic as a network of directions',
    placeholder: 'e.g. Machine learning for diabetes prediction',
    emptyLine: 'Your mind map will appear here once you send a topic.',
    chips: [
      'Machine learning for diabetes prediction',
      'Transformer attention mechanisms',
      'CRISPR off-target effects',
      'Microplastics in drinking water',
    ],
    lockedQuote: '',
  },
  {
    id: 'insights',
    href: '/paper-insights',
    name: 'Paper Insights',
    color: '#ff5a7a',
    tint: '#ffe6ec',
    free: false,
    tagline: 'Readiness scores, gaps, and key findings',
    placeholder: "e.g. Score this paper's readiness for submission",
    emptyLine: 'Ask for a readiness score, weak sections, or key findings.',
    chips: [
      "Score this paper's readiness for submission",
      'What are the three weakest sections?',
      'Summarize the key findings',
    ],
    lockedQuote: "Score this paper's readiness for submission",
  },
  {
    id: 'proofreader',
    href: '/proofreader',
    name: 'Proofreader',
    color: '#e0951a',
    tint: '#fff2d6',
    free: false,
    tagline: 'Language and structure review, section by section',
    placeholder: 'e.g. Tighten the discussion section without changing my voice',
    emptyLine: 'Ask for edits by section, tone, or grammar focus.',
    chips: [
      'Tighten the discussion section',
      'Fix grammar without changing my voice',
      'Flag passive-voice overuse',
    ],
    lockedQuote: 'Tighten the discussion section without changing my voice',
  },
  {
    id: 'journal',
    href: '/journal-formatting',
    name: 'Journal Match',
    color: '#0f9b8e',
    tint: '#e0f7f4',
    free: false,
    tagline: 'Best-fit venues, inferred from real published papers',
    placeholder: 'Optional keywords, comma-separated — e.g. machine learning, diabetes',
    emptyLine: 'Attach your paper to get a shortlist of venues that publish work like it.',
    chips: [
      'machine learning, clinical prediction',
      'transformer models, attention',
      'public health, epidemiology',
    ],
    lockedQuote: 'Which journals fit this paper best?',
  },
  {
    id: 'manuscript',
    href: '/manuscript-review',
    name: 'Manuscript Review',
    color: '#ff8a3d',
    tint: '#ffe9d9',
    free: false,
    tagline: 'Simulated first-round peer review, section by section',
    placeholder: 'Optional focus for the reviewers — e.g. check my methods section',
    emptyLine: 'Attach your manuscript to run a simulated peer review.',
    chips: [
      'Is my discussion answering the objectives?',
      'What would reviewers flag first?',
      'Are my conclusions supported by the results?',
    ],
    lockedQuote: 'Run a first-round peer review before my supervisor sees it',
  },
  {
    id: 'chat',
    href: '/research-chat',
    name: 'Research Chat',
    color: '#3d7dff',
    tint: '#e6f0ff',
    free: false,
    tagline: 'Ask your paper questions, grounded in its own text',
    placeholder: 'e.g. What does this paper assume but never state?',
    emptyLine: 'Ask anything — answers cite the exact passage they come from.',
    chips: [
      'What does this paper assume but never state?',
      "Explain the methodology like I'm new to the field",
      'What would a reviewer challenge first?',
    ],
    lockedQuote: 'What does this paper assume but never state?',
  },
]

export const toolById = (id: string) => TOOLS.find((t) => t.id === id)!
