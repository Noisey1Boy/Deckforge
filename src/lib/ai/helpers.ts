import ZAI from 'z-ai-web-dev-sdk';

/**
 * Server-side AI helpers. The z-ai-web-dev-sdk key never leaves the server.
 */

let cached: ZAI | null = null;

export async function getZAI(): Promise<ZAI> {
  if (!cached) cached = await ZAI.create();
  return cached;
}

/**
 * Robust JSON extraction from an LLM response: strips code fences, finds the
 * first balanced JSON object/array, and parses it.
 */
export function extractJson<T>(raw: string): T {
  if (!raw) throw new Error('Empty AI response');
  let text = raw.trim();
  // strip ```json fences
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  const start = text.search(/[[{]/);
  if (start === -1) throw new Error('No JSON found in AI response');
  const open = text[start];
  const close = open === '{' ? '}' : ']';
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) {
        return JSON.parse(text.slice(start, i + 1)) as T;
      }
    }
  }
  throw new Error('Unbalanced JSON in AI response');
}

/** Remove any HTML/script content and control characters from AI text. */
export function sanitizeText(input: unknown, maxLen = 500): string {
  if (input == null) return '';
  return String(input)
    .replace(/<[^>]*>/g, '') // strip tags
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

export function sanitizeLines(input: unknown, maxCount: number, maxLen: number): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((x) => sanitizeText(x, maxLen))
    .filter(Boolean)
    .slice(0, maxCount);
}

export function toFiniteNumber(v: unknown): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[^0-9.eE+-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

// ---------------------------------------------------------------------------
// Tiny in-memory rate limiter (per IP).
// ---------------------------------------------------------------------------
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= limit) return false;
  b.count++;
  return true;
}

export function clientKey(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'local'
  );
}
