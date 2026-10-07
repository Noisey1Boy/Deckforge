/**
 * Railway environment configuration.
 *
 * The z-ai-web-dev-sdk reads from a .z-ai-config JSON file by default.
 * For Railway (and other hosting platforms), we need to create this file
 * from environment variables at startup.
 *
 * Required env vars:
 *   ZAI_API_KEY  — Z.ai API key
 *   ZAI_BASE_URL — Z.ai API base URL (optional, defaults to https://api.z.ai/api/v1)
 *
 * This script runs as part of the build step and creates .z-ai-config
 * in the project root so the SDK can find it at runtime.
 */

const fs = require('fs')
const path = require('path')

const apiKey = process.env.ZAI_API_KEY
const baseUrl = process.env.ZAI_BASE_URL || 'https://api.z.ai/api/v1'

if (!apiKey) {
  console.warn('⚠️  ZAI_API_KEY environment variable not set — AI generation will fail.')
  console.warn('   Set it in Railway: Variables → New Variable → ZAI_API_KEY')
  process.exit(0) // Don't fail the build, just warn
}

const config = {
  baseUrl,
  apiKey,
}

const configPath = path.join(process.cwd(), '.z-ai-config')
fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
console.log(`✓ .z-ai-config written to ${configPath}`)
console.log(`  baseUrl: ${baseUrl}`)
console.log(`  apiKey: ${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`)
