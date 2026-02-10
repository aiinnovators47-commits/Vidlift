import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import { sendUploadConfirmationEmail, sendMissedUploadEmail } from '@/lib/challengeEmailService'
import { 
  createUploadSuccessNotification, 
  createFirstUploadNotification,
  createEarlyBirdNotification,
  createStreakNotification,
  createUploadMilestoneNotification
} from '@/lib/notificationService'

export const dynamic = 'force-dynamic'

// GET /api/challenge-uploads - Get all uploads for a challenge
export async function GET(req: Request) {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const challengeId = searchParams.get('challengeId')
    
    if (!challengeId) {
      return NextResponse.json({ error: 'Challenge ID required' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()
    
    // Verify user owns this challenge
    const { data: challenge } = await supabase
      .from('user_challenges')
      .select('id')
      .eq('id', challengeId)
      .eq('user_id', auth.userId)
      .single()
    
    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    const { data: uploads, error } = await supabase
      .from('challenge_uploads')
      .select('*')
      .eq('challenge_id', challengeId)
      .order('scheduled_date', { ascending: false })
    
    if (error) {
      console.error('Error fetching uploads:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ uploads: uploads || [] })
  } catch (err: any) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// POST /api/challenge-uploads - Record a new video upload
export async function POST(req: Request) {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { challengeId, videoId, videoTitle, videoUrl, uploadDate, scheduledDate } = body
    
    if (!challengeId || !videoId) {
      return NextResponse.json({ error: 'Challenge ID and Video ID are required' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()
    
    // Get challenge details
    const { data: challenge, error: challengeError } = await supabase
      .from('user_challenges')
      .select('*')
      .eq('id', challengeId)
      .eq('user_id', auth.userId)
      .single()
    
    if (challengeError || !challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    // Validate that user has connected YouTube channel
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .select('*')
      .eq('user_id', auth.userId)
      .eq('is_primary', true)
      .single()

    if (!channel || !channel.access_token) {
      return NextResponse.json({ 
        error: 'YouTube channel not connected. Please connect your channel first.',
        code: 'NO_CHANNEL'
      }, { status: 400 })
    }

    // Verify video belongs to user's channel by fetching from YouTube
    try {
      const youtubeRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?` +
        `part=snippet&id=${videoId}`,
        {
          headers: {
            Authorization: `Bearer ${channel.access_token}`
          }
        }
      )

      if (!youtubeRes.ok) {
        return NextResponse.json({ 
          error: 'Video not found or cannot access it. Make sure it\'s from your connected channel.',
          code: 'VIDEO_NOT_FOUND'
        }, { status: 400 })
      }

      const youtubeData = await youtubeRes.json()
      const video = youtubeData.items?.[0]

      if (!video) {
        return NextResponse.json({ 
          error: 'Video not found. Please check the video ID.',
          code: 'VIDEO_NOT_FOUND'
        }, { status: 400 })
      }

      // Verify video is from user's channel
      if (video.snippet?.channelId !== channel.channel_id) {
        return NextResponse.json({ 
          error: 'This video is not from your connected channel. Please upload a video from your channel.',
          code: 'WRONG_CHANNEL'
        }, { status: 400 })
      }
    } catch (err) {
      console.error('Channel validation error:', err)
      return NextResponse.json({ 
        error: 'Failed to validate video. Please try again.',
        code: 'VALIDATION_ERROR'
      }, { status: 500 })
    }

    // Calculate if upload was on time
    const uploadDateTime = new Date(uploadDate || new Date())
    const scheduledDateTime = new Date(scheduledDate || challenge.next_upload_deadline)
    const isOnTime = uploadDateTime <= scheduledDateTime
    
    // Check if already uploaded today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data: todayUploads, error: todayError } = await supabase
      .from('challenge_uploads')
      .select('id')
      .eq('challenge_id', challengeId)
      .gte('upload_date', today.toISOString())
      .lt('upload_date', tomorrow.toISOString())

    // Allow multiple uploads per day, but warn if uploading same video
    const { data: existingVideo } = await supabase
      .from('challenge_uploads')
      .select('id')
      .eq('challenge_id', challengeId)
      .eq('video_id', videoId)
      .single()

    if (existingVideo) {
      return NextResponse.json({ 
        error: 'This video has already been uploaded to this challenge.',
        code: 'DUPLICATE_VIDEO'
      }, { status: 400 })
    }
    
    // Calculate points earned
    // 1 video = 10 points base
    const basePoints = 10
    const bonusPoints = isOnTime ? 5 : 0 // 5 point bonus for on-time
    const streakBonus = challenge.streak_count > 0 ? Math.min(challenge.streak_count, 10) : 0 // Max 10 streak bonus
    const totalPoints = basePoints + bonusPoints + streakBonus

    // Fetch video statistics from YouTube
    let videoStats = {
      title: videoTitle,
      views: 0,
      likes: 0,
      comments: 0,
      duration: 0
    }

    try {
      // Get user's YouTube channel with access token
      const { data: channel } = await supabase
        .from('channels')
        .select('*')
        .eq('user_id', auth.userId)
        .eq('is_primary', true)
        .single()

      if (channel && channel.access_token) {
        // Fetch video details from YouTube API
        const youtubeRes = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?` +
          `part=snippet,statistics,contentDetails&id=${videoId}`,
          {
            headers: {
              Authorization: `Bearer ${channel.access_token}`
            }
          }
        )

        if (youtubeRes.ok) {
          const youtubeData = await youtubeRes.json()
          const video = youtubeData.items?.[0]
          
          if (video) {
            videoStats = {
              title: video.snippet?.title || videoTitle,
              views: parseInt(video.statistics?.viewCount || 0),
              likes: parseInt(video.statistics?.likeCount || 0),
              comments: parseInt(video.statistics?.commentCount || 0),
              duration: parseDuration(video.contentDetails?.duration || 'PT0S')
            }
            console.log(`✅ Fetched video stats for ${videoId}:`, videoStats)
          }
        } else {
          console.warn(`⚠️ YouTube API error for video ${videoId}:`, youtubeRes.status)
          // Use provided title if YouTube API fails
          videoStats.title = videoTitle || 'Untitled'
        }
      } else {
        console.warn('⚠️ No YouTube channel connected or access token missing')
        // Use provided title as fallback
        videoStats.title = videoTitle || 'Untitled'
      }
    } catch (err) {
      console.warn('⚠️ Failed to fetch video stats:', err)
      // Continue with basic info if YouTube API fails
      videoStats.title = videoTitle || 'Untitled'
    }

    // Generate video URL if not provided
    const finalVideoUrl = videoUrl || `https://www.youtube.com/watch?v=${videoId}`

    // Create upload record with video statistics
    // Ensure NO NULL values - use defaults and actual data
    const uploadPayload = {
      challenge_id: challengeId,
      video_id: videoId,
      video_title: videoStats.title || 'Untitled Video',
      video_url: finalVideoUrl,
      video_views: videoStats.views || 0,
      video_likes: videoStats.likes || 0,
      video_comments: videoStats.comments || 0,
      video_duration: videoStats.duration || 0,
      upload_date: uploadDateTime.toISOString(),
      scheduled_date: scheduledDateTime.toISOString(),
      on_time_status: isOnTime,
      points_earned: totalPoints
    }

    console.log('📝 Creating upload record with payload:', uploadPayload)

    const { data: upload, error: uploadError } = await supabase
      .from('challenge_uploads')
      .insert(uploadPayload)
      .select()
      .single()
    
    if (uploadError) {
      console.error('❌ Error creating upload:', {
        message: uploadError.message,
        code: uploadError.code,
        details: uploadError.details
      })
      return NextResponse.json({ 
        error: uploadError.message || 'Failed to record upload',
        details: uploadError.details
      }, { status: 500 })
    }

    console.log(`✅ Upload recorded successfully:`, {
      uploadId: upload?.id,
      videoId,
      videoTitle: videoStats.title,
      pointsEarned: totalPoints,
      isOnTime
    })
    
    // Check for achievements after successful upload
    try {
      const { checkAndUnlockAchievements } = await import('@/lib/achievementService')
      const newAchievements = await checkAndUnlockAchievements(auth.userId, challengeId)
      
      if (newAchievements.length > 0) {
        console.log(`🎉 ${newAchievements.length} new achievement(s) unlocked`)
      }
    } catch (achievementError) {
      console.warn('Failed to check achievements:', achievementError)
    }

    // Update challenge stats
    const newStreak = isOnTime ? (challenge.streak_count || 0) + 1 : 0
    const newLongestStreak = Math.max(newStreak, challenge.longest_streak || 0)
    const newPointsEarned = (challenge.points_earned || 0) + totalPoints
    
    // Count total uploads
    const { count: totalUploads } = await supabase
      .from('challenge_uploads')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', challengeId)
    
    // Calculate completion percentage
    const progress = challenge.progress || []
    const completionPercentage = progress.length > 0 
      ? Math.round(((totalUploads || 0) / progress.length) * 100)
      : 0

    // Find next upload deadline
    const nextScheduledItem = progress.find((item: any) => {
      const itemDate = new Date(item.date)
      return itemDate > uploadDateTime && !item.uploaded
    })
    
    const nextDeadline = nextScheduledItem ? nextScheduledItem.date : null

    // Update challenge
    const { error: updateError } = await supabase
      .from('user_challenges')
      .update({
        points_earned: newPointsEarned,
        streak_count: newStreak,
        longest_streak: newLongestStreak,
        completion_percentage: completionPercentage,
        next_upload_deadline: nextDeadline,
        updated_at: new Date().toISOString()
      })
      .eq('id', challengeId)
    
    if (updateError) {
      console.error('Error updating challenge:', updateError)
    }

    // Update user stats
    await updateUserStats(auth.userId, supabase, totalPoints, newStreak)

    // Create UI notifications
    try {
      // Upload success notification
      await createUploadSuccessNotification(
        auth.userId,
        challengeId,
        videoTitle,
        totalPoints,
        isOnTime,
        challenge.challenge_title
      )

      // First upload notification
      if (totalUploads === 0) { // This is the first upload
        await createFirstUploadNotification(
          auth.userId,
          challengeId,
          videoTitle,
          challenge.challenge_title
        )
      }

      // Early bird notification - check if uploaded significantly before deadline
      const uploadTime = new Date(uploadDate).getTime()
      const scheduledTime = new Date(scheduledDate).getTime()
      const timeDifference = scheduledTime - uploadTime
      
      if (isOnTime && timeDifference > 2 * 60 * 60 * 1000) { // Uploaded more than 2 hours early
        await createEarlyBirdNotification(
          auth.userId,
          challengeId,
          videoTitle,
          challenge.challenge_title
        )
      }

      // Streak milestone notifications
      const streakMilestones = [7, 14, 30, 60, 100]
      if (streakMilestones.includes(newStreak)) {
        await createStreakNotification(
          auth.userId,
          challengeId,
          newStreak,
          challenge.challenge_title
        )
      }

      // Upload milestone notifications
      const uploadMilestones = [10, 25, 50, 100, 200]
      if (uploadMilestones.includes(totalUploads + 1)) { // +1 because we just added one
        await createUploadMilestoneNotification(
          auth.userId,
          challengeId,
          totalUploads + 1,
          challenge.challenge_title
        )
      }
    } catch (notificationError) {
      console.warn('Failed to create UI notifications:', notificationError)
    }

    // Send confirmation email
    if (challenge.email_notifications_enabled) {
      try {
        await sendUploadConfirmationEmail({
          userEmail: auth.email,
          userName: auth.name,
          challenge,
          pointsEarned: totalPoints,
          streakCount: newStreak,
          isOnTime
        })
      } catch (emailError) {
        console.warn('Failed to send confirmation email:', emailError)
      }
    }

    return NextResponse.json({ 
      upload,
      pointsEarned: totalPoints,
      newStreak,
      isOnTime,
      message: isOnTime ? '🎉 On-time upload! You earned bonus points!' : '✅ Upload recorded successfully'
    })
  } catch (err: any) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// Helper function to parse YouTube duration (PT format)
function parseDuration(duration: string): number {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
  const matches = duration.match(regex)
  
  if (!matches) return 0
  
  const hours = parseInt(matches[1] || '0', 10)
  const minutes = parseInt(matches[2] || '0', 10)
  const seconds = parseInt(matches[3] || '0', 10)
  
  return hours * 3600 + minutes * 60 + seconds
}

// Helper function to update user stats
async function updateUserStats(userId: string, supabase: any, pointsEarned: number, currentStreak: number) {
  const { data: stats, error: statsError } = await supabase
    .from('user_challenge_stats')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (statsError && statsError.code !== 'PGRST116') { // Not found is ok
    console.error('Error fetching user stats:', statsError)
    return
  }

  const newTotalPoints = (stats?.total_points || 0) + pointsEarned
  const newTotalVideos = (stats?.total_videos_uploaded || 0) + 1
  const newLongestStreak = Math.max(currentStreak, stats?.longest_streak || 0)
  
  // Calculate level based on points
  let levelTitle = 'Beginner'
  if (newTotalPoints >= 10000) levelTitle = 'Legend'
  else if (newTotalPoints >= 5000) levelTitle = 'Master'
  else if (newTotalPoints >= 2000) levelTitle = 'Pro'
  else if (newTotalPoints >= 500) levelTitle = 'Creator'

  const upsertData = {
    user_id: userId,
    total_points: newTotalPoints,
    current_streak: currentStreak,
    longest_streak: newLongestStreak,
    total_videos_uploaded: newTotalVideos,
    level_title: levelTitle,
    updated_at: new Date().toISOString()
  }

  if (stats) {
    await supabase
      .from('user_challenge_stats')
      .update(upsertData)
      .eq('user_id', userId)
  } else {
    await supabase
      .from('user_challenge_stats')
      .insert(upsertData)
  }
}
