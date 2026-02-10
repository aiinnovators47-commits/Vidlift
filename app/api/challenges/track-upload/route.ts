import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getValidAccessTokenForChannel } from '@/lib/youtubeAuth'

export const dynamic = 'force-dynamic'

async function resolveUser() {
  const session = await getServerSession()
  if (!session?.user?.email) return null
  const supabase = createServerSupabaseClient()
  const { data: userRow } = await supabase.from('users').select('id,email,display_name').eq('email', session.user.email).limit(1).single()
  if (!userRow?.id) return null
  return { supabase, userRow, session }
}

// POST /api/challenges/track-upload - Track a new video upload
export async function POST(req: Request) {
  try {
    const resolved = await resolveUser()
    if (!resolved) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const { supabase, userRow } = resolved
    const body = await req.json()
    
    const { challengeId, videoId, videoTitle, videoUrl, channelId } = body
    
    if (!challengeId || !videoId) {
      return NextResponse.json({ error: 'Challenge ID and Video ID are required' }, { status: 400 })
    }
    
    // Get challenge details
    const { data: challenge, error: challengeError } = await supabase
      .from('user_challenges')
      .select('*')
      .eq('id', challengeId)
      .eq('user_id', userRow.id)
      .single()
    
    if (challengeError || !challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }
    
    // 🔥 ONE-PER-DAY POINTS LOGIC: Check if today's upload already exists
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const { data: existingTodayUploads, error: countError } = await supabase
      .from('challenge_uploads')
      .select('id, video_id, video_title, points_earned, is_todays_video')
      .eq('challenge_id', challengeId)
      .gte('upload_date', todayStart.toISOString())
      .lte('upload_date', todayEnd.toISOString())

    const todayUploadCount = existingTodayUploads?.length || 0
    const isFirstVideoToday = todayUploadCount === 0

    // Get video details from YouTube API if needed
    let videoDetails = { title: videoTitle, duration: 0, views: 0, likes: 0, comments: 0 }
    
    if (channelId) {
      try {
        const accessToken = await getValidAccessTokenForChannel(channelId)
        if (accessToken) {
          const response = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&access_token=${accessToken}`
          )
          const data = await response.json()
          
          if (data.items && data.items.length > 0) {
            const video = data.items[0]
            videoDetails = {
              title: video.snippet.title,
              duration: parseDuration(video.contentDetails.duration),
              views: parseInt(video.statistics.viewCount || '0'),
              likes: parseInt(video.statistics.likeCount || '0'),
              comments: parseInt(video.statistics.commentCount || '0')
            }
          }
        }
      } catch (error) {
        console.error('Error fetching video details:', error)
      }
    }
    
    const uploadDate = new Date()
    
    // Find the scheduled date for this upload
    const progress = challenge.progress || []
    let scheduledDate = uploadDate
    let dayIndex = -1
    
    // Find the next unuploaded day
    for (let i = 0; i < progress.length; i++) {
      if (!progress[i].uploaded) {
        scheduledDate = new Date(progress[i].date)
        dayIndex = i
        break
      }
    }
    
    // Check if upload is on time (within 4 hours of deadline)
    const isOnTime = uploadDate.getTime() <= (scheduledDate.getTime() + (4 * 60 * 60 * 1000))
    
    // 🎯 POINTS CALCULATION - ONLY AWARD FOR FIRST VIDEO TODAY
    let totalPoints = 0
    let pointsMessage = ''
    
    if (isFirstVideoToday) {
      // Calculate streak
      let currentStreak = challenge.streak_count || 0
      if (isOnTime) {
        currentStreak += 1
      } else {
        currentStreak = 1 // Reset streak but count this upload
      }
      
      // Calculate points
      const basePoints = 100
      const viewsBonus = videoDetails.views >= 1000 ? 50 : videoDetails.views >= 100 ? 25 : videoDetails.views >= 10 ? 10 : 0
      const likesBonus = Math.min(Math.floor(videoDetails.likes / 5), 20)
      const commentsBonus = Math.min(Math.floor(videoDetails.comments / 2), 15)
      const streakBonus = isOnTime ? currentStreak * 5 : 0
      const earlyBonus = uploadDate.getTime() < scheduledDate.getTime() ? 3 : 0
      
      totalPoints = Math.min(basePoints + viewsBonus + likesBonus + commentsBonus + streakBonus + earlyBonus, 250)
      pointsMessage = `✅ First video today - ${totalPoints} points earned!`
      
      // Update challenge streak
      challenge.streak_count = currentStreak
    } else {
      // Second, third, etc. video - NO POINTS
      totalPoints = 0
      pointsMessage = `ℹ️ You already uploaded today. No additional points earned. (You have ${todayUploadCount} video(s) today)`
    }
    
    // Create upload record with NO NULL VALUES - auto-generate URL if needed
    const finalVideoUrl = videoUrl || `https://www.youtube.com/watch?v=${videoId}`
    const uploadRecord = {
      challenge_id: challengeId,
      user_id: userRow.id,
      video_id: videoId,
      video_title: videoDetails.title || videoTitle || 'Untitled Video',
      video_url: finalVideoUrl,
      upload_date: uploadDate.toISOString(),
      scheduled_date: scheduledDate.toISOString(),
      on_time_status: isOnTime,
      points_earned: totalPoints,
      is_todays_video: isFirstVideoToday,
      video_duration: videoDetails.duration || 0,
      video_views: videoDetails.views || 0,
      video_likes: videoDetails.likes || 0,
      video_comments: videoDetails.comments || 0
    }

    console.log('📝 Track-upload: Recording upload with payload:', uploadRecord)
    
    const { data: upload, error: uploadError } = await supabase
      .from('challenge_uploads')
      .insert(uploadRecord)
      .select()
      .single()
    
    if (uploadError) {
      console.error('Upload tracking error', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }
    
    // Update challenge progress ONLY if first video today
    if (isFirstVideoToday && dayIndex >= 0) {
      progress[dayIndex] = {
        ...progress[dayIndex],
        uploaded: true,
        videoId,
        videoTitle: videoDetails.title || videoTitle,
        points: totalPoints,
        onTime: isOnTime
      }
    }
    
    // Calculate new stats
    const completedUploads = progress.filter(p => p.uploaded).length
    const totalUploads = progress.length
    const completionPercentage = totalUploads > 0 ? (completedUploads / totalUploads) * 100 : 0
    
    // Find next deadline
    let nextDeadline = null
    for (const item of progress) {
      if (!item.uploaded) {
        nextDeadline = item.date
        break
      }
    }
    
    // Update challenge
    const challengeUpdates = {
      progress,
      points_earned: (challenge.points_earned || 0) + totalPoints,
      streak_count: challenge.streak_count,
      longest_streak: Math.max(challenge.longest_streak || 0, challenge.streak_count || 0),
      completion_percentage: completionPercentage,
      next_upload_deadline: nextDeadline,
      status: completionPercentage >= 100 ? 'completed' : 'active',
      updated_at: new Date().toISOString()
    }
    
    // Add completion bonus if challenge is finished
    if (completionPercentage >= 100) {
      const missedDays = progress.filter(p => p.uploaded && !p.onTime).length
      const completionBonus = missedDays === 0 ? 1000 : 500
      challengeUpdates.points_earned = challengeUpdates.points_earned + completionBonus
    }
    
    const { data: updatedChallenge, error: updateError } = await supabase
      .from('user_challenges')
      .update(challengeUpdates)
      .eq('id', challengeId)
      .select()
      .single()
    
    if (updateError) {
      console.error('Challenge update error', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
    
    // Check for achievements (only if first video today)
    const achievements = isFirstVideoToday 
      ? await checkForAchievements(supabase, userRow.id, challengeId, challenge.streak_count || 0, completionPercentage)
      : []
    
    return NextResponse.json({
      upload,
      challenge: updatedChallenge,
      achievements,
      points: totalPoints,
      streak: challenge.streak_count,
      isFirstVideoToday,
      todayUploadCount,
      message: pointsMessage
    })
    
  } catch (err: any) {
    console.error('track-upload POST unexpected', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// Helper function to parse YouTube duration (PT1M30S -> 90 seconds)
function parseDuration(duration: string): number {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
  if (!match) return 0
  
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')
  
  return hours * 3600 + minutes * 60 + seconds
}

// Helper function to check for new achievements
async function checkForAchievements(supabase: any, userId: string, challengeId: string, streak: number, completion: number) {
  const achievements = []
  
  // Check existing achievements to avoid duplicates
  const { data: existing } = await supabase
    .from('challenge_achievements')
    .select('achievement_type')
    .eq('user_id', userId)
    .eq('challenge_id', challengeId)
  
  const existingTypes = existing?.map(a => a.achievement_type) || []
  
  // First upload achievement
  if (!existingTypes.includes('first_upload') && streak >= 1) {
    achievements.push({
      user_id: userId,
      challenge_id: challengeId,
      achievement_type: 'first_upload',
      achievement_title: 'First Steps',
      achievement_description: 'Uploaded your first challenge video',
      points_awarded: 50
    })
  }
  
  // 7-day streak achievement
  if (!existingTypes.includes('streak_7') && streak >= 7) {
    achievements.push({
      user_id: userId,
      challenge_id: challengeId,
      achievement_type: 'streak_7',
      achievement_title: 'Week Warrior',
      achievement_description: 'Maintained a 7-day upload streak',
      points_awarded: 100
    })
  }
  
  // 30-day streak achievement
  if (!existingTypes.includes('streak_30') && streak >= 30) {
    achievements.push({
      user_id: userId,
      challenge_id: challengeId,
      achievement_type: 'streak_30',
      achievement_title: 'Month Master',
      achievement_description: 'Achieved a 30-day upload streak',
      points_awarded: 300
    })
  }
  
  // Perfect month achievement
  if (!existingTypes.includes('perfect_month') && completion >= 100 && streak >= 30) {
    achievements.push({
      user_id: userId,
      challenge_id: challengeId,
      achievement_type: 'perfect_month',
      achievement_title: 'Perfection',
      achievement_description: 'Completed a 30-day challenge without missing a single day',
      points_awarded: 500
    })
  }
  
  // Insert new achievements
  if (achievements.length > 0) {
    await supabase.from('challenge_achievements').insert(achievements)
  }
  
  return achievements
}