import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { sendUploadConfirmationEmail, sendMissedUploadEmail } from '@/lib/challengeEmailService'

export const dynamic = 'force-dynamic'

// This cron job automatically checks YouTube for new uploads and records them
// Runs every hour to detect new videos
export async function POST(req: Request) {
  try {
    // Verify cron secret for security
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'your-cron-secret-key'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()
    const now = new Date()

    // Get all active challenges with deadlines today or in the past (not yet checked)
    const { data: activeChallenges, error: challengeError } = await supabase
      .from('user_challenges')
      .select(`
        id,
        user_id,
        challenge_id,
        challenge_title,
        next_upload_deadline,
        started_at,
        streak_count,
        points_earned,
        missed_days,
        progress,
        email_notifications_enabled,
        longest_streak,
        users!inner(id, email, name)
      `)
      .eq('status', 'active')
      .not('next_upload_deadline', 'is', null)
      .lte('next_upload_deadline', now.toISOString())
    
    if (challengeError) {
      console.error('Error fetching challenges:', challengeError)
      return NextResponse.json({ error: challengeError.message }, { status: 500 })
    }

    let videosDetected = 0
    let uploadsRecorded = 0
    let missedUploads = 0

    for (const challenge of activeChallenges || []) {
      const deadline = new Date(challenge.next_upload_deadline)
      const userEmail = challenge.users?.[0]?.email || ''
      const userName = challenge.users?.[0]?.name || 'Creator'

      // Determine slot start (previous schedule item or challenge started_at)
      const progress = challenge.progress || []
      const currentIndex = progress.findIndex((item: any) => new Date(item.date).toISOString() === deadline.toISOString())
      let slotStart = new Date(challenge.started_at || (progress && progress.length ? progress[0].date : new Date(deadline.getTime() - 24 * 60 * 60 * 1000)))
      if (currentIndex > 0) slotStart = new Date(progress[currentIndex - 1].date)

      // Check if upload was already recorded for this deadline (between slotStart and deadline)
      const { data: existingUpload } = await supabase
        .from('challenge_uploads')
        .select('id')
        .eq('challenge_id', challenge.id)
        .gte('upload_date', slotStart.toISOString())
        .lte('upload_date', deadline.toISOString())
        .single()

      if (existingUpload) {
        console.log(`Upload already recorded for challenge ${challenge.id}`)
        continue
      }

      // Fetch user's YouTube channel and access token
      const { data: channels } = await supabase
        .from('channels')
        .select('*')
        .eq('user_id', challenge.user_id)
        .eq('is_primary', true)
        .single()

      if (!channels || !channels.access_token) {
        console.log(`No YouTube channel connected for user ${challenge.user_id}`)
        continue
      }

      // Fetch recent videos from YouTube API
      try {
        const publishedAfter = new Date(slotStart.getTime() - 1000).toISOString()
        console.log(`🔍 Auto-detect: Searching for videos from ${publishedAfter} to ${deadline.toISOString()} (slotStart=${slotStart.toISOString()})`)
        const youtubeRes = await fetch(
          `https://www.googleapis.com/youtube/v3/search?` +
          `part=snippet&channelId=${channels.channel_id}&` +
          `order=date&maxResults=50&` +
          `publishedAfter=${publishedAfter}`,
          {
            headers: {
              Authorization: `Bearer ${channels.access_token}`
            }
          }
        )

        if (!youtubeRes.ok) {
          console.error(`YouTube API error for user ${challenge.user_id}:`, youtubeRes.status)
          continue
        }

        const youtubeData = await youtubeRes.json()
        const videos = youtubeData.items || []
        
        videosDetected += videos.length

        // Check if any video was uploaded within the deadline window
        for (const video of videos) {
          const publishedAt = new Date(video.snippet.publishedAt)
          
          // Only consider videos published within the scheduled slot (slotStart -> deadline)
          if (publishedAt >= slotStart && publishedAt <= deadline) {
            // Video uploaded within deadline window!
            const isOnTime = publishedAt <= deadline
            
            // Calculate points
            const basePoints = 10
            const onTimeBonus = isOnTime ? 5 : 0
            const streakBonus = challenge.streak_count ? Math.min(challenge.streak_count, 10) : 0
            const totalPoints = basePoints + onTimeBonus + streakBonus

            // Fetch detailed video statistics
            let videoStats = {
              title: video.snippet.title,
              views: 0,
              likes: 0,
              comments: 0,
              duration: 0
            }

            try {
              const statsRes = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?` +
                `part=statistics,contentDetails&id=${video.id.videoId}`,
                {
                  headers: {
                    Authorization: `Bearer ${channels.access_token}`
                  }
                }
              )

              if (statsRes.ok) {
                const statsData = await statsRes.json()
                const statsVideo = statsData.items?.[0]
                
                if (statsVideo) {
                  videoStats.views = parseInt(statsVideo.statistics?.viewCount || 0)
                  videoStats.likes = parseInt(statsVideo.statistics?.likeCount || 0)
                  videoStats.comments = parseInt(statsVideo.statistics?.commentCount || 0)
                  videoStats.duration = parseDuration(statsVideo.contentDetails?.duration || 'PT0S')
                }
              }
            } catch (statsErr) {
              console.warn('Failed to fetch video stats:', statsErr)
            }

            // Record the upload
            const { data: upload, error: uploadError } = await supabase
              .from('challenge_uploads')
              .insert({
                challenge_id: challenge.id,
                video_id: video.id.videoId,
                video_title: videoStats.title,
                video_url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
                video_views: videoStats.views,
                video_likes: videoStats.likes,
                video_comments: videoStats.comments,
                video_duration: videoStats.duration,
                upload_date: publishedAt.toISOString(),
                scheduled_date: deadline.toISOString(),
                on_time_status: isOnTime,
                points_earned: totalPoints
              })
              .select()
              .single()

            if (uploadError) {
              console.error('Error recording upload:', uploadError)
              continue
            }

            // Update challenge stats
            const newStreak = isOnTime ? (challenge.streak_count || 0) + 1 : 0
            const newLongestStreak = Math.max(newStreak, challenge.longest_streak || 0)
            const newPoints = (challenge.points_earned || 0) + totalPoints

            // Find next deadline from progress array
            const progress = challenge.progress || []
            const nextScheduleItem = progress.find((item: any) => {
              const itemDate = new Date(item.date)
              return itemDate > publishedAt && !item.uploaded
            })

            await supabase
              .from('user_challenges')
              .update({
                points_earned: newPoints,
                streak_count: newStreak,
                longest_streak: newLongestStreak,
                next_upload_deadline: nextScheduleItem ? nextScheduleItem.date : null,
                updated_at: new Date().toISOString()
              })
              .eq('id', challenge.id)

            uploadsRecorded++

            // Send confirmation email
            if (challenge.email_notifications_enabled) {
              try {
                const challengeData: any = {
                  userId: challenge.user_id,
                  challengeId: challenge.challenge_id,
                  challengeTitle: challenge.challenge_title,
                  nextUploadDeadline: challenge.next_upload_deadline,
                  streakCount: challenge.streak_count,
                  pointsEarned: challenge.points_earned,
                  missedDays: challenge.missed_days,
                  progress: challenge.progress,
                  longestStreak: challenge.longest_streak
                }
                await sendUploadConfirmationEmail({
                  userEmail,
                  userName,
                  challenge: challengeData,
                  pointsEarned: totalPoints,
                  streakCount: newStreak,
                  isOnTime
                })
              } catch (emailError) {
                console.warn('Failed to send confirmation email:', emailError)
              }
            }

            console.log(`✅ Auto-detected upload for ${userName}: ${video.snippet.title}`)
            
            // Check for achievements after successful upload
            try {
              const { checkAndUnlockAchievements } = await import('@/lib/achievementService')
              const newAchievements = await checkAndUnlockAchievements(challenge.user_id, challenge.id)
              
              if (newAchievements.length > 0) {
                console.log(`🎉 ${newAchievements.length} new achievement(s) unlocked for ${userName}`)
                // Optionally send achievement notification email here
              }
            } catch (achievementError) {
              console.warn('Failed to check achievements:', achievementError)
            }
            
            break // Only record one video per deadline
          }
        }

        // If no video was found and deadline passed, mark as missed
        if (videos.length === 0 || !videos.some(v => {
          const publishedAt = new Date(v.snippet.publishedAt)
          return publishedAt <= deadline && publishedAt >= slotStart
        })) {
          // Check if deadline is more than 2 hours past
          const hoursPast = (now.getTime() - deadline.getTime()) / (1000 * 60 * 60)
          
          if (hoursPast > 2) {
            // Apply missed upload penalty
            const penaltyPoints = 50
            const newMissedDays = (challenge.missed_days || 0) + 1
            const newPoints = Math.max(0, (challenge.points_earned || 0) - penaltyPoints)

            await supabase
              .from('user_challenges')
              .update({
                points_earned: newPoints,
                streak_count: 0,
                missed_days: newMissedDays,
                next_upload_deadline: null, // Will be set by next check
                updated_at: new Date().toISOString()
              })
              .eq('id', challenge.id)

            missedUploads++

            // Send missed upload email
            if (challenge.email_notifications_enabled) {
              try {
                const challengeData: any = {
                  userId: challenge.user_id,
                  challengeId: challenge.challenge_id,
                  challengeTitle: challenge.challenge_title,
                  nextUploadDeadline: challenge.next_upload_deadline,
                  streakCount: challenge.streak_count,
                  pointsEarned: challenge.points_earned,
                  missedDays: challenge.missed_days,
                  progress: challenge.progress,
                  longestStreak: challenge.longest_streak
                }
                await sendMissedUploadEmail({
                  userEmail,
                  userName,
                  challenge: challengeData,
                  penaltyPoints,
                  missedDays: newMissedDays
                })
              } catch (emailError) {
                console.warn('Failed to send missed email:', emailError)
              }
            }

            console.log(`❌ Missed upload detected for ${userName}`)
          }
        }

      } catch (ytError: any) {
        console.error('YouTube API error:', ytError)
        continue
      }
    }

    return NextResponse.json({
      success: true,
      message: `Auto-detection complete`,
      stats: {
        challengesChecked: activeChallenges?.length || 0,
        videosDetected,
        uploadsRecorded,
        missedUploads
      }
    })

  } catch (err: any) {
    console.error('Auto-detect cron error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function GET(req: Request) {
  return NextResponse.json({ 
    message: 'Auto-detect upload cron job. Use POST with authorization header.',
    info: 'Automatically checks YouTube for new uploads and records them.'
  })
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
