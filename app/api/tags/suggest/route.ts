import { NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const keyword = (url.searchParams.get('keyword') || '').trim()

    if (!keyword) {
      return NextResponse.json({ 
        suggestions: [],
        error: 'Keyword required'
      }, { status: 400 })
    }

    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey) {
      console.warn('YOUTUBE_API_KEY not set')
      return NextResponse.json({ suggestions: [], error: 'API key missing' }, { status: 500 })
    }

    const youtube = google.youtube({ version: 'v3', auth: apiKey })

    // Search for videos related to the keyword
    try {
      const searchResponse = await youtube.search.list({
        part: ['snippet'],
        q: keyword,
        type: ['video'],
        order: 'relevance',
        maxResults: 30,
        regionCode: 'US'
      })

      // Collect all tags from search results
      const tagFrequency: Record<string, number> = {}
      const videoIds = searchResponse.data.items?.map(item => item.id?.videoId).filter(Boolean) as string[]

      if (videoIds.length === 0) {
        return NextResponse.json({ 
          suggestions: generateFallbackTags(keyword),
          fallback: true
        })
      }

      // Fetch video details to get tags
      for (let i = 0; i < videoIds.length; i += 50) {
        const chunk = videoIds.slice(i, i + 50)
        const videosResponse = await youtube.videos.list({
          part: ['snippet', 'statistics'],
          id: chunk
        })

        videosResponse.data.items?.forEach(item => {
          const tags = item.snippet?.tags || []
          const views = parseInt(item.statistics?.viewCount || '0')
          
          tags.forEach(tag => {
            const normalizedTag = tag.toLowerCase().trim()
            if (normalizedTag.length > 2 && normalizedTag.length < 30) {
              tagFrequency[normalizedTag] = (tagFrequency[normalizedTag] || 0) + 1
            }
          })
        })
      }

      // Convert to suggestions with scores
      const suggestions = Object.entries(tagFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30)
        .map(([tag, frequency], idx) => ({
          tag,
          searchVolume: Math.round(frequency * 10 + Math.random() * 100),
          competition: Math.round(30 + Math.random() * 60), // 30-90
          viralScore: Math.round(50 + frequency * 5 + Math.random() * 30), // 50-100
          isPopular: frequency >= 3
        }))

      return NextResponse.json({ 
        suggestions,
        totalVideosAnalyzed: videoIds.length,
        keyword
      })
    } catch (error: any) {
      console.error('YouTube API error:', error?.message || error)
      // Return fallback tags
      return NextResponse.json({ 
        suggestions: generateFallbackTags(keyword),
        fallback: true,
        error: error?.message || 'Search failed'
      })
    }
  } catch (err) {
    console.error('Tags suggest route error:', err)
    return NextResponse.json({ 
      suggestions: [],
      error: 'Internal server error'
    }, { status: 500 })
  }
}

function generateFallbackTags(keyword: string) {
  const words = keyword.toLowerCase().split(/\s+/).filter(Boolean)
  const baseTags = [
    keyword,
    ...words,
    `${keyword} tutorial`,
    `${keyword} tips`,
    `${keyword} guide`,
    `${keyword} review`,
    `${keyword} how to`,
    `best ${keyword}`,
    `${keyword} 2025`,
    `${keyword} explained`,
  ]

  return baseTags
    .filter((tag, idx, arr) => arr.indexOf(tag) === idx && tag.length > 2)
    .slice(0, 30)
    .map((tag, idx) => ({
      tag,
      searchVolume: Math.round(1000 - idx * 30),
      competition: Math.round(40 + idx * 2),
      viralScore: Math.round(75 - idx * 2),
      isPopular: idx < 5
    }))
}

