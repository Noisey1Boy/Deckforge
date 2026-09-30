import { NextRequest, NextResponse } from 'next/server';
import { getZAI, rateLimit, sanitizeText, clientKey } from '@/lib/ai/helpers';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

export const maxDuration = 120;

/** Generate a themed illustration for an image slide. */
export async function POST(req: NextRequest) {
  if (!rateLimit(`img:${clientKey(req)}`, 12, 60_000)) {
    return NextResponse.json({ error: 'Too many requests — please wait a moment.' }, { status: 429 });
  }
  try {
    const { prompt } = (await req.json()) as { prompt?: string };
    const clean = sanitizeText(prompt, 400);
    if (clean.length < 3) {
      return NextResponse.json({ error: 'Describe the image you want.' }, { status: 400 });
    }
    const zai = await getZAI();
    const res = await zai.images.generations.create({
      prompt: `${clean}, editorial presentation illustration, cohesive, high quality, detailed`,
      size: '1344x768',
    });
    const base64 = res.data?.[0]?.base64;
    if (!base64) return NextResponse.json({ error: 'Image generation returned nothing.' }, { status: 502 });

    const dir = path.join(process.cwd(), 'public', 'generated');
    await mkdir(dir, { recursive: true });
    const file = `img_${Date.now().toString(36)}.png`;
    await writeFile(path.join(dir, file), Buffer.from(base64, 'base64'));
    return NextResponse.json({ url: `/generated/${file}` }, { status: 201 });
  } catch (err) {
    console.error('image generation failed', err);
    return NextResponse.json({ error: 'Image generation failed. Please retry.' }, { status: 500 });
  }
}
