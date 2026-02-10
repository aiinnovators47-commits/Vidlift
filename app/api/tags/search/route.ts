import { NextResponse } from 'next/server'
import { google } from 'googleapis'

// Simple in-memory cache to reduce quota usage (cache for 1 hour)
const tagCache: Record<string, { data: any; timestamp: number }> = {}
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds

function getCachedTags(keyword: string) {
  const cached = tagCache[keyword.toLowerCase()]
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('[tags/search] ⚡ Cache hit for keyword:', keyword)
    return cached.data
  }
  return null
}

function setCachedTags(keyword: string, data: any) {
  tagCache[keyword.toLowerCase()] = { data, timestamp: Date.now() }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const keyword = (url.searchParams.get('keyword') || '').trim()

    if (!keyword) {
      return NextResponse.json({ 
        tags: [],
        error: 'Keyword required'
      }, { status: 400 })
    }

    // Check cache first to reduce API quota usage
    const cached = getCachedTags(keyword)
    if (cached) {
      return NextResponse.json(cached)
    }

    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey) {
      console.error('❌ YOUTUBE_API_KEY not configured')
      return NextResponse.json({ 
        tags: [],
        error: 'YouTube API key not configured'
      }, { status: 500 })
    }

    const youtube = google.youtube({ version: 'v3', auth: apiKey })

    console.log('[tags/search] 🔍 Searching for keyword:', keyword)

    try {
      // Search for videos with the keyword
      const searchResponse = await youtube.search.list({
        part: ['snippet'],
        q: keyword,
        type: ['video'],
        order: 'relevance',
        maxResults: 50, // Increased from 20 to get more videos
        regionCode: 'US'
      })

      const videoIds = searchResponse.data.items?.map(item => item.id?.videoId).filter(Boolean) as string[]
      console.log(`[tags/search] ✓ Found ${videoIds.length} videos for keyword: ${keyword}`)

      if (videoIds.length === 0) {
        console.warn('[tags/search] ⚠️ No videos found for keyword:', keyword)
        const emptyResponse = { 
          tags: [],
          foundKeywordInTitles: false,
          message: 'No videos found',
          keyword
        }
        setCachedTags(keyword, emptyResponse)
        return NextResponse.json(emptyResponse)
      }

      // Fetch video details to get tags
      const tagFrequency: Record<string, number> = {}
      let totalTagsCollected = 0

      for (let i = 0; i < videoIds.length; i += 50) {
        const chunk = videoIds.slice(i, i + 50)
        const videosResponse = await youtube.videos.list({
          part: ['snippet'],
          id: chunk
        })

        videosResponse.data.items?.forEach(item => {
          const tags = item.snippet?.tags || []
          totalTagsCollected += tags.length
          
          tags.forEach(tag => {
            const normalizedTag = tag.toLowerCase().trim()
            // Store ALL tags, not just keyword-related ones
            tagFrequency[normalizedTag] = (tagFrequency[normalizedTag] || 0) + 1
          })
        })
      }

      console.log(`[tags/search] ✓ Collected ${totalTagsCollected} total tags from ${videoIds.length} videos`)

      if (totalTagsCollected === 0) {
        console.warn('[tags/search] ⚠️ No tags found in videos')
        const emptyResponse = { 
          tags: [],
          message: 'No tags found in videos',
          keyword
        }
        setCachedTags(keyword, emptyResponse)
        return NextResponse.json(emptyResponse)
      }

      // Convert to suggestions with scores - sort by frequency
      const tags = Object.entries(tagFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30) // Top 30 most frequent tags
        .map(([tag, frequency]) => ({
          tag,
          searchVolume: Math.round(frequency * 100), // Higher volume = more frequent
          competition: Math.round(30 + (frequency / videoIds.length) * 70), // Based on prevalence
          viralScore: Math.round(50 + frequency * 2 + Math.random() * 30)
        }))

      const response = { 
        tags,
        totalVideosAnalyzed: videoIds.length,
        totalTagsAnalyzed: totalTagsCollected,
        keyword,
        success: true,
        cached: false
      }

      // Cache the results
      setCachedTags(keyword, response)

      console.log(`[tags/search] ✅ Returning ${tags.length} real tags for keyword: ${keyword}`)

      return NextResponse.json(response)
    } catch (error: any) {
      console.error('[tags/search] ❌ YouTube API error:', error?.message || error)
      
      // Better quota error handling
      if (error?.message?.includes('quota')) {
        return NextResponse.json({ 
          tags: [],
          error: 'YouTube API quota exceeded. Please try again later.',
          success: false,
          quotaExceeded: true
        }, { status: 429 })
      }
      
      return NextResponse.json({ 
        tags: [],
        error: error?.message || 'Search failed',
        success: false
      }, { status: 500 })
    }
  } catch (err) {
    console.error('[tags/search] ❌ Route error:', err)
    return NextResponse.json({ 
      tags: [],
      error: 'Internal server error',
      success: false
    }, { status: 500 })
  }
}
