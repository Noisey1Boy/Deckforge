import { NextRequest, NextResponse } from 'next/server'
import { callAI } from '../ai/chat/route'
import { maskError } from '@/lib/security'

export const runtime = 'nodejs'
export const maxDuration = 120

interface OutlineBody {
  text: string
  slideCount?: number
  audience?: string
  tone?: string
  verbosity?: 'concise' | 'standard' | 'text-heavy'
  focus?: string
}

interface SlideOutline {
  title: string
  layout: string
  content_markdown: string
  speaker_notes: string
}

export async function POST(req: NextRequest) {
  let body: OutlineBody
  try {
    body = (await req.json()) as OutlineBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { text, slideCount, audience, tone, verbosity, focus } = body
  if (!text || typeof text !== 'string' || text.trim().length < 10) {
    return NextResponse.json({ error: 'Text input must be at least 10 characters.' }, { status: 400 })
  }

  const slides = Math.max(3, Math.min(20, slideCount ?? 10))
  const aud = audience?.trim() || 'general business audience'
  const tn = tone?.trim() || 'professional, confident, clear'
  const vb = verbosity ?? 'standard'
  const fc = focus?.trim() || 'general purpose'
  const wordCount = vb === 'concise' ? 20 : vb === 'text-heavy' ? 60 : 40
  const selectedModel = (body as any).model || 'z-ai-default'

  const systemPrompt = `You are an expert presentation designer. Generate a structured slide outline as JSON.

# TASK
Read the user's brief and produce exactly ${slides} slide outlines. Each outline has:
- title: short slide title (max 60 chars)
- layout: one of these layout types — title | problem | solution | feature-grid | metrics | comparison | timeline | team | quote | two-column | big-number | product-shot | pricing | cta | section-divider
- content_markdown: slide body as markdown (~${wordCount} words). Use ## for subheadings, **bold**, - bullets, > blockquotes. Vary density per slide.
- speaker_notes: 2-3 sentences the presenter would say.

# CONTEXT
- Audience: ${aud}
- Tone: ${tn}
- Verbosity: ${vb} (~${wordCount} words/slide)
- Focus / strategy: ${fc}
- User brief:
"""
${text}
"""

# LAYOUT GUIDANCE
- Slide 1 should be "title" layout.
- Slide 2 should usually be "problem" or "section-divider".
- Last slide should be "cta" or "title" (thanks).
- Vary layouts — never 3 feature-grids in a row.

# OUTPUT FORMAT
Return ONLY valid JSON, no markdown fences, no preamble:
{"title": "Deck Title", "slides": [{"title": "...", "layout": "...", "content_markdown": "...", "speaker_notes": "..."}, ...]}`

  try {
    const result = await callAI(
      selectedModel,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate a ${slides}-slide outline for: ${text}` },
      ],
      { temperature: 0.7, max_tokens: selectedModel.startsWith('oc/') ? 8000 : 6000, thinking: { type: 'disabled' } }
    )

    const raw: string = result.content
    if (!raw) {
      return NextResponse.json({ error: 'AI returned empty response. Please try again.' }, { status: 502 })
    }

    // Extract JSON from response
    let jsonText = raw.trim()
    const fenceMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
    if (fenceMatch) jsonText = fenceMatch[1].trim()
    const firstBrace = jsonText.search(/\{/)
    const lastBrace = jsonText.lastIndexOf('}')
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      jsonText = jsonText.slice(firstBrace, lastBrace + 1)
    }

    let parsed: { title: string; slides: SlideOutline[] }
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      return NextResponse.json({ error: 'AI returned malformed JSON. Please try again.' }, { status: 502 })
    }

    if (!parsed.slides || !Array.isArray(parsed.slides) || parsed.slides.length === 0) {
      return NextResponse.json({ error: 'AI returned no slides. Please try again.' }, { status: 502 })
    }

    return NextResponse.json({
      title: parsed.title || 'Untitled Deck',
      slides: parsed.slides.slice(0, slides),
      meta: {
        slideCount: parsed.slides.length,
        audience: aud, tone: tn, verbosity: vb, focus: fc,
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (err) {
    console.error('[generate-outline] error:', err)
    return NextResponse.json(maskError(err), { status: 502 })
  }
}
