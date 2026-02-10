import { NextRequest, NextResponse } from "next/server"

// This route reads runtime request details (e.g. `req.url`) so it must run dynamically.
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    console.log('[YouTube Trending] Route executed at runtime:', new Date().toISOString())
    const { searchParams } = new URL(req.url)
    const regionCode = searchParams.get("regionCode") || "US"
    const maxResults = searchParams.get("maxResults") || "50"

    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "YouTube API key not configured" }, { status: 500 })
    }

    // Fetch trending videos from YouTube API
    const trendingResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=${regionCode}&maxResults=${maxResults}&key=${apiKey}`
    )

    if (!trendingResponse.ok) {
      const error = await trendingResponse.json()
      return NextResponse.json(
        { error: "Failed to fetch trending videos", details: error },
        { status: trendingResponse.status }
      )
    }

    const trendingData = await trendingResponse.json()

    // Extract keywords/tags from trending videos and track frequency + max viewCount per keyword
    const keywordData: { [key: string]: { frequency: number; maxViewCount: number } } = {}

    trendingData.items.forEach((video: any) => {
      const views = parseInt(video.statistics?.viewCount || 0) || 0

      // Extract tags from video
      if (video.snippet.tags && Array.isArray(video.snippet.tags)) {
        video.snippet.tags.forEach((tag: string) => {
          const cleanTag = tag.toLowerCase().trim()
          if (!keywordData[cleanTag]) keywordData[cleanTag] = { frequency: 0, maxViewCount: 0 }
          keywordData[cleanTag].frequency += 1
          keywordData[cleanTag].maxViewCount = Math.max(keywordData[cleanTag].maxViewCount, views)
        })
      }

      // Extract words from title
      const titleWords = (video.snippet.title || '').toLowerCase().match(/\b(\w+)\b/g) || []
      titleWords.forEach((word: string) => {
        if (word.length > 3) { // Only consider words longer than 3 characters
          if (!keywordData[word]) keywordData[word] = { frequency: 0, maxViewCount: 0 }
          keywordData[word].frequency += 1
          keywordData[word].maxViewCount = Math.max(keywordData[word].maxViewCount, views)
        }
      })

      // Extract words from description
      const descriptionWords = (video.snippet.description || '').toLowerCase().match(/\b(\w+)\b/g) || []
      descriptionWords.forEach((word: string) => {
        if (word.length > 3) { // Only consider words longer than 3 characters
          if (!keywordData[word]) keywordData[word] = { frequency: 0, maxViewCount: 0 }
          keywordData[word].frequency += 1
          keywordData[word].maxViewCount = Math.max(keywordData[word].maxViewCount, views)
        }
      })
    })

    // Convert to array and sort by frequency
    const trendingKeywords = Object.entries(keywordData)
      .map(([keyword, info]) => ({ keyword, frequency: info.frequency, maxViewCount: info.maxViewCount }))
      .sort((a, b) => b.frequency - a.frequency)

    // Process videos for frontend display
    const trendingVideos = trendingData.items.map((video: any) => ({
      id: video.id,
      title: video.snippet.title,
      channelTitle: video.snippet.channelTitle,
      thumbnail: video.snippet.thumbnails?.medium?.url || video.snippet.thumbnails?.default?.url,
      viewCount: video.statistics?.viewCount || 0,
      likeCount: video.statistics?.likeCount || 0,
      publishedAt: video.snippet.publishedAt,
    }))

    // Keywords that appear in at least one video with >= 1,000,000 views
    const popularKeywords = trendingKeywords
      .filter(k => (k.maxViewCount || 0) >= 1000000)
      .sort((a, b) => (b.maxViewCount || 0) - (a.maxViewCount || 0))
      .slice(0, 20)

    return NextResponse.json({
      success: true,
      keywords: trendingKeywords,
      popularKeywords,
      videos: trendingVideos,
      region: regionCode
    })
  } catch (error: any) {
    console.error("YouTube API Error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}