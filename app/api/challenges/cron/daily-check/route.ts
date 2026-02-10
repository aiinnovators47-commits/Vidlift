import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getValidAccessTokenForChannel } from '@/lib/youtubeAuth'
import { 
  sendUploadReminderEmail, 
  sendMissedUploadEmail,
  sendStreakAchievementEmail,
  sendChallengeCompletionEmail,
  ChallengeEmailContext 
} from '@/lib/challengeEmailService'
import { Challenge } from '@/types/challenge'

// This endpoint should be called by a cron service (like Vercel Cron or external cron)
// Add to your deployment: GET /api/challenges/cron/daily-check
export async function GET(req: NextRequest) {
  try {
    // Verify this is a legitimate cron call (add your cron secret)
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()
    console.log('🕐 Starting daily challenge check...')

    // Get all active challenges
    const { data: activeChallenges, error } = await supabase
      .from('user_challenges')
      .select(`
        *,
        users!inner(email, display_name)
      `)
      .eq('status', 'active')
      .not('next_upload_deadline', 'is', null)

    if (error) {
      console.error('Error fetching challenges:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    console.log(`📋 Found ${activeChallenges?.length || 0} active challenges to check`)

    const results = {
      processed: 0,
      remindersSent: 0,
      missedAlerts: 0,
      completionEmails: 0,
      streakEmails: 0,
      errors: [] as string[]
    }

    if (!activeChallenges || activeChallenges.length === 0) {
      return NextResponse.json({ 
        message: 'No active challenges to process',
        results 
      })
    }

    // Process each challenge
    for (const challenge of activeChallenges) {
      try {
        results.processed++
        await processChallengeNotifications(supabase, challenge, results)
      } catch (error: any) {
        console.error(`Error processing challenge ${challenge.id}:`, error)
        results.errors.push(`Challenge ${challenge.id}: ${error.message}`)
      }
    }

    // Also check for YouTube uploads and update challenges
    await checkForNewUploads(supabase, results)

    console.log('✅ Daily challenge check completed:', results)

    return NextResponse.json({
      message: 'Daily challenge check completed',
      results
    })

  } catch (error: any) {
    console.error('Cron job error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function processChallengeNotifications(
  supabase: any, 
  challenge: any, 
  results: any
) {
  const now = new Date()
  const nextDeadline = challenge.next_upload_deadline ? new Date(challenge.next_upload_deadline) : null
  
  if (!nextDeadline) return

  const hoursUntilDeadline = (nextDeadline.getTime() - now.getTime()) / (1000 * 60 * 60)
  const userEmail = challenge.users?.email
  const userName = challenge.users?.display_name || 'Creator'

  if (!userEmail) return

  // Skip if notifications are disabled
  if (!challenge.email_notifications_enabled) return

  // Calculate when to send reminders based on upload frequency
  const cadenceDays = challenge.cadence_every_days || 1
  let reminderHours: number[]
  
  if (cadenceDays === 1) {
    reminderHours = [2, 12] // 2 hours and 12 hours before for daily
  } else if (cadenceDays <= 3) {
    reminderHours = [4, 24] // 4 hours and 1 day before for every 2-3 days
  } else {
    reminderHours = [24, 48] // 1 day and 2 days before for weekly
  }

  // Check if we need to send reminder emails
  for (const reminderHour of reminderHours) {
    if (hoursUntilDeadline <= reminderHour && hoursUntilDeadline > reminderHour - 1) {
      // Check if we already sent this reminder
      const { data: existingNotification } = await supabase
        .from('challenge_notifications')
        .select('id')
        .eq('challenge_id', challenge.id)
        .eq('notification_type', 'reminder')
        .gte('sent_date', new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()) // Within last 25 hours
        .single()

      if (!existingNotification) {
        const timeUntilDeadline = formatTimeUntilDeadline(hoursUntilDeadline)
        
        await sendUploadReminderEmail({
          userEmail,
          userName,
          challenge: challenge as Challenge,
          timeUntilDeadline
        })

        // Log notification
        await supabase.from('challenge_notifications').insert({
          challenge_id: challenge.id,
          notification_type: 'reminder',
          email_status: 'sent',
          email_content: { timeUntilDeadline, reminderHour }
        })

        results.remindersSent++
        console.log(`📧 Reminder sent to ${userEmail} (${timeUntilDeadline} left)`)
      }
    }
  }

  // Check for missed uploads (deadline has passed)
  if (hoursUntilDeadline < -1) { // 1 hour grace period
    // Check if we already sent missed upload alert
    const { data: existingMissedAlert } = await supabase
      .from('challenge_notifications')
      .select('id')
      .eq('challenge_id', challenge.id)
      .eq('notification_type', 'missed')
      .gte('sent_date', new Date(nextDeadline.getTime() - 60 * 60 * 1000).toISOString()) // Since deadline
      .single()

    if (!existingMissedAlert) {
      await sendMissedUploadEmail({
        userEmail,
        userName,
        challenge: challenge as Challenge
      })

      // Log notification
      await supabase.from('challenge_notifications').insert({
        challenge_id: challenge.id,
        notification_type: 'missed',
        email_status: 'sent',
        email_content: { missedDeadline: nextDeadline.toISOString() }
      })

      // Update challenge stats
      await supabase
        .from('user_challenges')
        .update({
          missed_days: (challenge.missed_days || 0) + 1,
          streak_count: 0, // Reset streak on missed upload
          updated_at: now.toISOString()
        })
        .eq('id', challenge.id)

      results.missedAlerts++
      console.log(`⚠️ Missed upload alert sent to ${userEmail}`)
    }
  }

  // Check for challenge completion
  if (challenge.completion_percentage >= 100) {
    const { data: existingCompletion } = await supabase
      .from('challenge_notifications')
      .select('id')
      .eq('challenge_id', challenge.id)
      .eq('notification_type', 'completion')
      .single()

    if (!existingCompletion) {
      await sendChallengeCompletionEmail({
        userEmail,
        userName,
        challenge: challenge as Challenge,
        pointsEarned: challenge.points_earned,
        missedDays: challenge.missed_days
      })

      // Log notification
      await supabase.from('challenge_notifications').insert({
        challenge_id: challenge.id,
        notification_type: 'completion',
        email_status: 'sent',
        email_content: { 
          pointsEarned: challenge.points_earned, 
          missedDays: challenge.missed_days,
          isPerfect: (challenge.missed_days || 0) === 0
        }
      })

      results.completionEmails++
      console.log(`🎉 Completion email sent to ${userEmail}`)
    }
  }

  // Check for streak achievements
  const streakMilestones = [7, 14, 30, 60, 90]
  const currentStreak = challenge.streak_count || 0
  
  for (const milestone of streakMilestones) {
    if (currentStreak === milestone) {
      const { data: existingAchievement } = await supabase
        .from('challenge_notifications')
        .select('id')
        .eq('challenge_id', challenge.id)
        .eq('notification_type', 'streak')
        .eq('email_content->streakCount', milestone)
        .single()

      if (!existingAchievement) {
        await sendStreakAchievementEmail({
          userEmail,
          userName,
          challenge: challenge as Challenge,
          streakCount: milestone
        })

        // Log notification
        await supabase.from('challenge_notifications').insert({
          challenge_id: challenge.id,
          notification_type: 'streak',
          email_status: 'sent',
          email_content: { streakCount: milestone }
        })

        results.streakEmails++
        console.log(`🔥 Streak achievement email sent to ${userEmail} (${milestone} days)`)
        break // Only send one streak email per check
      }
    }
  }
}

async function checkForNewUploads(supabase: any, results: any) {
  console.log('🔍 Checking for new YouTube uploads...')

  // Get all user tokens for channels with active challenges
  const { data: channelsWithChallenges } = await supabase
    .from('tokens')
    .select(`
      channel_id,
      user_id,
      user_challenges!inner(id, status)
    `)
    .eq('user_challenges.status', 'active')

  if (!channelsWithChallenges?.length) {
    console.log('No channels with active challenges found')
    return
  }

  for (const channelData of channelsWithChallenges) {
    try {
      await checkChannelForNewUploads(supabase, channelData.channel_id)
    } catch (error: any) {
      console.error(`Error checking channel ${channelData.channel_id}:`, error)
      results.errors.push(`Channel check ${channelData.channel_id}: ${error.message}`)
    }
  }
}

async function checkChannelForNewUploads(supabase: any, channelId: string) {
  const accessToken = await getValidAccessTokenForChannel(channelId)
  if (!accessToken) {
    console.log(`No valid token for channel ${channelId}`)
    return
  }

  // Get recent uploads from YouTube API
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&type=video&maxResults=10&access_token=${accessToken}`
  )

  if (!response.ok) {
    console.error(`YouTube API error for channel ${channelId}:`, response.status)
    return
  }

  const data = await response.json()
  const videos = data.items || []

  for (const video of videos) {
    const videoId = video.id.videoId
    const uploadDate = new Date(video.snippet.publishedAt)
    const now = new Date()
    
    // Only process videos from the last 48 hours
    if (now.getTime() - uploadDate.getTime() > 48 * 60 * 60 * 1000) {
      continue
    }

    // Check if we already tracked this upload
    const { data: existingUpload } = await supabase
      .from('challenge_uploads')
      .select('id')
      .eq('video_id', videoId)
      .single()

    if (existingUpload) continue

    console.log(`📹 Found new upload: ${video.snippet.title} (${videoId})`)

    // Find active challenges for this channel's user
    const { data: userChallenges } = await supabase
      .from('user_challenges')
      .select('id, user_id')
      .eq('status', 'active')
      .in('user_id', [
        // Get user_id from tokens table
        await supabase
          .from('tokens')
          .select('user_id')
          .eq('channel_id', channelId)
          .single()
          .then((r: any) => r.data?.user_id)
      ].filter(Boolean))

    // Auto-track this upload for active challenges
    for (const challenge of userChallenges || []) {
      try {
        await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/challenges/track-upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.CRON_SECRET}` // Internal API call
          },
          body: JSON.stringify({
            challengeId: challenge.id,
            videoId,
            videoTitle: video.snippet.title,
            channelId
          })
        })
        console.log(`✅ Auto-tracked upload for challenge ${challenge.id}`)
      } catch (error) {
        console.error(`Error auto-tracking upload for challenge ${challenge.id}:`, error)
      }
    }
  }
}

function formatTimeUntilDeadline(hours: number): string {
  if (hours < 0) return 'Overdue'
  if (hours < 1) return `${Math.round(hours * 60)} minutes`
  if (hours < 24) return `${Math.round(hours)} hours`
  const days = Math.floor(hours / 24)
  const remainingHours = Math.round(hours % 24)
  return remainingHours > 0 ? `${days} days ${remainingHours} hours` : `${days} days`
}