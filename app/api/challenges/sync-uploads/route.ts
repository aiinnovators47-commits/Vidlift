import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import { sendUploadConfirmationEmail } from '@/lib/challengeEmailService'

export const dynamic = 'force-dynamic'

/**
 * Helper: Refresh access token if expired
 */
async function getOrRefreshAccessToken(channel: any, supabase: any): Promise<string | null> {
  if (!channel.access_token) {
    console.error('❌ No access token stored for channel')
    return null
  }

  // Check if token is expired
  if (channel.token_expires_at) {
    const expiryTime = new Date(channel.token_expires_at).getTime()
    const now = Date.now()
    const isExpired = expiryTime - now < 5 * 60 * 1000 // Expired if less than 5 min left

    if (isExpired && channel.refresh_token) {
      console.log('🔄 Access token expired - attempting to refresh...')
      
      try {
        const clientId = process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
        const clientSecret = process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET

        if (!clientId || !clientSecret) {
          console.error('❌ Missing OAuth credentials for token refresh')
          return null
        }

        const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: channel.refresh_token,
            grant_type: 'refresh_token'
          }).toString()
        })

        if (!refreshRes.ok) {
          console.error('❌ Token refresh failed:', refreshRes.status)
          return null
        }

        const refreshData = await refreshRes.json()

        if (!refreshData.access_token) {
          console.error('❌ No access token in refresh response')
          return null
        }

        // Update channel with new token
        const newExpiresAt = new Date(Date.now() + (refreshData.expires_in || 3600) * 1000).toISOString()

        const { error: updateError } = await supabase
          .from('channels')
          .update({
            access_token: refreshData.access_token,
            token_expires_at: newExpiresAt,
            refresh_token: refreshData.refresh_token || channel.refresh_token
          })
          .eq('id', channel.id)

        if (updateError) {
          console.warn('⚠️ Failed to update token in DB:', updateError)
          // But still return the new token to continue
        } else {
          console.log('✅ Token refreshed and saved successfully')
        }

        return refreshData.access_token
      } catch (err) {
        console.error('❌ Token refresh error:', err)
        return null
      }
    }
  }

  // Token is still valid
  return channel.access_token
}

/**
 * POST /api/challenges/sync-uploads
 * Manually triggers video sync from YouTube
 * Checks if any new videos match today's deadline and auto-saves them
 */
export async function POST(req: Request) {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()
    const { challengeId } = await req.json()
    const now = new Date()

    console.log(`🔄 Syncing uploads for user ${auth.userId}...`)

    // Get active challenges for this user
    const { data: challenges, error: fetchError } = await supabase
      .from('user_challenges')
      .select(`
        *,
        users!inner(email, name)
      `)
      .eq('user_id', auth.userId)
      .eq('status', 'active')
      .not('next_upload_deadline', 'is', null)

    if (fetchError || !challenges) {
      return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 })
    }

    let syncedCount = 0
    const results = []

    for (const challenge of challenges) {
      // Skip if not the requested challenge
      if (challengeId && challenge.id !== challengeId) continue

      try {
        const deadline = new Date(challenge.next_upload_deadline)
        const userEmail = challenge.users.email
        const userName = challenge.users.name || 'Creator'

        // Get user's YouTube channel
        const { data: channel } = await supabase
          .from('channels')
          .select('*')
          .eq('user_id', auth.userId)
          .eq('is_primary', true)
          .single()

        if (!channel || !channel.access_token) {
          console.warn('⚠️ No YouTube channel connected or no access token')
          results.push({
            challengeId: challenge.id,
            status: 'skipped',
            reason: 'No YouTube channel connected'
          })
          continue
        }

        // Get or refresh access token
        let accessToken = await getOrRefreshAccessToken(channel, supabase)
        if (!accessToken) {
          console.error('❌ Could not get valid access token')
          results.push({
            challengeId: challenge.id,
            status: 'error',
            reason: 'Invalid YouTube authentication - please reconnect'
          })
          continue
        }

        // Determine slot start (previous scheduled date or challenge start)
        const progress = challenge.progress || []
        const currentIndex = progress.findIndex((item: any) => new Date(item.date).toISOString() === deadline.toISOString())
        let slotStart = new Date(challenge.started_at || (progress && progress.length ? progress[0].date : new Date(deadline.getTime() - 24 * 60 * 60 * 1000)))
        if (currentIndex > 0) slotStart = new Date(progress[currentIndex - 1].date)

        // Use the slot start as lower bound for searching videos (minus 1s to include equality)
        const publishedAfter = new Date(slotStart.getTime() - 1000)

        console.log(`🔍 Searching for videos from slotStart: ${slotStart.toISOString()} (publishedAfter=${publishedAfter.toISOString()}) to ${deadline.toISOString()}`)

        const youtubeRes = await fetch(
          `https://www.googleapis.com/youtube/v3/search?` +
          `part=snippet&channelId=${channel.channel_id}&` +
          `order=date&maxResults=50&` +
          `publishedAfter=${publishedAfter.toISOString()}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          }
        )

        if (!youtubeRes.ok) {
          console.error(`❌ YouTube API error: ${youtubeRes.status}`)
          results.push({
            challengeId: challenge.id,
            status: 'error',
            reason: `YouTube API error (${youtubeRes.status})`
          })
          continue
        }

        const youtubeData = await youtubeRes.json()
        const videos = youtubeData.items || []

        console.log(`📊 Found ${videos.length} total videos from YouTube`)

        // Check if any video matches deadline window
        let uploadFound = false

        for (const video of videos) {
          const publishedAt = new Date(video.snippet.publishedAt)
          
          // Log each video for debugging
          console.log(`📹 Video: "${video.snippet.title}"`)
          console.log(`   Type: ${video.id.kind || 'youtube#video'}`)
          console.log(`   Published: ${publishedAt.toISOString()}`)
          console.log(`   Deadline: ${deadline.toISOString()}`)
          console.log(`   Published before deadline? ${publishedAt <= deadline}`)

          // Accept video only if published during the scheduled slot: on/after slotStart and on/before deadline
          if (publishedAt >= slotStart && publishedAt <= deadline) {
            // Check if already recorded - IMPORTANT: Don't use .single() as it throws on no match
            const { data: existing, error: existingError } = await supabase
              .from('challenge_uploads')
              .select('id')
              .eq('challenge_id', challenge.id)
              .eq('video_id', video.id.videoId)

            if (existing && existing.length > 0) {
              console.log(`   ⚠️  Already recorded - skipping (found ${existing.length} existing record(s))`)
              continue
            }

            console.log(`   ✅ NEW VIDEO FOUND - Processing!`)

            // Calculate points
            const basePoints = 10
            const isOnTime = publishedAt <= deadline
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
                    Authorization: `Bearer ${accessToken}`
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

            // Record the upload with NO NULL values
            const syncUploadPayload = {
              challenge_id: challenge.id,
              video_id: video.id.videoId,
              video_title: videoStats.title || 'Untitled Video',
              video_url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
              video_views: videoStats.views || 0,
              video_likes: videoStats.likes || 0,
              video_comments: videoStats.comments || 0,
              video_duration: videoStats.duration || 0,
              upload_date: publishedAt.toISOString(),
              scheduled_date: deadline.toISOString(),
              on_time_status: isOnTime,
              points_earned: totalPoints
            }

            console.log('📝 Sync: Recording upload with payload:', syncUploadPayload)

            // Double-check: Ensure no duplicate before insert
            const { data: doubleCheck } = await supabase
              .from('challenge_uploads')
              .select('id')
              .eq('challenge_id', challenge.id)
              .eq('video_id', video.id.videoId)

            if (doubleCheck && doubleCheck.length > 0) {
              console.log(`   ⚠️  DUPLICATE BLOCKED - Video already exists!`)
              continue // Skip this video, it's already been recorded
            }

            const { data: upload, error: uploadError } = await supabase
              .from('challenge_uploads')
              .insert(syncUploadPayload)
              .select()
              .single()

            if (uploadError) {
              console.error('❌ Error recording upload:', uploadError)
              continue
            }

            console.log('✅ Successfully recorded upload:', upload.id)

            // Update challenge stats
            const newStreak = isOnTime ? (challenge.streak_count || 0) + 1 : 0
            const newLongestStreak = Math.max(newStreak, challenge.longest_streak || 0)
            const newPoints = (challenge.points_earned || 0) + totalPoints

            // Calculate next deadline
            const progress = challenge.progress || []
            const nextScheduleItem = progress.find((item: any) => {
              const itemDate = new Date(item.date)
              return itemDate > deadline && !item.uploaded
            })

            const { error: updateError } = await supabase
              .from('user_challenges')
              .update({
                points_earned: newPoints,
                streak_count: newStreak,
                longest_streak: newLongestStreak,
                next_upload_deadline: nextScheduleItem ? nextScheduleItem.date : null,
                updated_at: new Date().toISOString()
              })
              .eq('id', challenge.id)

            if (updateError) {
              console.error('Error updating challenge:', updateError)
            }

            // Send confirmation email
            if (challenge.email_notifications_enabled) {
              try {
                await sendUploadConfirmationEmail({
                  userEmail,
                  userName,
                  challenge,
                  pointsEarned: totalPoints,
                  streakCount: newStreak,
                  isOnTime
                })
              } catch (emailError) {
                console.warn('Failed to send confirmation email:', emailError)
              }
            }

            uploadFound = true
            syncedCount++

            results.push({
              challengeId: challenge.id,
              status: 'success',
              videoTitle: video.snippet.title,
              pointsEarned: totalPoints,
              isOnTime,
              streakCount: newStreak
            })

            break // Only sync one per challenge per day
          }
        }

        if (!uploadFound) {
          results.push({
            challengeId: challenge.id,
            status: 'no_upload',
            message: 'No videos found for deadline day'
          })
        }
      } catch (error) {
        console.error(`Error syncing challenge ${challenge.id}:`, error)
        results.push({
          challengeId: challenge.id,
          status: 'error',
          reason: String(error)
        })
      }
    }

    console.log(`✅ Sync complete: ${syncedCount} uploads synced`)

    return NextResponse.json({
      success: true,
      syncedCount,
      results,
      checkedAt: now.toISOString()
    })
  } catch (error: any) {
    console.error('❌ Sync uploads error:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

// Helper function to parse YouTube duration (PT format)
function parseDuration(duration: string): number {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
  const matches = duration.match(regex)
  
  if (!matches) return 0
  
  const hours = parseInt(matches[1] || '0', 10) || 0
  const minutes = parseInt(matches[2] || '0', 10) || 0
  const seconds = parseInt(matches[3] || '0', 10) || 0
  
  return hours * 3600 + minutes * 60 + seconds
}
