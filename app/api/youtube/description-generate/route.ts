import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GENERATIVE_API_KEY || ''
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp'

async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY in environment')
  }

  const modelName = DEFAULT_MODEL.includes('/') ? DEFAULT_MODEL : `models/${DEFAULT_MODEL}`
  
  const requestBody = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    }
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text
  
  if (!content) {
    throw new Error('No content in Gemini response')
  }

  return content
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, keywords = [] } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ 
        error: 'Missing GEMINI_API_KEY environment variable',
        hint: 'Get your API key from https://aistudio.google.com/app/apikey'
      }, { status: 400 })
    }

    // Construct the prompt using the exact format provided by the user
    const prompt = `Act as a professional movie recap content strategist, YouTube SEO expert, and viral storytelling writer.

TITLE:
${title}

TASK:
Generate a complete YouTube-ready description using the EXACT format below. This is for MOVIE RECAP videos only.

FORMAT RULES (IMPORTANT):
- Do NOT add headings like "Intro", "Conclusion", "What you'll discover", or bullet points
- Do NOT use emojis anywhere (no 📄, 🔗, 🔍, #️⃣)
- Keep language simple, clear, and natural
- Write in fluent English (US audience)
- Storytelling tone, suspenseful but not clickbait
- Length-balanced, retention-focused
- Write in paragraph form for the description section

STRUCTURE (FOLLOW STRICTLY):

1) 📄 DESCRIPTION

Write 2–3 strong opening lines that introduce the story without revealing spoilers.
Explain the plot progression briefly with emotional and psychological depth.
Create curiosity and encourage viewers to watch till the end.
End with a subtle call-to-action like "Watch till the end to see how one small moment changes everything."

(Write this in paragraph form, NOT bullet points. Focus on the movie's story, characters, and themes.)

2) 🔗 SOCIAL MEDIA LINKS

Instagram: https://instagram.com/yourusername
Twitter (X): https://twitter.com/yourusername
Facebook: https://facebook.com/yourpage
Telegram: https://t.me/yourchannel

3) 🔍 SEO TAGS (41)

Generate exactly 40–42 highly relevant, comma-separated SEO tags based on the title and genre.
Include variations like:
- movie recap
- movie explained
- full story
- character arc
- genre-specific terms (thriller, action, drama, etc.)
- audience-search-friendly phrases
- movie summary, cinema recap, film explanation, etc.

4) #️⃣ HASHTAGS (22)

Generate 20–25 relevant hashtags optimized for YouTube discovery.
Mix broad and niche hashtags.
Avoid repeating the same word excessively.
Examples: #MovieRecap #MovieExplained #ActionThriller #FilmSummary #StoryExplained

IMPORTANT:
- This is a MOVIE RECAP video format ONLY
- Maintain the same format every time
- Do not add extra text before or after the output
- The description must tell the movie's story, NOT explain cooking, tutorials, or how-to content
- Focus on plot, characters, suspense, and emotional journey`

    // Call Gemini API
    const generatedContent = await callGemini(prompt)

    return NextResponse.json({ 
      description: generatedContent,
      success: true 
    })

  } catch (error: any) {
    console.error('Description generation error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to generate description',
      success: false
    }, { status: 500 })
  }
}
