import { NextResponse } from 'next/server'

const API_KEY = process.env.GEMINI_API_KEY || process.env.GENERATIVE_API_KEY || ''
const RAW_MODEL = process.env.GEMINI_MODEL || ''

function normalizeModel(m: string) {
  if (!m) return ''
  return m.replace(/^models\//i, '').trim()
}

export async function GET() {
  return NextResponse.json({
    hasGeminiKey: Boolean(API_KEY),
    configuredModelRaw: RAW_MODEL || null,
    configuredModelNormalized: normalizeModel(RAW_MODEL) || null,
  })
}
