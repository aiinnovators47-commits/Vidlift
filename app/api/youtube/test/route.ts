import { NextRequest, NextResponse } from "next/server"

// Test endpoint - uses runtime API key and network calls
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    console.log('[YouTube Test] API test executed at runtime:', new Date().toISOString())
    // Test YouTube API connectivity
    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "YouTube API key not configured" }, { status: 500 })
    }

    // Test with a known public channel (Google Developers)
    const testChannelId = "UC_x5XG1OV2P6uZZ5FSM9Ttw"
    const testResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${testChannelId}&key=${apiKey}`
    )

    if (!testResponse.ok) {
      const error = await testResponse.json()
      return NextResponse.json(
        { error: "Failed to connect to YouTube API", details: error },
        { status: testResponse.status }
      )
    }

    const testData = await testResponse.json()

    return NextResponse.json({
      success: true,
      message: "YouTube API connection successful",
      channel: testData.items?.[0] ? {
        id: testData.items[0].id,
        title: testData.items[0].snippet.title,
        subscriberCount: testData.items[0].statistics.subscriberCount,
      } : null,
    })
  } catch (error: any) {
    console.error("YouTube API Test Error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}