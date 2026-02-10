import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { sendMorningReminderEmail } from '@/lib/challengeEmailService'

export const dynamic = 'force-dynamic'

/**
 * 7 AM Morning Reminder Cron
 * Sends emails at 7 AM to users who need to upload TODAY
 * Only sends if today is an upload day according to challenge cadence
 * 
 * Configure in vercel.json:
 * Schedule: "0 7 * * *" (7:00 AM UTC daily)
 * 
 * Manual trigger:
 * curl -X POST https://your-domain.com/api/challenges/cron/morning-reminder \
 *   -H "Authorization: Bearer YOUR_CRON_SECRET"
 */
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
    
    // Get today's date range
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    console.log(`🌅 Morning Reminder Cron (7 AM): Checking for upload days today`)

    // Get all active challenges with deadline TODAY
    const { data: activeChallenges, error: challengeError } = await supabase
      .from('user_challenges')
      .select(`
        id,
        user_id,
        challenge_title,
        next_upload_deadline,
        cadence_every_days,
        streak_count,
        points_earned,
        completion_percentage,
        started_at,
        users!inner(id, email, display_name)
      `)
      .eq('status', 'active')
      .not('next_upload_deadline', 'is', null)
      .gte('next_upload_deadline', todayStart.toISOString())
      .lte('next_upload_deadline', todayEnd.toISOString())
    
    if (challengeError) {
      console.error('❌ Error fetching challenges:', challengeError)
      return NextResponse.json({ error: challengeError.message }, { status: 500 })
    }

    let remindersSent = 0
    let skipped = 0

    for (const challenge of activeChallenges || []) {
      try {
        const deadline = new Date(challenge.next_upload_deadline)
        const user = Array.isArray(challenge.users) ? challenge.users[0] : challenge.users
        const userEmail = user?.email
        const userName = user?.display_name || user?.name || 'Creator'

        if (!userEmail) {
          console.log(`⏭️  No email found for challenge ${challenge.id}`)
          skipped++
          continue
        }

        // Check if today is actually an upload day based on cadence
        const startedAt = new Date(challenge.started_at)
        const daysSinceStart = Math.floor((todayStart.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24))
        const isUploadDay = daysSinceStart % (challenge.cadence_every_days || 1) === 0

        if (!isUploadDay) {
          console.log(`⏭️  Today is not an upload day for "${challenge.challenge_title}" (cadence: every ${challenge.cadence_every_days} days)`)
          skipped++
          continue
        }

        // Check if user already uploaded today
        const { data: todayUploads } = await supabase
          .from('challenge_uploads')
          .select('id')
          .eq('challenge_id', challenge.id)
          .gte('upload_date', todayStart.toISOString())
          .lte('upload_date', todayEnd.toISOString())

        if (todayUploads && todayUploads.length > 0) {
          console.log(`⏭️  User ${userEmail} already uploaded today for "${challenge.challenge_title}"`)
          skipped++
          continue
        }

        console.log(`📧 Sending 7 AM morning reminder to ${userEmail} for "${challenge.challenge_title}"`)

        // Send morning reminder email
        await sendMorningReminderEmail({
          userEmail,
          userName,
          challenge: {
            challengeTitle: challenge.challenge_title || 'Challenge',
            challengeType: 'custom',
            durationMonths: null,
            cadenceEveryDays: challenge.cadence_every_days,
            streakCount: challenge.streak_count,
            completionPercentage: challenge.completion_percentage,
            pointsEarned: challenge.points_earned,
            uploads: []
          } as any,
          timeUntilDeadline: 'Today',
          streakCount: challenge.streak_count || 0
        })

        remindersSent++
      } catch (error) {
        console.error(`❌ Error sending reminder to challenge ${challenge.id}:`, error)
      }
    }

    console.log(`✅ Morning Reminder Complete (7 AM): ${remindersSent} sent, ${skipped} skipped`)

    return NextResponse.json({
      success: true,
      remindersSent,
      skipped,
      checkedAt: now.toISOString()
    })
  } catch (error: any) {
    console.error('❌ Morning reminder cron error:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}
