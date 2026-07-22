/**
 * Client-side document text extraction, ported from the old frontend's
 * fileParser.ts and upgraded: the old app never actually implemented PDF
 * extraction (it asked users to convert to .txt) — this version does it
 * with pdfjs. All parsing stays in the browser; raw text is sent only to
 * the edge functions, never persisted (per the security design).
 */

const MAX_FILE_SIZE = 30 * 1024 * 1024 // 30 MB, per the design's attach hint

export type ParsedDocument = {
  filename: string
  text: string
  words: number
}

export function isSupportedFile(file: File): boolean {
  const ext = '.' + (file.name.split('.').pop()?.toLowerCase() ?? '')
  return ['.pdf', '.doc', '.docx', '.txt', '.md', '.tex'].includes(ext)
}

export async function parseFile(file: File): Promise<ParsedDocument> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 30 MB.`
    )
  }

  const ext = file.name.split('.').pop()?.toLowerCase()
  let text: string

  switch (ext) {
    case 'txt':
    case 'md':
    case 'tex':
      text = await file.text()
      break
    case 'pdf':
      text = await parsePdf(file)
      break
    case 'doc':
    case 'docx':
      text = await parseWord(file)
      break
    default:
      throw new Error(`Unsupported file format: .${ext}`)
  }

  const cleaned = text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
  if (!cleaned) {
    throw new Error(
      'No text could be extracted from this file. If it is a scanned PDF, try a text-based version.'
    )
  }

  return {
    filename: file.name,
    text: cleaned,
    words: cleaned.split(/\s+/).length,
  }
}

async function parsePdf(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString()

  const data = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data }).promise

  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const line = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    pages.push(line)
  }
  return pages.join('\n\n')
}

async function parseWord(file: File): Promise<string> {
  const mammoth = await import('mammoth')
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value
}
