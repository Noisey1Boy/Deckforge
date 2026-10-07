import { NextRequest, NextResponse } from 'next/server'
import { getClientIP, checkRateLimit, isModelAllowed, sanitizeAIHtml, maskError } from '@/lib/security'

export const runtime = 'nodejs'
export const maxDuration = 120

interface ChatRequest {
  model: string
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  temperature?: number
  max_tokens?: number
  thinking?: { type: 'enabled' | 'disabled' }
}

interface ChatResult {
  content: string
  model: string
  provider: string
}

/**
 * Unified AI call. 3-tier routing (no OmniRoute server needed):
 * 1. Z.AI SDK (model = 'z-ai-default')
 * 2. OpenCode direct API (model starts with 'oc/') — free, no auth, direct to opencode.ai
 * 3. Z.AI fallback (if OpenCode fails)
 */
export async function callAI(
  model: string,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options?: { temperature?: number; max_tokens?: number; thinking?: { type: 'enabled' | 'disabled' } }
): Promise<ChatResult> {
  const temperature = options?.temperature ?? 0.7
  const max_tokens = options?.max_tokens ?? 6000
  const thinking = options?.thinking ?? { type: 'disabled' as const }

  // Tier 1: Z.AI SDK
  if (model === 'z-ai-default' || !model) {
    return callZAI(messages, temperature, max_tokens, thinking)
  }

  // Tier 2: OpenCode direct API (free, no auth, no OmniRoute needed)
  if (model.startsWith('oc/')) {
    const result = await callOpenCode(model, messages, temperature, max_tokens)
    if (result) return result
    // Fall through to Z.AI if OpenCode fails
  }

  // Tier 3: Z.AI fallback
  return callZAI(messages, temperature, max_tokens, thinking)
}

/**
 * Call OpenCode API directly. Free, no auth, no OmniRoute server needed.
 * Reasoning models (deepseek-v4-flash-free) put output in reasoning_content.
 */
async function callOpenCode(model: string, messages: any[], temperature: number, max_tokens: number): Promise<ChatResult | null> {
  const opencodeModel = model.slice(3) // Strip "oc/" prefix
  try {
    const res = await fetch('https://opencode.ai/zen/v1/chat/completions', {
      method: 'POST',
      signal: AbortSignal.timeout(90000),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: opencodeModel,
        messages,
        temperature,
        max_tokens: Math.max(max_tokens, 500),
      }),
    })

    if (!res.ok) return null

    // Verify response is JSON (not an HTML error page)
    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('application/json')) return null

    const data = await res.json()
    // Reasoning models put output in reasoning_content; check both
    const content = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.message?.reasoning_content || ''
    if (!content) return null

    return { content: sanitizeAIHtml(content), model: opencodeModel, provider: 'OpenCode (free)' }
  } catch {
    return null // Network error, timeout, etc.
  }
}

/**
 * Call Z.AI SDK with 3 retries on rate-limit.
 */
async function callZAI(messages: any[], temperature: number, max_tokens: number, thinking: any): Promise<ChatResult> {
  let lastError: Error | null = null
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      const zai = await ZAI.create()
      const completion = await zai.chat.completions.create({ messages, thinking, temperature, max_tokens })
      const content = completion?.choices?.[0]?.message?.content ?? completion?.message?.content ?? ''
      if (content) return { content: sanitizeAIHtml(content), model: 'z-ai-default', provider: 'Z.AI' }
      throw new Error('Empty response')
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      const msg = lastError.message
      if (msg.includes('429') || msg.includes('500') || msg.includes('502') || msg.includes('503')) {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)))
        continue
      }
      throw lastError
    }
  }
  throw lastError || new Error('Z.AI failed')
}

/** POST /api/ai/chat */
export async function POST(req: NextRequest) {
  let body: ChatRequest
  try {
    body = (await req.json()) as ChatRequest
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { model, messages, temperature, max_tokens, thinking } = body

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'Missing messages' }, { status: 400 })
  }

  // Rate limiting
  const ip = getClientIP(req)
  const rateLimit = checkRateLimit(ip)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait a moment.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)) } }
    )
  }

  // Model allowlist
  if (!isModelAllowed(model)) {
    return NextResponse.json({ error: `Model "${model}" is not allowed.` }, { status: 403 })
  }

  try {
    const result = await callAI(model, messages, { temperature, max_tokens, thinking })
    return NextResponse.json(result)
  } catch (err) {
    console.error('[ai/chat] error:', err)
    return NextResponse.json(maskError(err), { status: 502 })
  }
}
