import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getValidAccessTokenForChannel } from '@/lib/youtubeAuth'

export const dynamic = 'force-dynamic'

/**
 * POST /api/challenges/fetch-todays-video
 * Automatically fetch the latest video uploaded today from YouTube
 * and track it for the challenge
 */
export async function POST(req: Request) {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()
    const body = await req.json()
    const { challengeId, channelId } = body

    if (!challengeId) {
      return NextResponse.json({ error: 'challengeId is required' }, { status: 400 })
    }

    // Get challenge to verify ownership
    const { data: challenge, error: challengeError } = await supabase
      .from('user_challenges')
      .select('*')
      .eq('id', challengeId)
      .eq('user_id', auth.userId)
      .single()

    if (challengeError || !challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    // Get access token for YouTube API
    if (!channelId) {
      return NextResponse.json({ error: 'channelId is required to fetch videos' }, { status: 400 })
    }

    const accessToken = await getValidAccessTokenForChannel(channelId)
    if (!accessToken) {
      return NextResponse.json({ error: 'YouTube access token not found' }, { status: 401 })
    }

    // Fetch latest videos from YouTube
    const youtubeResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=10&order=date&type=video`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )

    if (!youtubeResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch videos from YouTube' }, { status: 500 })
    }

    const youtubeData = await youtubeResponse.json()
    const videos = youtubeData.items || []

    if (videos.length === 0) {
      return NextResponse.json({ error: 'No videos found on this channel' }, { status: 404 })
    }

    // Get today's date range
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    // Find video uploaded today
    let todaysVideo = null
    for (const video of videos) {
      const publishedAt = new Date(video.snippet.publishedAt)
      if (publishedAt >= todayStart && publishedAt <= todayEnd) {
        todaysVideo = video
        break
      }
    }

    // Grace period: Check if uploaded within last hour (even if it was yesterday)
    if (!todaysVideo) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      for (const video of videos) {
        const publishedAt = new Date(video.snippet.publishedAt)
        if (publishedAt >= oneHourAgo) {
          todaysVideo = video
          break
        }
      }
    }

    if (!todaysVideo) {
      return NextResponse.json({ 
        error: 'No video uploaded today',
        message: 'No videos found that were uploaded today. Please upload a video or manually track one.'
      }, { status: 404 })
    }

    // Get detailed video stats
    const videoId = todaysVideo.id.videoId
    const videoDetailsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )

    const videoDetailsData = await videoDetailsResponse.json()
    const videoDetails = videoDetailsData.items?.[0]

    if (!videoDetails) {
      return NextResponse.json({ error: 'Failed to fetch video details' }, { status: 500 })
    }

    // Calculate points
    const views = parseInt(videoDetails.statistics.viewCount || '0')
    const likes = parseInt(videoDetails.statistics.likeCount || '0')
    const comments = parseInt(videoDetails.statistics.commentCount || '0')

    const points = calculatePoints(views, likes, comments)

    // Check if today's video already exists
    const { data: existingUpload } = await supabase
      .from('challenge_uploads')
      .select('id')
      .eq('challenge_id', challengeId)
      .gte('upload_date', todayStart.toISOString())
      .lte('upload_date', todayEnd.toISOString())
      .single()

    if (existingUpload) {
      return NextResponse.json({
        error: 'Video already tracked for today',
        message: 'You already have a video tracked for today. Only one video per day earns points.',
        existingUpload: true
      }, { status: 400 })
    }

    // Track the video with NO NULL VALUES
    const uploadRecord = {
      challenge_id: challengeId,
      user_id: auth.userId,
      video_id: videoId,
      video_title: videoDetails.snippet.title || 'Untitled Video',
      video_url: `https://www.youtube.com/watch?v=${videoId}`,
      upload_date: new Date().toISOString(),
      scheduled_date: challenge.next_upload_deadline || new Date().toISOString(),
      points_earned: points || 0,
      on_time_status: true,
      is_todays_video: true,
      video_views: views || 0,
      video_likes: likes || 0,
      video_comments: comments || 0,
      video_duration: parseDuration(videoDetails.contentDetails?.duration || 'PT0S') || 0
    }

    console.log('📝 Fetch-todays-video: Recording upload with payload:', uploadRecord)

    const { data: upload, error: uploadError } = await supabase
      .from('challenge_uploads')
      .insert(uploadRecord)
      .select()
      .single()

    if (uploadError) {
      console.error('Upload tracking error:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Update challenge points
    const { data: updatedChallenge, error: updateError } = await supabase
      .from('user_challenges')
      .update({
        points_earned: (challenge.points_earned || 0) + points,
        updated_at: new Date().toISOString()
      })
      .eq('id', challengeId)
      .select()
      .single()

    if (updateError) {
      console.error('Challenge update error:', updateError)
    }

    return NextResponse.json({
      success: true,
      message: 'Video automatically tracked!',
      upload,
      video: {
        id: videoId,
        title: videoDetails.snippet.title,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        views,
        likes,
        comments,
        points
      },
      challenge: updatedChallenge
    })

  } catch (error: any) {
    console.error('❌ Fetch todays video error:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

/**
 * Calculate points based on video performance
 */
function calculatePoints(views: number, likes: number, comments: number): number {
  const BASE_POINTS = 100

  // Views bonus
  let viewsBonus = 0
  if (views >= 1000) viewsBonus = 50
  else if (views >= 100) viewsBonus = 25
  else if (views >= 10) viewsBonus = 10

  // Likes bonus (max 20)
  const likesBonus = Math.min(Math.floor(likes / 5), 20)

  // Comments bonus (max 15)
  const commentsBonus = Math.min(Math.floor(comments / 2), 15)

  const totalPoints = BASE_POINTS + viewsBonus + likesBonus + commentsBonus

  // Cap at 250 max per video
  return Math.min(totalPoints, 250)
}

/**
 * Helper function to parse YouTube duration (PT format)
 * PT1H30M45S -> 5445 seconds
 */
function parseDuration(duration: string): number {
  try {
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
    const matches = duration.match(regex)
    
    if (!matches) return 0
    
    const hours = parseInt(matches[1] || '0', 10)
    const minutes = parseInt(matches[2] || '0', 10)
    const seconds = parseInt(matches[3] || '0', 10)
    
    return hours * 3600 + minutes * 60 + seconds
  } catch (err) {
    console.warn('Error parsing duration:', duration, err)
    return 0
  }
}
