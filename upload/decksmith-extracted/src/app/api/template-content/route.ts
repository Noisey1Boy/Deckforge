import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

/**
 * GET /api/template-content?id=pitch-deck
 * Returns the raw HTML of a specific template so the AI generation route
 * can inject it as in-context reference, and the client can show a code view.
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id || !/^[a-z0-9-]+$/.test(id)) {
    return NextResponse.json({ error: 'Invalid template id' }, { status: 400 })
  }
  try {
    const tplPath = path.join(process.cwd(), 'public', 'templates', id, 'template.html')
    if (!fs.existsSync(tplPath)) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }
    const html = fs.readFileSync(tplPath, 'utf-8')
    let css: string | undefined
    const cssPath = path.join(process.cwd(), 'public', 'templates', id, 'style.css')
    if (fs.existsSync(cssPath)) {
      css = fs.readFileSync(cssPath, 'utf-8')
    }
    return NextResponse.json({
      id,
      html,
      css,
      htmlSize: html.length,
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to read template', detail: String(err) },
      { status: 500 }
    )
  }
}
