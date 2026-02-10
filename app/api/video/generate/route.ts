import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // Helper: fetch with timeout using AbortController
  const fetchWithTimeout = async (url: string, opts: any = {}, timeoutMs = 8000) => {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(url, { ...opts, signal: controller.signal })
      clearTimeout(id)
      return res
    } catch (err) {
      clearTimeout(id)
      throw err
    }
  }

  try {
    const body = await request.json()
    const { title, keywords } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Provider selection: prefer explicit PREFERRED_PROVIDER, then OpenAI if configured, otherwise Gemini if configured.
    const PREFERRED = (process.env.PREFERRED_PROVIDER || '').toLowerCase()
    const hasOpenAI = !!process.env.OPENAI_API_KEY
    const hasGemini = !!process.env.GEMINI_API_KEY
    let provider: 'openai' | 'gemini' = 'openai'
    if (PREFERRED === 'gemini') provider = 'gemini'
    else if (PREFERRED === 'openai') provider = 'openai'
    else if (hasOpenAI) provider = 'openai'
    else if (hasGemini) provider = 'gemini'

    const apiKey = provider === 'openai' ? process.env.OPENAI_API_KEY : process.env.GEMINI_API_KEY
    const model = provider === 'openai' ? (process.env.OPENAI_MODEL || 'gpt-4o-mini') : (process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite')

    if (!apiKey) {
      console.error('Generation configuration error: API key missing')
      return NextResponse.json({ error: 'Generation API key not configured' }, { status: 500 })
    }

    // Validate keys depending on provider
    if (provider === 'openai' && apiKey.startsWith('AIza')) {
      console.error('Detected a Google API key while OpenAI provider is selected. Either set PREFERRED_PROVIDER=gemini or provide a valid OpenAI key as OPENAI_API_KEY')
      return NextResponse.json({ error: 'Incorrect API key type for OpenAI provider (looks like a Google API key).'}, { status: 500 })
    }

    if (provider === 'gemini' && !apiKey.startsWith('AIza')) {
      console.error('Gemini provider selected but GEMINI_API_KEY does not look like a Google API key')
      return NextResponse.json({ error: 'GEMINI_API_KEY appears invalid. Ensure you have created a Generative API key in Google Cloud.'}, { status: 500 })
    }

    // Compose a prompt for generating viral SEO titles
    const prompt = `You are an SEO expert. Generate 3 concise, clickable, SEO-optimized YouTube titles (short, emotional, keyword-rich) for the following video: "${title}". Use the keywords if provided: ${keywords ? keywords.join(', ') : 'none'}. Return a JSON array of titles only.`

    // Call the selected provider
    let text = ''
    const warnings: string[] = []

    if (provider === 'openai') {
      // Call OpenAI Responses API
      let response
      try {
        response = await fetchWithTimeout('https://api.openai.com/v1/responses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            input: prompt,
            max_tokens: 200,
            temperature: 0.8,
          }),
        }, 10000)
      } catch (fetchErr: any) {
        console.error('OpenAI request failed:', fetchErr)
        return NextResponse.json({ titles: [], warnings: ['OpenAI request failed or timed out'] }, { status: 200 })
      }

      if (!response.ok) {
        const txt = await response.text().catch(() => '')
        console.error('OpenAI returned non-OK:', response.status, txt)
        return NextResponse.json({ titles: [], warnings: [`OpenAI returned status ${response.status}`] }, { status: 200 })
      }

      let json: any
      try {
        json = await response.json()
      } catch (parseErr: any) {
        console.error('Failed to parse OpenAI JSON:', parseErr)
        return NextResponse.json({ titles: [], warnings: ['Failed to parse OpenAI response'] }, { status: 200 })
      }

      // Extract text from OpenAI response
      if (json.output) {
        if (Array.isArray(json.output) && json.output[0]?.content) {
          const parts = json.output.map((o: any) => (o.content || '')).join('\n')
          text = parts
        } else if (typeof json.output === 'string') {
          text = json.output
        }
      }

      if (!text && json.choices && json.choices[0]?.message?.content) {
        text = json.choices[0].message.content
      }

    } else {
        // Gemini (Google Generative Language API)
      // Use same pattern as other Gemini endpoints in the repo
      const modelName = model.includes('/') ? model : `models/${model}`
      const endpoints = [
        `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent`,
        `https://generativelanguage.googleapis.com/v1/${modelName}:generateContent`
      ]

      // Use the user-provided Gemini prompt — request 5 options (Title, Hashtags, Summary each)
      const geminiPromptBase = `You are a YouTube SEO expert.

Task:
Generate 5 DISTINCT HIGH-PERFORMING YouTube video titles for the Topic: ${title}

Rules:
1. Provide exactly 5 title options.
2. Title length: 55–65 characters.
3. Each option must include at least 2 power words (Secret, Proven, Ultimate, Shocking, Fast, etc.) and a clear benefit.
4. For each option provide 5–7 relevant hashtags.
5. Provide a concise summary for each option STRICTLY under 100 characters (do NOT exceed 100 characters).

Output format (repeat for each option):
1) Title: <title text>
   Hashtags: #tag1 #tag2 #tag3 ...
   Summary: <under 100 chars>

Return the 5 options only.`

      const makeRequestBody = (p: string) => ({
        contents: [{ parts: [{ text: p }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800
        }
      })

      // Try up to 2 attempts (initial, then strict mode for long summaries)
      let lastErr = ''
      for (let attempt = 0; attempt < 2; attempt++) {
        const bodyPrompt = attempt === 0 ? geminiPromptBase : geminiPromptBase + '\n\nSTRICT MODE: If any summary exceeds 100 characters, regenerate only the summaries to be under 100 characters.'

        // Call endpoints
        let got = ''
        for (let i = 0; i < endpoints.length; i++) {
          const url = `${endpoints[i]}?key=${encodeURIComponent(apiKey)}`
          try {
            const res = await fetchWithTimeout(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(makeRequestBody(bodyPrompt))
            }, 15000)

            if (!res.ok) {
              const errTxt = await res.text().catch(() => '')
              lastErr = `${res.status}: ${errTxt}`
              console.error(`Gemini endpoint ${i} returned non-OK:`, lastErr)
              continue
            }

            const data = await res.json()
            const candidate = data?.candidates?.[0]
            const content = candidate?.content?.parts?.[0]?.text || candidate?.output || candidate?.content || ''
            if (content) {
              got = String(content)
              break
            } else {
              lastErr = `No content in response: ${JSON.stringify(data)}`
              console.error('Gemini response missing content:', data)
              continue
            }
          } catch (e: any) {
            lastErr = e.message || String(e)
            console.error('Gemini request error:', lastErr)
            continue
          }
        }

        if (!got) continue

        // Extract items using regex Title/Hashtags/Summary groups
        const items: Array<{ title: string; hashtags: string[]; summary: string; raw: string }> = []
        // Use [\s\S] in place of . when dotAll (s) flag is not available (older TS targets)
        const itemRegex = /(?:\d+\)|\d+\.)?\s*Title:\s*([\s\S]+?)\s*(?:\r?\n)\s*Hashtags:\s*([#\w\s,\-\#\@]+?)\s*(?:\r?\n)\s*Summary:\s*([\s\S]+?)(?=\r?\n\s*(?:\d+\)|\d+\.|$))/gi
        let m: RegExpExecArray | null
        while ((m = itemRegex.exec(got)) !== null) {
          const t = (m[1] || '').trim()
          const tagsRaw = (m[2] || '').trim()
          const s = (m[3] || '').trim()
          const tags = tagsRaw.split(/[,\s]+/).map(tg => tg.trim()).filter(Boolean).map(tg => tg.startsWith('#') ? tg : '#' + tg.replace(/[^\w]/g, ''))
          items.push({ title: t, hashtags: tags.slice(0, 7), summary: s, raw: m[0] })
        }

        // Fallback parsing if regex didn't match
        if (items.length === 0) {
          const lines = got.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
          let cur: any = null
          for (const ln of lines) {
            if (/^\d+\)/.test(ln) || /^\d+\./.test(ln)) {
              if (cur) items.push(cur)
              cur = { title: '', hashtags: [], summary: '', raw: '' }
              const after = ln.replace(/^\d+\)\s*/,'').replace(/^\d+\.\s*/,'')
              if (/^title:/i.test(after)) cur.title = after.replace(/^title:\s*/i,'').trim()
              else cur.title = after
            } else if (/^title:/i.test(ln)) {
              if (!cur) cur = { title: '', hashtags: [], summary: '', raw: '' }
              cur.title = ln.replace(/^title:\s*/i,'').trim()
            } else if (/^hashtags:/i.test(ln)) {
              if (!cur) cur = { title: '', hashtags: [], summary: '', raw: '' }
              cur.hashtags = ln.replace(/^hashtags:\s*/i,'').split(/[,\s]+/).map(tg => tg.trim()).filter(Boolean).map(tg => tg.startsWith('#') ? tg : '#' + tg.replace(/[^\w]/g, ''))
            } else if (/^summary:/i.test(ln)) {
              if (!cur) cur = { title: '', hashtags: [], summary: '', raw: '' }
              cur.summary = ln.replace(/^summary:\s*/i,'').trim()
            }
          }
          if (cur) items.push(cur)
        }

        const results = items.slice(0, 5)

        // If any summary too long on first attempt, retry
        const longSummaries = results.filter(r => r.summary && r.summary.length >= 100)
        if (longSummaries.length > 0 && attempt === 0) continue

        // Trim any still-too-long summaries and add warnings
        const warnings: string[] = []
        results.forEach(r => {
          if (r.summary && r.summary.length >= 100) {
            r.summary = r.summary.substring(0, 97).trim() + '...'
            warnings.push('Some summaries were trimmed to under 100 characters')
          }
        })

        return NextResponse.json({
          titles: results.map(r => r.title),
          generated: results,
          warnings
        }, { status: 200 })
      }

      // If we reach here, all attempts failed
      console.error('Gemini failed for all endpoints or parsing failed. Last error:', lastErr)
      return NextResponse.json({ titles: [], warnings: ['Gemini generation failed or returned unparsable content'] }, { status: 200 })
    }

    // Try to parse JSON array from text
    let titles: string[] = []
    try {
      // Some responses may be plain text with lines; try to extract quoted lines
      const possibleJson = (text || '').trim()
      if (!possibleJson) {
        warnings.push('Generation returned empty text')
      } else if (possibleJson.startsWith('[')) {
        titles = JSON.parse(possibleJson)
      } else {
        // Split by new lines and remove prefixes
        titles = possibleJson.split(/\r?\n/).map((l: string) => l.replace(/^\W*\d+\W*/,'').trim()).filter(Boolean)
      }
    } catch (err: any) {
      console.error('Failed to extract titles from generation output:', err)
      // last resort: include the raw text as a single suggestion (non-fake)
      if (text && text.trim()) titles = [text.trim()]
      else warnings.push('Could not extract titles from generation response')
    }

    // Return results, include warnings if any. Use 200 so frontend can gracefully handle partial results.
    return NextResponse.json({ titles, warnings }, { status: 200 })
  } catch (err: any) {
    console.error('Error in /api/video/generate:', err)
    return NextResponse.json({ error: 'Generation failed', message: err.message || String(err) }, { status: 500 })
  }
}
