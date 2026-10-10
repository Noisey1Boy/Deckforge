import { NextRequest, NextResponse } from 'next/server'
import { clientKey, getZAI, rateLimit, sanitizeText } from '@/lib/ai/helpers'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import {
  buildScratchSystemPrompt,
  buildScratchUserPrompt,
  REVEAL_THEMES,
  type DeckOutlineJson,
} from '@/lib/htmlgen/prompts'
import { assembleScratchDeck, escapeHtml, extractStyleBlocks } from '@/lib/htmlgen/assemble'

export const runtime = 'nodejs'
export const maxDuration = 300

interface ScratchBody {
  outline: DeckOutlineJson
  mode?: 'reveal' | 'plain'
}

const MAX_CHUNK_CALLS = 3

function splitChunks(total: number): Array<[number, number]> {
  const per = Math.ceil(total / MAX_CHUNK_CALLS)
  const ranges: Array<[number, number]> = []
  for (let start = 0; start < total; start += per) {
    ranges.push([start, Math.min(start + per, total) - 1])
  }
  return ranges
}

function extractSections(raw: string, engine: 'reveal' | 'plain'): string[] {
  let body = raw
  // Style blocks are handled separately — remove them before scanning sections.
  body = body.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  body = body.replace(/<!--\s*reveal-theme:[^>]*-->/gi, '')
  const fence = body.match(/```(?:html|HTML)?\s*\n?([\s\S]*?)\n?```/)
  if (fence) body = fence[1]
  if (engine === 'plain') {
    const slides = body.match(/<section\b[^>]*class="[^"]*slide[^"]*"[^>]*>[\s\S]*?<\/section>/gi)
    if (slides && slides.length > 0) return slides
  }
  return body.match(/<section\b[^>]*>[\s\S]*?<\/section>/gi) ?? []
}

function placeholderSection(engine: 'reveal' | 'plain', title: string, notes: string): string {
  const t = escapeHtml(title)
  const n = escapeHtml(notes)
  return engine === 'reveal'
    ? `<section><h2>${t}</h2><aside class="notes">${n}</aside></section>`
    : `<section class="slide" data-title="${t}"><h2>${t}</h2><div class="notes">${n}</div></section>`
}

export async function POST(req: NextRequest) {
  if (!rateLimit(`htmlgen-scratch:${clientKey(req)}`, 6, 60_000)) {
    return NextResponse.json({ error: 'Too many requests — please wait a moment.' }, { status: 429 })
  }

  let body: ScratchBody
  try {
    body = (await req.json()) as ScratchBody
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const outline = body?.outline
  if (!outline || !Array.isArray(outline.slides) || outline.slides.length === 0) {
    return NextResponse.json({ error: 'Outline with slides is required' }, { status: 400 })
  }
  if (outline.slides.length > 20) {
    return NextResponse.json({ error: 'Decks are limited to 20 slides' }, { status: 400 })
  }
  const engine = body.mode === 'plain' ? 'plain' : 'reveal'

  const slides = outline.slides
  const total = slides.length
  const deckTitle = sanitizeText(outline.title, 200) || 'Untitled Deck'
  // Capture the owner while still inside the request scope (cookies() is not
  // available inside the SSE stream callback below).
  const sessionUser = await getSessionUser()
  const ownerId = sessionUser?.id ?? null
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

        send('status', {
          type: 'status',
          message: `Building a from-scratch ${engine === 'reveal' ? 'reveal.js' : 'hand-rolled'} deck (${total} slides)…`,
        })

        const ranges = splitChunks(total)
        const sections: string[] = []
        const styleBlocks: string[] = []
        let theme: string | undefined

        for (const [slideStart, slideEnd] of ranges) {
          if (closed || clientClosed) break
          const chunkSlides = slides.slice(slideStart, slideEnd + 1)
          const isFirst = slideStart === 0
          send('status', {
            type: 'status',
            message: `Generating slides ${slideStart + 1}–${slideEnd + 1} of ${total}…`,
          })

          const promptParams = {
            engine,
            deckTitle,
            slideStart,
            slideEnd,
            slideTotal: total,
            isFirst,
          } as const

          let chunkRaw = ''
          let chunkSections: string[] = []
          // 1 retry per chunk — scratch chunks carry a lot of HTML.
          for (let attempt = 0; attempt < 2; attempt++) {
            const completion = await zai.chat.completions.create({
              messages: [
                { role: 'system', content: buildScratchSystemPrompt(promptParams) },
                { role: 'user', content: buildScratchUserPrompt({ ...promptParams, slides: chunkSlides }) },
              ],
              temperature: 0.7,
              max_tokens: 8000,
              thinking: { type: 'disabled' },
            })
            chunkRaw = completion.choices[0]?.message?.content ?? ''
            if (chunkRaw) {
              if (isFirst && engine === 'reveal') {
                const m = chunkRaw.match(/<!--\s*reveal-theme:\s*([a-z0-9-]+)\s*-->/i)
                if (m && (REVEAL_THEMES as readonly string[]).includes(m[1])) theme = m[1]
              }
              styleBlocks.push(...extractStyleBlocks(chunkRaw))
              chunkSections = extractSections(chunkRaw, engine)
              if (chunkSections.length > 0) break
            }
            if (attempt === 0) {
              send('status', { type: 'status', message: `Retrying slides ${slideStart + 1}–${slideEnd + 1}…` })
            }
          }

          if (chunkSections.length === 0) {
            throw new Error(`Chunk for slides ${slideStart + 1}–${slideEnd + 1} returned no sections`)
          }
          if (chunkSections.length < chunkSlides.length) {
            send('status', {
              type: 'status',
              message: `Chunk returned ${chunkSections.length} of ${chunkSlides.length} slides — filling the gap.`,
            })
          }

          for (let k = 0; k < chunkSlides.length; k++) {
            sections.push(chunkSections[k] ?? placeholderSection(engine, chunkSlides[k].title, chunkSlides[k].speaker_notes))
            send('slide', {
              type: 'slide',
              index: slideStart + k,
              total,
              title: chunkSlides[k].title,
            })
          }
        }

        send('status', { type: 'status', message: 'Assembling deck…' })

        const html = assembleScratchDeck({ engine, deckTitle, sections, styleBlocks, theme })

        const created = await db.htmlDeck.create({
          data: {
            title: deckTitle,
            subtitle: sanitizeText(outline.subtitle, 300),
            templateId: '',
            engine: engine === 'reveal' ? 'scratch-reveal' : 'scratch-plain',
            html,
            outlineJson: JSON.stringify(outline),
            userId: ownerId,
          },
        })

        send('complete', { type: 'complete', deckId: created.id, html, title: deckTitle })
      } catch (err) {
        console.error('[htmlgen/scratch] error:', err)
        send('error', { type: 'error', message: 'Scratch deck generation failed. Please try again.' })
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
