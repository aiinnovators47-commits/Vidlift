import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite'
const API_KEY = process.env.GEMINI_API_KEY || process.env.GENERATIVE_API_KEY || ''

async function callGemini(prompt: string, model = DEFAULT_MODEL): Promise<{ text: string; used?: string }> {
  if (!API_KEY) throw new Error('Missing GEMINI_API_KEY in environment')
  
  // Use the correct Gemini API format
  const modelName = model.includes('/') ? model : `models/${model}`
  
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
      maxOutputTokens: 1024,
    },
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      }
    ]
  }

  // Try the correct API versions
  const endpoints = [
    `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent`,
    `https://generativelanguage.googleapis.com/v1/${modelName}:generateContent`
  ]
  let lastError = ''
  
  for (let i = 0; i < endpoints.length; i++) {
    const url = endpoints[i]
    const version = i === 0 ? 'v1beta' : 'v1'
    try {
      const fullUrl = `${url}?key=${encodeURIComponent(API_KEY)}`
      
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        lastError = `${version} ${response.status}: ${errorText}`
        console.log(`Failed with ${version}, trying next...`, lastError)
        continue
      }

      const data = await response.json()
      
      // Extract text from the new API response format
      const candidate = data?.candidates?.[0]
      const content = candidate?.content?.parts?.[0]?.text
      
      if (content) {
        return { 
          text: content, 
          used: `${version}/${modelName}` 
        }
      } else {
        throw new Error(`No content in response: ${JSON.stringify(data)}`)
      }
      
    } catch (error: any) {
      lastError = `${version}: ${error.message}`
      console.log(`Error with ${version}:`, error.message)
      continue
    }
  }
  
  // If both versions fail, provide detailed error
  const errorMsg = `Gemini API failed for all endpoints. Last error: ${lastError}`
  console.error('Gemini API Error Details:', {
    apiKey: API_KEY ? `${API_KEY.substring(0, 10)}...` : 'missing',
    model: modelName,
    endpoints: endpoints,
    lastError
  })
  throw new Error(errorMsg)
}

function extractJSONFromText(text: string) {
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { keyword, channelData, videoType = 'long', bestVideos = [] } = body

    if (!keyword) {
      return NextResponse.json({ error: 'Keyword is required' }, { status: 400 })
    }

    if (!API_KEY) {
      return NextResponse.json({ 
        error: 'Missing GEMINI_API_KEY environment variable. Please add GEMINI_API_KEY to your .env.local file.',
        hint: 'Get your API key from https://aistudio.google.com/app/apikey'
      }, { status: 400 })
    }

    // Validate API key format
    if (!API_KEY.startsWith('AIza')) {
      return NextResponse.json({ 
        error: 'Invalid GEMINI_API_KEY format. API key should start with "AIza"',
        hint: 'Check your API key from https://aistudio.google.com/app/apikey'
      }, { status: 400 })
    }

    // Build context from channel data
    let contextInfo = ''
    if (channelData) {
      contextInfo += `Channel: ${channelData.title}\n`
      if (channelData.description) {
        contextInfo += `Channel Description: ${channelData.description.substring(0, 200)}...\n`
      }
      contextInfo += `Subscribers: ${channelData.subscriberCount || 'Unknown'}\n`
      contextInfo += `Total Videos: ${channelData.videoCount || 'Unknown'}\n`
    }

    // Add best performing videos context
    if (bestVideos && bestVideos.length > 0) {
      contextInfo += `\nTop Performing Videos:\n`
      bestVideos.slice(0, 5).forEach((video: any, index: number) => {
        contextInfo += `${index + 1}. "${video.title}" - ${video.viewCount || 0} views\n`
      })
    }

    const videoTypeContext = videoType === 'short' ? 
      'YouTube Shorts (vertical, under 60 seconds)' : 
      'Long-form YouTube video'

    const prompt = `You are a professional YouTube content strategist. Generate a compelling title and description for a ${videoTypeContext} about "${keyword}".

Context:
${contextInfo}

Requirements:
- Title: 60 characters or less, engaging, SEO-optimized, includes the keyword
- Description: 150-250 words, engaging, includes call-to-action, SEO-friendly
- Match the channel's style and audience
- Use proven YouTube engagement tactics
- Include relevant hashtags in description

Return ONLY a JSON object with this structure:
{
  "title": "Generated title here",
  "description": "Generated description here with hashtags",
  "tags": ["tag1", "tag2", "tag3"],
  "reasoning": "Brief explanation of strategy used"
}

Keyword: "${keyword}"
Video Type: ${videoTypeContext}`

    let raw: string
    let usedModel: string | undefined
    try {
      const out = await callGemini(prompt, body.model || DEFAULT_MODEL)
      raw = out.text
      usedModel = out.used
    } catch (e: any) {
      console.error('Gemini API failed:', e)
      
      // Enhanced fallback generation based on video type and context
      const isShort = videoType === 'short'
      const titleTemplates = isShort ? [
        `${keyword} in 60 Seconds! 🔥`,
        `Quick ${keyword} Hacks 💡`,
        `${keyword} Made Simple ⚡`,
        `Master ${keyword} Fast! 🚀`
      ] : [
        `The Complete ${keyword} Guide`,
        `${keyword}: Everything You Need to Know`,
        `Master ${keyword} - Step by Step Tutorial`,
        `${keyword} Explained: Professional Tips & Tricks`
      ]
      
      const randomTitle = titleTemplates[Math.floor(Math.random() * titleTemplates.length)]
      
      const descriptionTemplate = isShort 
        ? `Quick and actionable ${keyword} tips that you can implement right away! ⚡\n\n🔥 Perfect for busy people who want results fast\n💡 Save this for later!\n🚀 Follow for more quick tips\n\n#${keyword.replace(/\s+/g, '')} #Shorts #QuickTips #Tutorial`
        : `Discover everything you need to know about ${keyword} in this comprehensive guide! 🎯\n\nIn this video, we'll cover:\n✅ Key concepts and fundamentals\n✅ Best practices and pro tips\n✅ Common mistakes to avoid\n✅ Real-world examples\n\n🔔 Subscribe for more valuable content!\n💬 Share your thoughts in the comments below\n👍 Like if this helped you!\n\n#${keyword.replace(/\s+/g, '')} #Tutorial #Guide #Tips`
      
      // Add channel-specific context if available
      let enhancedDescription = descriptionTemplate
      if (channelData?.title) {
        enhancedDescription += `\n\n📺 Welcome to ${channelData.title}!`
      }
      
      return NextResponse.json({
        title: randomTitle,
        description: enhancedDescription,
        tags: [keyword, isShort ? 'shorts' : 'tutorial', 'guide', 'tips', 'howto'],
        reasoning: 'Smart fallback generation with enhanced templates',
        usedFallback: true,
        error: e?.message || String(e)
      })
    }

    // Try to parse JSON from response
    let parsed = extractJSONFromText(String(raw))
    
    if (!parsed || !parsed.title) {
      // If parsing failed, try to extract manually
      const lines = raw.split('\n').filter(l => l.trim())
      const titleLine = lines.find(l => l.toLowerCase().includes('title'))
      const descLine = lines.find(l => l.toLowerCase().includes('description'))
      
      return NextResponse.json({
        title: titleLine ? titleLine.replace(/title:?/i, '').trim() : `Amazing ${keyword} Content`,
        description: descLine ? descLine.replace(/description:?/i, '').trim() : `Discover the best ${keyword} tips and tricks in this video!`,
        tags: [keyword, 'tutorial', 'guide'],
        reasoning: 'Manual extraction from AI response',
        usedModel: usedModel || null,
        rawResponse: raw
      })
    }

    // Validate and clean the response
    const result = {
      title: parsed.title || `${keyword} - Professional Content`,
      description: parsed.description || `Learn about ${keyword} in this comprehensive guide.`,
      tags: parsed.tags || [keyword, 'tutorial', 'guide'],
      reasoning: parsed.reasoning || 'AI-generated content strategy',
      usedModel: usedModel || null
    }

    // Ensure title is not too long
    if (result.title.length > 100) {
      result.title = result.title.substring(0, 97) + '...'
    }

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Content generation error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to generate content',
      tried: error?.tried || null
    }, { status: 500 })
  }
}