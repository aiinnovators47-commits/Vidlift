import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const API_KEY = process.env.GEMINI_API_KEY || process.env.GENERATIVE_API_KEY || ''
  
  if (!API_KEY) {
    return NextResponse.json({ 
      error: 'No API key found',
      keys: {
        GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
        GENERATIVE_API_KEY: !!process.env.GENERATIVE_API_KEY
      }
    }, { status: 400 })
  }

  // Test the new Gemini API with a simple prompt
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${encodeURIComponent(API_KEY)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Say hello in JSON format: {"message": "hello"}'
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 100,
        }
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({
        success: false,
        error: `API Error ${response.status}: ${errorText}`,
        apiKeyPresent: true
      })
    }

    const data = await response.json()
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text

    return NextResponse.json({
      success: true,
      message: 'Gemini API is working correctly!',
      testResponse: content,
      apiKeyPresent: true
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      apiKeyPresent: true
    })
  }
}