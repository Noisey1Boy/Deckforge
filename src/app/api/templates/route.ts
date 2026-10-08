import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

export interface TemplateMeta {
  id: string
  name: string
  tagline: string
  category: string
  style: string
  palette: string[]
  fonts: string[]
  bestFor: string[]
  tags: string[]
  slidesCount: number
  framework: 'opendesign' | 'reveal' | 'impress' | 'shower' | 'dzslides'
}

/**
 * Framework detection from template id prefix (mirrors decksmith's detectFramework).
 * "reveal-" templates use the vendored reveal.js runtime at /revealjs/,
 * "impress-", "shower-" and "dzslides-" use /frameworks/[name]/, the rest are
 * self-contained open-design decks with the shared _shared/ runtime.
 */
export function detectFramework(id: string): TemplateMeta['framework'] {
  if (id.startsWith('reveal-')) return 'reveal'
  if (id.startsWith('impress-')) return 'impress'
  if (id.startsWith('shower-')) return 'shower'
  if (id.startsWith('dzslides-')) return 'dzslides'
  return 'opendesign'
}

const FALLBACK_PALETTE = ['#ffffff', '#3b6cff', '#111216', '#7a5cff']

let cached: { templates: Record<string, unknown>[] } | null = null

function readManifest(): { templates: Record<string, unknown>[] } {
  if (cached) return cached
  const file = path.join(process.cwd(), 'public', 'templates', 'templates.json')
  cached = JSON.parse(fs.readFileSync(file, 'utf-8')) as { templates: Record<string, unknown>[] }
  return cached
}

export async function GET() {
  const source = readManifest().templates
  const templates: TemplateMeta[] = source.map((t) => {
    const id = String(t.id ?? '')
    const palette = Array.isArray(t.palette) ? (t.palette as string[]) : FALLBACK_PALETTE
    return {
      id,
      name: String(t.name ?? id),
      tagline: String(t.tagline ?? ''),
      category: String(t.category ?? 'General'),
      style: String(t.style ?? 'Custom'),
      palette: palette.length >= 2 ? palette.slice(0, 5) : FALLBACK_PALETTE,
      fonts: Array.isArray(t.fonts) ? (t.fonts as string[]).slice(0, 4) : [],
      bestFor: Array.isArray(t.bestFor) ? (t.bestFor as string[]).slice(0, 6) : [],
      tags: Array.isArray(t.tags) ? (t.tags as string[]).slice(0, 8) : [],
      slidesCount: Number(t.slidesCount ?? 0) || 0,
      framework: detectFramework(id),
    }
  })
  return NextResponse.json(
    { templates, count: templates.length },
    { headers: { 'Cache-Control': 'public, max-age=300' } },
  )
}
