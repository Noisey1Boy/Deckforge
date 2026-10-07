import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { callAI } from '../ai/chat/route'
import { maskError } from '@/lib/security'
import { buildSlideSystemPrompt, buildSlideUserPrompt, detectFramework } from '@/lib/presentation/slide-prompt'

export const runtime = 'nodejs'
export const maxDuration = 120

// In-memory template cache
const templateCache = new Map<string, string>()

interface SlideBody {
  templateId: string
  deckTitle: string
  slideIndex: number
  slideTotal: number
  slide: { title: string; layout: string; content_markdown: string; speaker_notes: string }
  audience?: string
  tone?: string
  verbosity?: string
}

function extractHtml(raw: string): string {
  let out = raw.trim()
  const fenceMatch = out.match(/```(?:html|HTML)?\s*\n?([\s\S]*?)\n?```/)
  if (fenceMatch) out = fenceMatch[1].trim()
  const startIdx = out.search(/<section|<div class="step"|<div class="slide"/i)
  if (startIdx >= 0) out = out.slice(startIdx)
  if (out.startsWith('<section')) {
    const endIdx = out.lastIndexOf('</section>')
    if (endIdx >= 0) out = out.slice(0, endIdx + '</section>'.length)
  } else if (out.startsWith('<div class="step')) {
    const endIdx = out.lastIndexOf('</div>')
    if (endIdx >= 0) out = out.slice(0, endIdx + '</div>'.length)
  }
  return out.trim()
}

export async function POST(req: NextRequest) {
  let body: SlideBody
  try {
    body = (await req.json()) as SlideBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { templateId, deckTitle, slideIndex, slideTotal, slide, audience, tone, verbosity } = body
  if (!templateId || !/^[a-z0-9-]+$/.test(templateId)) {
    return NextResponse.json({ error: 'Invalid templateId' }, { status: 400 })
  }
  if (!slide || !slide.title || !slide.layout) {
    return NextResponse.json({ error: 'Missing slide data' }, { status: 400 })
  }

  // Load template (cached)
  const cacheKey = `tpl:${templateId}`
  let templateHtml = templateCache.get(cacheKey)
  if (!templateHtml) {
    try {
      templateHtml = fs.readFileSync(path.join(process.cwd(), 'public', 'templates', templateId, 'template.html'), 'utf-8')
      templateCache.set(cacheKey, templateHtml)
    } catch {
      return NextResponse.json({ error: `Template not found` }, { status: 404 })
    }
  }
  const cssCacheKey = `css:${templateId}`
  let templateCss = templateCache.get(cssCacheKey)
  if (templateCss === undefined) {
    try {
      templateCss = fs.readFileSync(path.join(process.cwd(), 'public', 'templates', templateId, 'style.css'), 'utf-8')
    } catch {
      templateCss = ''
    }
    templateCache.set(cssCacheKey, templateCss)
  }

  const framework = detectFramework(templateHtml)
  const systemPrompt = buildSlideSystemPrompt({
    templateId, templateHtml, templateCss, framework,
    deckTitle, slideIndex, slideTotal, audience, tone, verbosity,
  })
  const userPrompt = buildSlideUserPrompt(slide)
  const selectedModel = (body as any).model || 'z-ai-default'

  try {
    const result = await callAI(
      selectedModel,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.7, max_tokens: selectedModel.startsWith('oc/') ? 5000 : 3000, thinking: { type: 'disabled' } }
    )

    const raw: string = result.content
    if (!raw) {
      return NextResponse.json({ error: 'AI returned empty response. Please try again.' }, { status: 502 })
    }

    const slideHtml = extractHtml(raw)
    if (!slideHtml || slideHtml.length < 50) {
      return NextResponse.json({ error: `Slide ${slideIndex + 1} generation failed. Please try again.` }, { status: 502 })
    }

    return NextResponse.json({
      slideHtml, slideIndex,
      meta: { templateId, framework, slideTitle: slide.title, layout: slide.layout, generatedAt: new Date().toISOString(), htmlSize: slideHtml.length },
    })
  } catch (err) {
    console.error('[generate-slide] error:', err)
    return NextResponse.json(maskError(err), { status: 502 })
  }
}
