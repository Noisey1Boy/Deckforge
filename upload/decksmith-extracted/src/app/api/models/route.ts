import { NextResponse } from 'next/server'

interface ModelOption {
  id: string
  label: string
  provider: string
  description: string
  free?: boolean
}

// All models are free + no-auth. oc/ models route directly to OpenCode API.
const MODELS: ModelOption[] = [
  { id: 'z-ai-default', label: 'Z.AI (Default)', provider: 'Z.AI', description: 'Built-in — no setup needed' },
  { id: 'oc/deepseek-v4-flash-free', label: 'DeepSeek V4 Flash (Free)', provider: 'OpenCode', description: 'DeepSeek V4 Flash — free, no auth', free: true },
  { id: 'oc/big-pickle', label: 'Big Pickle (Free)', provider: 'OpenCode', description: 'Reasoning model — free', free: true },
  { id: 'oc/mimo-v2.5-free', label: 'MiMo V2.5 (Free)', provider: 'OpenCode', description: 'Xiaomi MiMo — 131K context', free: true },
  { id: 'oc/hy3-free', label: 'HY3 (Free)', provider: 'OpenCode', description: 'HY3 — 131K context', free: true },
  { id: 'oc/nemotron-3-ultra-free', label: 'Nemotron 3 Ultra (Free)', provider: 'OpenCode', description: 'NVIDIA — 1M context', free: true },
  { id: 'oc/north-mini-code-free', label: 'North Mini Code (Free)', provider: 'OpenCode', description: 'Code-focused — 131K context', free: true },
]

export async function GET() {
  return NextResponse.json({ models: MODELS, omnirouteConnected: false })
}
