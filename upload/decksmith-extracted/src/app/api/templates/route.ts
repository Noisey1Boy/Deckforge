import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const manifestPath = path.join(process.cwd(), 'public', 'templates', 'templates.json')
    const raw = fs.readFileSync(manifestPath, 'utf-8')
    const manifest = JSON.parse(raw)
    return NextResponse.json(manifest)
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to load templates manifest', detail: String(err) },
      { status: 500 }
    )
  }
}
