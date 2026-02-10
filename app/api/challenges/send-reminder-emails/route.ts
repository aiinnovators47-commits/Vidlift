import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { sendUploadReminderEmail } from '@/lib/challengeEmailService'

export const dynamic = 'force-dynamic'

/**
 * POST /api/challenges/send-reminder-emails
 * Send hourly reminder emails to users who have not uploaded today
 * Called by cron job every hour
 */
export async function POST(req: Request) {
  try {
    // Verify cron secret for security
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'dev-secret-key'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()
    
    // Get current time
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    
    // Get today's date range
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    // Find all active challenges with approaching/passed deadlines
    const { data: challenges, error: challengesError } = await supabase
      .from('user_challenges')
      .select(`
        id,
        user_id,
        challenge_title,
        next_upload_deadline,
        cadence_every_days,
        streak_count,
        completion_percentage,
        points_earned,
        last_reminder_sent,
        users!inner (
          id,
          email,
          display_name
        )
      `)
      .eq('status', 'active')
      .not('next_upload_deadline', 'is', null)

    if (challengesError) {
      console.error('Error fetching challenges:', challengesError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const emailsSent = []
    const emailsFailed = []

    for (const challenge of challenges || []) {
      try {
        const deadline = new Date(challenge.next_upload_deadline)
        const user = Array.isArray(challenge.users) ? challenge.users[0] : challenge.users
        
        // Skip if no user email
        if (!user?.email) {
          console.log(`Skipping challenge ${challenge.id}: no user email`)
          continue
        }

        // Check if deadline is today or within next hour
        const timeUntilDeadline = deadline.getTime() - now.getTime()
        const hoursUntilDeadline = timeUntilDeadline / (1000 * 60 * 60)

        // Only send if:
        // 1. Deadline is within next 24 hours OR already passed (up to 4 hours ago)
        // 2. Haven't sent reminder in last hour
        const shouldSendReminder = (
          (hoursUntilDeadline <= 24 && hoursUntilDeadline >= -4) &&
          (!challenge.last_reminder_sent || new Date(challenge.last_reminder_sent) < oneHourAgo)
        )

        if (!shouldSendReminder) {
          continue
        }

        // Check if today's video is uploaded
        const { data: todayUpload } = await supabase
          .from('challenge_uploads')
          .select('id')
          .eq('challenge_id', challenge.id)
          .gte('upload_date', todayStart.toISOString())
          .lte('upload_date', todayEnd.toISOString())
          .single()

        // Skip if already uploaded today
        if (todayUpload) {
          console.log(`Skipping challenge ${challenge.id}: already uploaded today`)
          continue
        }

        // Calculate time until deadline
        let timeUntilText = ''
        if (hoursUntilDeadline < 0) {
          const hoursOverdue = Math.abs(Math.floor(hoursUntilDeadline))
          timeUntilText = `${hoursOverdue} hour(s) overdue`
        } else if (hoursUntilDeadline < 1) {
          const minutesUntil = Math.floor(timeUntilDeadline / (1000 * 60))
          timeUntilText = `${minutesUntil} minutes`
        } else if (hoursUntilDeadline < 24) {
          const hours = Math.floor(hoursUntilDeadline)
          const minutes = Math.floor((timeUntilDeadline % (1000 * 60 * 60)) / (1000 * 60))
          timeUntilText = `${hours} hour(s) ${minutes} minute(s)`
        } else {
          const days = Math.floor(hoursUntilDeadline / 24)
          timeUntilText = `${days} day(s)`
        }

        // Send reminder email
        await sendUploadReminderEmail({
          userEmail: user.email,
          userName: user.display_name || 'Creator',
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
          timeUntilDeadline: timeUntilText
        })

        // Update last_reminder_sent timestamp
        await supabase
          .from('user_challenges')
          .update({ last_reminder_sent: now.toISOString() })
          .eq('id', challenge.id)

        emailsSent.push({
          challengeId: challenge.id,
          userEmail: user.email,
          timeUntilDeadline: timeUntilText
        })

        console.log(`✅ Reminder email sent to ${user.email} for challenge ${challenge.id}`)

      } catch (emailError: any) {
        console.error(`Failed to send reminder for challenge ${challenge.id}:`, emailError)
        emailsFailed.push({
          challengeId: challenge.id,
          error: emailError.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      emailsSent: emailsSent.length,
      emailsFailed: emailsFailed.length,
      details: {
        sent: emailsSent,
        failed: emailsFailed
      }
    })

  } catch (error: any) {
    console.error('❌ Send reminder emails error:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

/**
 * GET /api/challenges/send-reminder-emails
 * Test endpoint - send reminder for specific challenge
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const challengeId = searchParams.get('challengeId')
    const testMode = searchParams.get('test') === 'true'

    if (!challengeId) {
      return NextResponse.json({ 
        error: 'challengeId required',
        usage: 'GET /api/challenges/send-reminder-emails?challengeId=XXX&test=true'
      }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Get challenge with user info
    const { data: challenge, error } = await supabase
      .from('user_challenges')
      .select(`
        id,
        user_id,
        challenge_title,
        next_upload_deadline,
        cadence_every_days,
        streak_count,
        completion_percentage,
        points_earned,
        users!inner (
          id,
          email,
          display_name
        )
      `)
      .eq('id', challengeId)
      .single()

    if (error || !challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    const user = Array.isArray(challenge.users) ? challenge.users[0] : challenge.users
    if (!user?.email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 404 })
    }

    // Calculate time until deadline
    const deadline = new Date(challenge.next_upload_deadline)
    const now = new Date()
    const timeUntilDeadline = deadline.getTime() - now.getTime()
    const hoursUntil = Math.floor(timeUntilDeadline / (1000 * 60 * 60))
    const minutesUntil = Math.floor((timeUntilDeadline % (1000 * 60 * 60)) / (1000 * 60))

    const timeText = hoursUntil < 0 
      ? `${Math.abs(hoursUntil)} hour(s) overdue`
      : `${hoursUntil} hour(s) ${minutesUntil} minute(s)`

    if (testMode) {
      return NextResponse.json({
        testMode: true,
        wouldSend: true,
        challenge: {
          id: challenge.id,
          title: challenge.challenge_title,
          deadline: challenge.next_upload_deadline,
          timeUntilDeadline: timeText
        },
        recipient: {
          email: user.email,
          name: user.display_name
        },
        message: 'Test mode - email NOT sent. Remove ?test=true to actually send.'
      })
    }

    // Send actual reminder email
    await sendUploadReminderEmail({
      userEmail: user.email,
      userName: user.display_name || 'Creator',
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
      timeUntilDeadline: timeText
    })

    return NextResponse.json({
      success: true,
      message: 'Reminder email sent',
      sentTo: user.email,
      timeUntilDeadline: timeText
    })

  } catch (error: any) {
    console.error('❌ Test reminder error:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}
