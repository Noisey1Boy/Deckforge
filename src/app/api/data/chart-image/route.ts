import { NextRequest, NextResponse } from 'next/server';
import { extractJson, getZAI, rateLimit, sanitizeText, toFiniteNumber, clientKey } from '@/lib/ai/helpers';
import type { ChartSpec } from '@/lib/deck/types';

export const maxDuration = 120;

/**
 * Extract data from an uploaded image of a chart (user's own data).
 * The VLM reads the visible values; we sanitize into a ChartSpec.
 */
export async function POST(req: NextRequest) {
  if (!rateLimit(`chartimg:${clientKey(req)}`, 12, 60_000)) {
    return NextResponse.json({ error: 'Too many requests — please wait a moment.' }, { status: 429 });
  }
  try {
    const body = (await req.json()) as { image?: string; language?: string };
    const image = typeof body.image === 'string' ? body.image : '';
    if (!image.startsWith('data:image/') || image.length > 8_000_000) {
      return NextResponse.json({ error: 'Please upload a PNG/JPG/WebP image under ~6 MB.' }, { status: 400 });
    }
    const language = sanitizeText(body.language, 40) || 'English';

    const zai = await getZAI();
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content:
            'You are a chart-data extraction expert. Given an image of a chart, read the visible values as faithfully as possible. Respond with STRICT JSON only.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Extract this chart into JSON (language: ${language}):
{
  "kind": "bar|column|line|area|pie|donut",  // closest match
  "title": string (<=60 chars),
  "unit": string (optional, e.g. "%"),
  "data": [{ "label": string (<=24 chars), "value": number }],
  "insight": string (one specific takeaway citing real values, <=130 chars)
}
Max 8 data points. If a value must be estimated from the axis, estimate conservatively.`,
            },
            { type: 'image_url', image_url: { url: image } },
          ],
        },
      ],
      thinking: { type: 'disabled' },
    });

    const raw = completion.choices[0]?.message?.content ?? '';
    const parsed = extractJson<Record<string, unknown>>(raw);
    const kinds = ['bar', 'column', 'line', 'area', 'pie', 'donut'] as const;
    const data = Array.isArray(parsed.data)
      ? (parsed.data as Array<Record<string, unknown>>)
          .slice(0, 8)
          .map((d) => ({ label: sanitizeText(d.label, 24), value: toFiniteNumber(d.value) }))
          .filter((d) => d.label)
      : [];
    if (data.length < 2) {
      return NextResponse.json({ error: 'Could not read enough data points from this image.' }, { status: 422 });
    }

    const spec: ChartSpec = {
      kind: kinds.includes(parsed.kind as never) ? (parsed.kind as ChartSpec['kind']) : 'column',
      data,
      unit: sanitizeText(parsed.unit, 8) || undefined,
      title: sanitizeText(parsed.title, 70),
      insight: sanitizeText(parsed.insight, 140) || undefined,
      source: 'Extracted from uploaded chart image',
    };
    return NextResponse.json({ chart: spec });
  } catch (err) {
    console.error('chart-image failed', err);
    return NextResponse.json({ error: 'Image analysis failed. Try a clearer screenshot.' }, { status: 500 });
  }
}
