import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

// In-memory template cache (template.html is read on every slide generation)
const cache = new Map<string, { html: string; css: string }>()

function loadTemplate(templateId: string): { html: string; css: string } | null {
  if (!/^[a-z0-9-]+$/.test(templateId)) return null
  const hit = cache.get(templateId)
  if (hit) return hit
  try {
    const base = path.join(process.cwd(), 'public', 'templates', templateId)
    const html = fs.readFileSync(path.join(base, 'template.html'), 'utf-8')
    let css = ''
    try {
      css = fs.readFileSync(path.join(base, 'style.css'), 'utf-8')
    } catch {
      css = ''
    }
    const entry = { html, css }
    if (cache.size > 80) cache.clear()
    cache.set(templateId, entry)
    return entry
  } catch {
    return null
  }
}

/**
 * Returns the raw template HTML (and optional style.css) so the AI can be
 * shown the template's exact structure/patterns before filling it.
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') ?? ''
  const tpl = loadTemplate(id)
  if (!tpl) return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  return NextResponse.json({ id, html: tpl.html, css: tpl.css })
}

export { loadTemplate }
