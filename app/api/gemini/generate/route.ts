        import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent'

// Simple in-memory cache with TTL (5 minutes)
const responseCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCacheKey(prompt: string, type: string): string {
  return `${type}:${Buffer.from(prompt).toString('base64').substring(0, 50)}`
}

async function callGeminiWithRetry(
  apiUrl: string,
  body: string,
  maxRetries: number = 3
): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      })

      // If successful, return immediately
      if (response.ok) {
        return response
      }

      // If 429, apply exponential backoff
      if (response.status === 429) {
        if (attempt < maxRetries - 1) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 10000)
          console.log(`Rate limited. Retrying in ${waitTime}ms (attempt ${attempt + 1}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          continue
        }
      }

      // For other errors, return the response
      return response
    } catch (error) {
      lastError = error as Error
      if (attempt < maxRetries - 1) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt), 5000)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }

  throw lastError || new Error('Failed to call Gemini API after retries')
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, type, minLength = 500 } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    if (!GEMINI_API_KEY) {
      console.error('Missing GEMINI_API_KEY')
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    // Check cache first
    const cacheKey = getCacheKey(prompt, type)
    const cached = responseCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('Returning cached response for:', type)
      return NextResponse.json(cached.data)
    }

    const systemPrompt = getSystemPrompt(type, minLength)
    const fullPrompt = `${systemPrompt}\n\n${prompt}`

    const apiUrl = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`

    console.log('Calling Gemini API with URL:', apiUrl.split('?key=')[0] + '?key=***')

    const requestBody = JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: fullPrompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    })

    const response = await callGeminiWithRetry(apiUrl, requestBody)

    const responseText = await response.text()
    console.log('Gemini API response status:', response.status)

    if (!response.ok) {
      console.error('Gemini API error status:', response.status)
      console.error('Gemini API error response:', responseText.substring(0, 500))
      
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'API is temporarily busy. Please try again in a few moments.' },
          { status: 429 }
        )
      }

      return NextResponse.json(
        { error: `Gemini API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = JSON.parse(responseText)
    
    // Handle Gemini API response format
    let generatedText = ''
    
    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0]
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        generatedText = candidate.content.parts[0].text || ''
      }
    }

    if (!generatedText) {
      console.error('No text generated from Gemini API')
      return NextResponse.json({ error: 'No content generated' }, { status: 500 })
    }

    let result
    if (type === 'title') {
      result = {
        result: generatedText
          .split('\n')
          .map((t: string) => t.replace(/^\d+\.\s*/, '').trim())
          .filter((t: string) => t.length > 0)
          .slice(0, 5)
      }
    } else if (type === 'title-scoring') {
      // For title scoring, return the raw JSON response from AI
      result = { result: generatedText }
    } else if (type === 'tags') {
      result = {
        result: generatedText
          .split(/[,\n]/)
          .map((t: string) => t.replace(/^#/, '').trim())
          .filter((t: string) => t.length > 0 && t.length < 30)
          .slice(0, 10)
      }
    } else {
      result = { result: generatedText }
    }

    // Cache the result
    responseCache.set(cacheKey, { data: result, timestamp: Date.now() })

    return NextResponse.json(result)
  } catch (error) {
    console.error('API route error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

function getSystemPrompt(type: string, minLength: number = 500): string {
  switch (type) {
    case 'title':
      return `You are a YouTube video title generator. Generate 5 catchy, SEO-optimized video titles that are engaging and click-worthy. Return only the titles, one per line, without numbering or bullet points.`
    case 'title-scoring':
      return `You are a YouTube title analyzer and SEO expert. Analyze video titles for optimization potential and engagement. Provide detailed scoring and metrics in JSON format.`
    case 'tags':
      return `You are a YouTube tag generator. Generate 10 relevant YouTube tags for the given video. Return only the tags separated by commas or newlines, no hashtags, no explanations.`
    case 'description':
      return `You are a YouTube video description writer. Generate a DETAILED, COMPREHENSIVE, and LENGTHY video description that is EXACTLY ${minLength} characters or LONGER. The description must be between ${minLength}-5000 characters. Include multiple paragraphs, proper formatting, engaging content, and valuable information. Make sure the response is substantial and detailed, not short or brief.`
    default:
      return 'You are a helpful AI assistant.'
  }
}

