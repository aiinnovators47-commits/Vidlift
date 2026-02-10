import { NextRequest, NextResponse } from "next/server"

// Uses req.url for query params - must run dynamically
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    console.log('[YouTube ResolveHandle] Route executed at runtime:', new Date().toISOString())
    const { searchParams } = new URL(req.url)
    const handle = searchParams.get("handle")

    if (!handle) {
      return NextResponse.json({ error: "Handle is required" }, { status: 400 })
    }

    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "YouTube API key not configured" }, { status: 500 })
    }

    // If it's already a channel ID, return it as-is
    if (handle.match(/^UC[a-zA-Z0-9_-]{22}$/)) {
      return NextResponse.json({
        success: true,
        channelId: handle
      })
    }

    // Try to search for the channel by forHandle (custom URL)
    // First, try with @ prefix
    const searchQuery = handle.startsWith('@') ? handle : `@${handle}`
    
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(searchQuery)}&key=${apiKey}&maxResults=1`
    )

    if (!searchResponse.ok) {
      const error = await searchResponse.json()
      return NextResponse.json(
        { error: "Failed to search for channel", details: error },
        { status: searchResponse.status }
      )
    }

    const searchData = await searchResponse.json()

    if (!searchData.items || searchData.items.length === 0) {
      // Try without @ prefix if it failed
      const fallbackResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(handle)}&key=${apiKey}&maxResults=1`
      )

      if (!fallbackResponse.ok) {
        return NextResponse.json(
          { error: "Channel not found" },
          { status: 404 }
        )
      }

      const fallbackData = await fallbackResponse.json()
      if (!fallbackData.items || fallbackData.items.length === 0) {
        return NextResponse.json(
          { error: "Channel not found" },
          { status: 404 }
        )
      }

      const channelId = fallbackData.items[0].id.channelId
      return NextResponse.json({
        success: true,
        channelId: channelId
      })
    }

    const channelId = searchData.items[0].id.channelId

    return NextResponse.json({
      success: true,
      channelId: channelId
    })
  } catch (error: any) {
    console.error("[YouTube ResolveHandle] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to resolve channel handle" },
      { status: 500 }
    )
  }
}
