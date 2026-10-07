import { NextRequest, NextResponse } from 'next/server'
import { clientKey, getZAI, rateLimit, sanitizeText } from '@/lib/ai/helpers'
import { db } from '@/lib/db'
import { loadTemplate } from '@/app/api/template-content/route'
import {
  buildSlideSystemPrompt,
  buildSlideUserPrompt,
  detectFramework,
  extractHtml,
  type DeckOutlineJson,
  type Framework,
  type SlideOutline,
} from '@/lib/htmlgen/prompts'
import { assembleDeck, escapeHtml } from '@/lib/htmlgen/assemble'

export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * Engine detection from template id prefix — copied verbatim from
 * /api/templates/route.ts detectFramework (kept local to avoid importing a
 * route module for one function).
 */
type TemplateEngine = 'opendesign' | 'reveal' | 'impress' | 'shower' | 'dzslides'
function detectEngine(templateId: string): TemplateEngine {
  if (templateId.startsWith('reveal-')) return 'reveal'
  if (templateId.startsWith('impress-')) return 'impress'
  if (templateId.startsWith('shower-')) return 'shower'
  if (templateId.startsWith('dzslides-')) return 'dzslides'
  return 'opendesign'
}

interface SlidesBody {
  outline: DeckOutlineJson
  templateId: string
}

const BATCH_SIZE = 3
const CONCURRENCY = 2

/** Resilient placeholder so one failed slide never kills the deck. */
function placeholderSlide(framework: Framework, slide: SlideOutline, index: number): string {
  const t = escapeHtml(slide.title)
  const notes = escapeHtml(slide.speaker_notes)
  switch (framework) {
    case 'reveal.js':
      return `<section><h2>${t}</h2><aside class="notes">${notes}</aside></section>`
    case 'impress.js':
      return `<div class="step slide" data-x="${1400 * index}" data-y="0"><h2>${t}</h2><div class="notes">${notes}</div></div>`
    case 'shower':
      return `<section class="slide"><h2>${t}</h2><details class="notes">${notes}</details></section>`
    case 'dzslides':
      return `<section><h2>${t}</h2><div role="note">${notes}</div></section>`
    default:
      return `<section class="slide" data-title="${t}"><h2>${t}</h2><div class="notes">${notes}</div></section>`
  }
}

export async function POST(req: NextRequest) {
  if (!rateLimit(`htmlgen-slides:${clientKey(req)}`, 6, 60_000)) {
    return NextResponse.json({ error: 'Too many requests — please wait a moment.' }, { status: 429 })
  }

  let body: SlidesBody
  try {
    body = (await req.json()) as SlidesBody
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const outline = body?.outline
  const templateId = typeof body?.templateId === 'string' ? body.templateId : ''
  if (!outline || !Array.isArray(outline.slides) || outline.slides.length === 0) {
    return NextResponse.json({ error: 'Outline with slides is required' }, { status: 400 })
  }
  if (outline.slides.length > 20) {
    return NextResponse.json({ error: 'Decks are limited to 20 slides' }, { status: 400 })
  }
  if (!/^[a-z0-9-]{1,64}$/.test(templateId)) {
    return NextResponse.json({ error: 'A valid templateId is required (template mode only)' }, { status: 400 })
  }
  const tpl = loadTemplate(templateId)
  if (!tpl) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  const framework = detectFramework(tpl.html)
  const slides = outline.slides
  const total = slides.length
  const deckTitle = sanitizeText(outline.title, 200) || 'Untitled Deck'
  const encoder = new TextEncoder()
  let clientClosed = false
  req.signal.addEventListener('abort', () => {
    clientClosed = true
  })

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false
      const send = (event: string, data: Record<string, unknown>) => {
        if (closed || clientClosed) return
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        } catch {
          closed = true // client disconnected — keep generating, drop sends
        }
      }

      try {
        const zai = await getZAI()

        send('status', { type: 'status', message: `Loading template "${templateId}" (${framework})…` })

        const generateOne = async (i: number): Promise<string> => {
          const slide = slides[i]
          try {
            const completion = await zai.chat.completions.create({
              messages: [
                { role: 'system', content: buildSlideSystemPrompt({
                  templateId,
                  templateHtml: tpl.html,
                  templateCss: tpl.css || undefined,
                  framework,
                  deckTitle,
                  slideIndex: i,
                  slideTotal: total,
                }) },
                { role: 'user', content: buildSlideUserPrompt(slide) },
              ],
              temperature: 0.7,
              max_tokens: 3000,
              thinking: { type: 'disabled' },
            })
            const raw = completion.choices[0]?.message?.content ?? ''
            if (!raw) throw new Error('empty AI response')
            const html = extractHtml(raw)
            if (!html || html.length < 50) throw new Error('slide HTML too short')
            return html
          } catch (err) {
            console.error(`[htmlgen/slides] slide ${i} generation failed`, err)
            return placeholderSlide(framework, slide, i)
          }
        }

        // Generate in batches of 3 (decksmith pattern); within a batch, run
        // 2-way concurrency and emit strictly in outline order.
        const slideResults = new Map<number, string>()
        for (let batchStart = 0; batchStart < total; batchStart += BATCH_SIZE) {
          if (closed || clientClosed) break
          const batch: number[] = []
          for (let i = batchStart; i < Math.min(batchStart + BATCH_SIZE, total); i++) batch.push(i)

          send('status', {
            type: 'status',
            message: `Generating slides ${batchStart + 1}–${batch[batch.length - 1] + 1} of ${total}…`,
          })

          let cursor = 0
          const workers = Array.from({ length: Math.min(CONCURRENCY, batch.length) }, async () => {
            while (true) {
              if (closed || clientClosed) return
              const my = cursor++
              if (my >= batch.length) return
              const slideIndex = batch[my]
              slideResults.set(slideIndex, await generateOne(slideIndex))
            }
          })
          await Promise.all(workers)

          for (const i of batch) {
            send('slide', { type: 'slide', index: i, total, title: slides[i].title })
          }
        }

        send('status', { type: 'status', message: 'Assembling deck…' })

        const html = assembleDeck({
          templateId,
          templateHtml: tpl.html,
          framework,
          deckTitle,
          slideHtmls: slides.map((_, i) => slideResults.get(i) ?? placeholderSlide(framework, slides[i], i)),
        })

        const created = await db.htmlDeck.create({
          data: {
            title: deckTitle,
            subtitle: sanitizeText(outline.subtitle, 300),
            templateId,
            engine: detectEngine(templateId),
            html,
            outlineJson: JSON.stringify(outline),
          },
        })

        send('complete', { type: 'complete', deckId: created.id, html, title: deckTitle })
      } catch (err) {
        console.error('[htmlgen/slides] error:', err)
        send('error', { type: 'error', message: 'Slide generation failed. Please try again.' })
      }
      if (!closed) {
        try {
          controller.close()
        } catch {
          // already closed
        }
      }
    },
    cancel() {
      clientClosed = true
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
