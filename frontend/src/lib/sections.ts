/**
 * Heuristic manuscript section splitter. The proofreading and
 * manuscript-ingestion edge functions expect a `sections` object
 * ({ title, abstract, introduction, methods, ... }), so we split the
 * parsed document text on common academic headings client-side.
 */

const SECTION_PATTERNS: Array<{ key: string; re: RegExp }> = [
  { key: "abstract", re: /^(?:\d+[.)]?\s*)?abstract\b/i },
  { key: "introduction", re: /^(?:\d+[.)]?\s*)?(?:introduction|background)\b/i },
  { key: "methods", re: /^(?:\d+[.)]?\s*)?(?:methods?|methodology|materials and methods)\b/i },
  { key: "results", re: /^(?:\d+[.)]?\s*)?(?:results?|findings)\b/i },
  { key: "discussion", re: /^(?:\d+[.)]?\s*)?discussion\b/i },
  { key: "conclusion", re: /^(?:\d+[.)]?\s*)?(?:conclusions?|summary)\b/i },
  { key: "references", re: /^(?:\d+[.)]?\s*)?(?:references|bibliography|works cited)\b/i },
];

export type ManuscriptSections = Record<string, string>;

export function splitIntoSections(text: string, filename?: string): ManuscriptSections {
  const lines = text.split("\n");
  const sections: ManuscriptSections = {};

  // First non-empty line is our best guess at the title.
  const firstLine = lines.find((l) => l.trim())?.trim() ?? filename ?? "Untitled";
  sections.title = firstLine.slice(0, 300);

  let current = "body";
  const buckets: Record<string, string[]> = { body: [] };

  for (const raw of lines) {
    const line = raw.trim();
    // Headings are short lines matching a known section name.
    if (line && line.length < 60) {
      const match = SECTION_PATTERNS.find((p) => p.re.test(line));
      if (match) {
        current = match.key;
        buckets[current] = buckets[current] ?? [];
        continue;
      }
    }
    (buckets[current] = buckets[current] ?? []).push(raw);
  }

  for (const [key, content] of Object.entries(buckets)) {
    const joined = content.join("\n").trim();
    if (joined && key !== "references") sections[key] = joined;
  }

  // Nothing matched: send the whole text as one section so the edge
  // function still gets real content.
  if (Object.keys(sections).length <= 2 && buckets.body) {
    sections.body = buckets.body.join("\n").trim();
  }

  return sections;
}
