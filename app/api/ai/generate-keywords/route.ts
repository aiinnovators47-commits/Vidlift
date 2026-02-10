import { NextResponse } from 'next/server'

type ReqBody = {
  text?: string
  texts?: string[]
  topK?: number
  model?: string
}

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite'
const API_KEY = process.env.GEMINI_API_KEY || process.env.GENERATIVE_API_KEY || ''

async function callGemini(prompt: string, model = DEFAULT_MODEL): Promise<{ text: string; used?: string }> {
  if (!API_KEY) throw new Error('Missing GEMINI_API_KEY in environment')
  // Normalize model: the URL already includes `/models/{model}` so candidate should be the model id
  const normalize = (m: string) => m.replace(/^models\//i, '').trim()
  const base = normalize(model)
  const candidates = new Set<string>()
  candidates.add(base)
  if (!base.includes('@')) candidates.add(`${base}@latest`)
  // Add a couple of common fallback model ids (without 'models/' prefix)
  candidates.add('gemini-2.5-flash-lite')
  candidates.add('gemini-1.5-flash')

  const body = {
    prompt: { text: prompt },
    temperature: 0.2,
    maxOutputTokens: 512,
  }

  let lastErrText = ''
  const tried: string[] = []
  // Try both v1 (new) and v1beta2 endpoints to support different project configurations.
  const versions = ['v1', 'v1beta2']
  for (const candidateModel of candidates) {
    for (const version of versions) {
      const url = `https://generativelanguage.googleapis.com/${version}/models/${encodeURIComponent(candidateModel)}:generateText?key=${encodeURIComponent(API_KEY)}`
      try {
        tried.push(`${version}/${candidateModel}`)
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        if (!res.ok) {
          const t = await res.text()
          lastErrText = `model=${candidateModel} version=${version} status=${res.status} body=${t}`
          // Try next candidate for 404 specifically; for other errors keep trying but record
          if (res.status === 404) continue
          continue
        }

        const json = await res.json()
        // Response shapes vary; attempt to extract primary text
        const candidate = (json?.candidates && json.candidates[0]?.content) || json?.candidates?.[0]?.output || json?.output?.[0]?.content || json?.candidates?.[0]?.message || json?.text || json?.candidates?.[0]
        return { text: String(candidate || JSON.stringify(json)), used: `${version}/${candidateModel}` }
      } catch (e: any) {
        lastErrText = String(e?.message || e)
        continue
      }
    }
  }

  // If we reach here none of the candidate model paths succeeded — throw an error so caller can handle HTTP response
  const msg = `Gemini API model not found or requests failed for model '${model}'. Last error: ${lastErrText}`
  const err = new Error(msg)
  // @ts-ignore attach metadata for upstream handlers
  ;(err as any).tried = tried
  throw err
}

function extractJSONFromText(text: string) {
  // Try to locate a JSON array or object in the returned text
  const start = text.indexOf('{')
  const startArr = text.indexOf('[')
  let i = -1
  if (start === -1 && startArr === -1) return null
  if (start === -1) i = startArr
  else if (startArr === -1) i = start
  else i = Math.min(start, startArr)

  try {
    const candidate = text.slice(i)
    return JSON.parse(candidate)
  } catch (e) {
    return null
  }
}

function extractKeywordsFromText(text: string, topK = 25) {
  if (!text) return []
  // Basic heuristic keyword extractor: remove URLs/punctuation, lowercase, count unigrams and bigrams
  const stopwords = new Set([
    'the','and','for','with','that','this','from','your','you','are','have','has','was','were','what','when','where','how','why','but','not','can','will','all','our','out','new','video','videos','watch','youtube','channel'
  ])

  const cleaned = text.replace(/https?:\/\/\S+/gi, ' ').replace(/[^a-zA-Z0-9\s]/g, ' ').toLowerCase()
  const tokens = cleaned.split(/\s+/).filter(Boolean)
  const counts = new Map<string, number>()
  for (let i = 0; i < tokens.length; i++) {
    const w = tokens[i]
    if (w.length <= 1 || stopwords.has(w)) continue
    counts.set(w, (counts.get(w) || 0) + 1)
    if (i + 1 < tokens.length) {
      const bi = `${w} ${tokens[i + 1]}`
      if (!stopwords.has(tokens[i + 1])) counts.set(bi, (counts.get(bi) || 0) + 1)
    }
  }

  const arr = Array.from(counts.entries()).map(([k, v]) => ({ keyword: k, score: v }))
  arr.sort((a, b) => b.score - a.score || a.keyword.length - b.keyword.length)
  return arr.slice(0, topK).map((it) => ({ keyword: it.keyword, reason: 'extracted', score: Math.min(100, it.score * 10) }))
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ReqBody
    const topK = body.topK || 25

    let source = ''
    if (Array.isArray(body.texts)) source = body.texts.join('\n')
    else if (typeof body.text === 'string') source = body.text
    else return NextResponse.json({ error: 'No text supplied' }, { status: 400 })

    // Validate environment early and return a helpful 400 if missing
    if (!API_KEY) {
      return NextResponse.json({ error: 'Missing GEMINI_API_KEY environment variable. Add GEMINI_API_KEY to your .env.local or environment.' }, { status: 400 })
    }

    // Build a prompt instructing the model to return JSON array of keywords
    const prompt = `You are given many YouTube video titles, tags and descriptions. Extract the top ${topK} concise trending keywords or short phrases (1-3 words) that are actionable for creators. Return a JSON object with the shape: { "keywords": [{ "keyword": "...", "reason": "short note" , "score": 0-100 } ] }. Use only valid JSON in the output with no extra commentary. Input:\n\n"""\n${source}\n"""\n` 

    let raw: string
    let usedModel: string | undefined
    try {
      const out = await callGemini(prompt, body.model || DEFAULT_MODEL)
      raw = out.text
      usedModel = out.used
    } catch (e: any) {
      // If Gemini failed (model not available / key issue), fall back to internal extractor
      const tried = e?.tried || null
      const fallback = extractKeywordsFromText(source, topK)
      return NextResponse.json({ keywords: fallback, usedFallback: true, error: e?.message || String(e), tried }, { status: 200 })
    }

    // Try to parse JSON directly
    let parsed = extractJSONFromText(String(raw))
    if (!parsed) {
      // As a fallback, attempt to parse simple newline lists into keywords
      const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
      const simple = lines.slice(0, topK).map(l => ({ keyword: l.replace(/^\d+\.|[-–—]/g, '').trim(), reason: '', score: 0 }))
      return NextResponse.json({ keywords: simple, usedFallback: false, usedModel: usedModel || null })
    }

    // Normalize parsed shape
    if (Array.isArray(parsed)) {
      // If model returned array of strings
      const arr = parsed.slice(0, topK).map((k: any) => (typeof k === 'string' ? { keyword: k, reason: '', score: 0 } : k))
      return NextResponse.json({ keywords: arr, usedFallback: false, usedModel: usedModel || null })
    }

    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.keywords)) {
      const kws = parsed.keywords.slice(0, topK)
      return NextResponse.json({ keywords: kws, usedFallback: false, usedModel: usedModel || null })
    }

    // Unexpected shape, return what we can
    return NextResponse.json({ keywords: parsed, usedFallback: false, usedModel: usedModel || null }, { status: 200 })
  } catch (err: any) {
    // If callGemini attached 'tried' metadata, surface it and use 502
    const tried = err?.tried || null
    const msg = err?.message || String(err)
    if (tried) {
      return NextResponse.json({ error: msg, tried }, { status: 502 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
