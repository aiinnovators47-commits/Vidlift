import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
}

const supabase = createClient(supabaseUrl!, supabaseKey!)

// Fetch video stats from YouTube API
async function fetchVideoStats(videoIds: string[], accessToken: string) {
  if (!videoIds.length) return []

  try {
    const headers: any = { 'Content-Type': 'application/json' }
    
    // Use access token if provided, otherwise use API key
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds.join(',')}${!accessToken && process.env.YOUTUBE_API_KEY ? '&key=' + process.env.YOUTUBE_API_KEY : ''}`,
      { headers }
    )

    if (!response.ok) {
      console.error('YouTube API error:', response.statusText)
      return []
    }

    const data = await response.json()
    return data.items || []
  } catch (error) {
    console.error('Error fetching video stats:', error)
    return []
  }
}

export async function POST(request: NextRequest) {
  try {
    const { videoIds, accessToken } = await request.json()

    if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
      return NextResponse.json(
        { error: 'Video IDs are required' },
        { status: 400 }
      )
    }

    // Fetch updated stats from YouTube
    const videoStats = await fetchVideoStats(videoIds, accessToken)

    if (videoStats.length === 0) {
      return NextResponse.json(
        { error: 'Failed to fetch video stats' },
        { status: 500 }
      )
    }

    // Update stats in database
    const updates = []
    for (const item of videoStats) {
      const videoId = item.id
      const stats = item.statistics

      const { error } = await supabase
        .from('challenge_uploads')
        .update({
          video_views: parseInt(stats.viewCount || '0'),
          video_likes: parseInt(stats.likeCount || '0'),
          video_comments: parseInt(stats.commentCount || '0'),
          updated_at: new Date().toISOString()
        })
        .eq('video_id', videoId)

      if (!error) {
        updates.push({
          video_id: videoId,
          video_views: parseInt(stats.viewCount || '0'),
          video_likes: parseInt(stats.likeCount || '0'),
          video_comments: parseInt(stats.commentCount || '0')
        })
      }
    }

    return NextResponse.json({
      success: true,
      updated: updates.length,
      stats: updates
    })
  } catch (error: any) {
    console.error('Error refreshing stats:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
