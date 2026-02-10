import { NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const ids = searchParams.get('ids')
    const accessToken = searchParams.get('access_token')
    const apiKey = process.env.YOUTUBE_API_KEY
    
    if (!ids) return NextResponse.json({ error: 'ids query param required' }, { status: 400 })
    if (!apiKey && !accessToken) return NextResponse.json({ error: 'API key or access token not configured' }, { status: 500 })

    // Request all available parts for comprehensive data
    // Use access token if provided, otherwise use API key
    let url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails,status&id=${encodeURIComponent(ids)}`
    if (accessToken) {
      url += `&access_token=${encodeURIComponent(accessToken)}`
    } else {
      url += `&key=${apiKey}`
    }
    
    const res = await fetch(url)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return NextResponse.json({ error: 'Failed to fetch video details', details: err }, { status: res.status })
    }
    const data = await res.json()
    const videos = (data.items || []).map((it: any) => ({
      id: it.id,
      // Snippet data
      title: it.snippet?.title || '',
      description: it.snippet?.description || '',
      channelId: it.snippet?.channelId || '',
      channelTitle: it.snippet?.channelTitle || '',
      publishedAt: it.snippet?.publishedAt || '',
      thumbnail: it.snippet?.thumbnails?.high?.url || it.snippet?.thumbnails?.medium?.url || it.snippet?.thumbnails?.default?.url || '',
      tags: it.snippet?.tags || [],
      categoryId: it.snippet?.categoryId || '',
      liveBroadcastContent: it.snippet?.liveBroadcastContent || 'none',
      defaultLanguage: it.snippet?.defaultLanguage,
      defaultAudioLanguage: it.snippet?.defaultAudioLanguage,
      localized: it.snippet?.localized,
      snippet: it.snippet, // Include full snippet for thumbnails
      // Statistics
      viewCount: it.statistics?.viewCount || '0',
      likeCount: it.statistics?.likeCount || '0',
      dislikeCount: it.statistics?.dislikeCount,
      commentCount: it.statistics?.commentCount || '0',
      favoriteCount: it.statistics?.favoriteCount || '0',
      statistics: it.statistics,
      // Content Details
      duration: it.contentDetails?.duration || '',
      contentDetails: it.contentDetails,
      // Status
      status: it.status,
    }))
    return NextResponse.json({ success: true, videos })
  } catch (error: any) {
    console.error('videosByIds error', error)
    return NextResponse.json({ error: 'Internal server error', details: error?.message || String(error) }, { status: 500 })
  }
}
