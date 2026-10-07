import { NextRequest, NextResponse } from 'next/server'
import { clientKey, extractJson, getZAI, rateLimit, sanitizeText } from '@/lib/ai/helpers'
import {
  buildOutlineSystemPrompt,
  buildOutlineUserPrompt,
  OUTLINE_LAYOUTS,
  sanitizeMarkdownText,
  type DeckOutlineJson,
  type SlideOutline,
} from '@/lib/htmlgen/prompts'

export const runtime = 'nodejs'
export const maxDuration = 120

interface OutlineBody {
  brief: string
  mode?: 'template' | 'scratch'
  templateId?: string
  slideCount?: number
  audience?: string
  tone?: string
  verbosity?: 'concise' | 'standard' | 'text-heavy'
}

const VERBOSITIES = ['concise', 'standard', 'text-heavy'] as const

function coerceOutline(raw: {
  title?: unknown
  subtitle?: unknown
  slides?: unknown
}, slideCount: number): DeckOutlineJson {
  const rawSlides = Array.isArray(raw.slides) ? (raw.slides as Array<Record<string, unknown>>) : []
  const slides: SlideOutline[] = rawSlides.slice(0, slideCount).map((s, i) => {
    const layout = typeof s.layout === 'string' && (OUTLINE_LAYOUTS as readonly string[]).includes(s.layout)
      ? s.layout
      : i === 0
        ? 'title'
        : i === rawSlides.length - 1
          ? 'cta'
          : 'two-column'
    return {
      title: sanitizeText(s.title, 60) || `Slide ${i + 1}`,
      layout,
      content_markdown: sanitizeMarkdownText(s.content_markdown, 2000),
      speaker_notes: sanitizeText(s.speaker_notes, 500),
    }
  })
  return {
    title: sanitizeText(raw.title, 80) || 'Untitled Deck',
    subtitle: sanitizeText(raw.subtitle, 120),
    slides,
  }
}

export async function POST(req: NextRequest) {
  if (!rateLimit(`htmlgen-outline:${clientKey(req)}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests — please wait a moment.' }, { status: 429 })
  }

  let body: OutlineBody
  try {
    body = (await req.json()) as OutlineBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const brief = typeof body.brief === 'string' ? body.brief.trim() : ''
  if (brief.length < 10) {
    return NextResponse.json({ error: 'A brief of at least 10 characters is required.' }, { status: 400 })
  }

  const slideCount = Math.max(3, Math.min(20, Number(body.slideCount) || 10))
  const mode = body.mode === 'scratch' ? 'scratch' : 'template'
  const templateId =
    typeof body.templateId === 'string' && /^[a-z0-9-]{1,64}$/.test(body.templateId) ? body.templateId : undefined
  const audience = typeof body.audience === 'string' ? body.audience.slice(0, 200) : undefined
  const tone = typeof body.tone === 'string' ? body.tone.slice(0, 200) : undefined
  const verbosity = (VERBOSITIES as readonly string[]).includes(body.verbosity ?? '')
    ? (body.verbosity as OutlineBody['verbosity'])
    : 'standard'

  try {
    const zai = await getZAI()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: buildOutlineSystemPrompt({ brief, slideCount, audience, tone, verbosity, mode, templateId }) },
        { role: 'user', content: buildOutlineUserPrompt({ brief, slideCount }) },
      ],
      temperature: 0.7,
      max_tokens: 6000,
      thinking: { type: 'disabled' },
    })

    const raw = completion.choices[0]?.message?.content ?? ''
    if (!raw) {
      return NextResponse.json({ error: 'AI returned empty response. Please try again.' }, { status: 502 })
    }

    const parsed = extractJson<Record<string, unknown>>(raw)
    const outline = coerceOutline(parsed, slideCount)
    if (outline.slides.length === 0) {
      return NextResponse.json({ error: 'AI returned no slides. Please try again.' }, { status: 502 })
    }

    return NextResponse.json(outline)
  } catch (err) {
    console.error('[htmlgen/outline] error:', err)
    return NextResponse.json({ error: 'Outline generation failed. Please try again.' }, { status: 502 })
  }
}
