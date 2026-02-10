import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function GET(request: NextRequest) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
    
    // This would list available models, but the SDK doesn't expose this method directly
    // So we'll test common working models
    
    const testModels = [
      'models/gemini-pro',
      'models/gemini-1.5-pro',
      'models/gemini-1.5-flash',
      'gemini-pro',
      'gemini-1.5-pro',
      'gemini-1.5-flash'
    ]
    
    const results = []
    
    for (const modelName of testModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName })
        // Test with a simple prompt
        const result = await model.generateContent('Say "hello"')
        results.push({
          model: modelName,
          status: 'working',
          response: await result.response.text()
        })
      } catch (error: any) {
        results.push({
          model: modelName,
          status: 'failed',
          error: error.message
        })
      }
    }
    
    return NextResponse.json({
      api_key_configured: !!process.env.GEMINI_API_KEY,
      tested_models: results
    })
    
  } catch (error: any) {
    return NextResponse.json({
      error: 'Failed to test models',
      message: error.message
    }, { status: 500 })
  }
}