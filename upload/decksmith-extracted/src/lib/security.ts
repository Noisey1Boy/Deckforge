/**
 * Rate limiting + security middleware for AI routes.
 * 
 * Prevents abuse by limiting requests per IP address.
 * Uses an in-memory sliding window (works for single-server deployments;
 * for multi-server, swap with Redis).
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10 // 10 AI requests per minute per IP
const SLIDE_RATE_LIMIT_MAX = 30 // 30 slide generations per minute (they're smaller)

// In-memory store (resets on server restart — acceptable for this app's scale)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

export function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIP = req.headers.get('x-real-ip')
  if (realIP) return realIP
  return 'unknown'
}

export function checkRateLimit(
  ip: string,
  maxRequests: number = RATE_LIMIT_MAX_REQUESTS
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const key = ip

  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return { allowed: true, remaining: maxRequests - 1, resetIn: RATE_LIMIT_WINDOW }
  }

  entry.count++
  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0, resetIn: entry.resetTime - now }
  }

  return { allowed: true, remaining: maxRequests - entry.count, resetIn: entry.resetTime - now }
}

/**
 * Allowed AI models — prevents users from routing to expensive models
 * or injecting arbitrary model names.
 */
export const ALLOWED_MODELS = new Set([
  'z-ai-default',
  // OmniRoute free keyless models (no auth needed)
  'oc/deepseek-v4-flash-free',
  'oc/big-pickle',
  'oc/mimo-v2.5-free',
  'oc/hy3-free',
  'oc/nemotron-3-ultra-free',
  'oc/north-mini-code-free',
  // OmniRoute auto combos (free)
  'auto',
  'auto/free',
])

export function isModelAllowed(model: string): boolean {
  if (ALLOWED_MODELS.has(model)) return true
  // Allow any oc/ prefix (OpenCode free models)
  if (model.startsWith('oc/')) return true
  return false
}

/**
 * Sanitize AI-generated HTML to prevent XSS.
 * Strips: <script> tags, on* event handlers, javascript: URLs, <iframe> with external src.
 * Keeps: all visual HTML (divs, sections, styles, spans, svg, etc.)
 */
export function sanitizeAIHtml(html: string): string {
  let sanitized = html

  // Remove <script> tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  // Remove on* event handlers (onclick, onload, onerror, etc.)
  sanitized = sanitized.replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
  sanitized = sanitized.replace(/\son\w+\s*=\s*'[^']*'/gi, '')
  sanitized = sanitized.replace(/\son\w+\s*=\s*[^\s>]+/gi, '')

  // Remove javascript: URLs in href/src
  sanitized = sanitized.replace(/(href|src)\s*=\s*["']javascript:[^"']*["']/gi, '$1="#"')

  // Remove <iframe> tags (prevent embedding arbitrary external content)
  sanitized = sanitized.replace(/<iframe\b[^>]*>.*?<\/iframe>/gis, '')
  sanitized = sanitized.replace(/<iframe\b[^>]*\/?>/gi, '')

  // Remove <object> and <embed> tags
  sanitized = sanitized.replace(/<object\b[^>]*>.*?<\/object>/gis, '')
  sanitized = sanitized.replace(/<embed\b[^>]*\/?>/gi, '')

  // Remove data: URLs in src (can be used for XSS)
  sanitized = sanitized.replace(/src\s*=\s*["']data:[^"']*["']/gi, 'src="#"')

  return sanitized
}

/**
 * Mask error details for client responses.
 * Returns a generic error message without leaking internals.
 */
export function maskError(err: unknown): { error: string; detail?: string } {
  const msg = err instanceof Error ? err.message : String(err)

  // Don't leak API keys, URLs, or internal paths
  const masked = msg
    .replace(/sk-[a-zA-Z0-9]+/g, 'sk-***')
    .replace(/Bearer\s+[^\s]+/gi, 'Bearer ***')
    .replace(/https?:\/\/[^\s]+/g, '[URL]')
    .replace(/\/home\/[^\s]+/g, '[path]')
    .replace(/at\s+async\s+[^\n]+/g, '')
    .trim()

  // Only include detail if it's a user-actionable message
  if (masked.includes('rate limit') || masked.includes('timeout') || masked.includes('not running')) {
    return { error: 'Request failed', detail: masked.slice(0, 200) }
  }

  return { error: 'An error occurred. Please try again.' }
}
