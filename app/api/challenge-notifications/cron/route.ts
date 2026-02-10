import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { sendMissedUploadEmail, sendUploadReminderEmail } from '@/lib/challengeEmailService'

export const dynamic = 'force-dynamic'

// This endpoint should be called by a cron job (e.g., Vercel Cron, external service)
// It checks for missed uploads and sends notifications
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
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    // Get all active challenges
    const { data: activeChallenges, error: challengeError } = await supabase
      .from('user_challenges')
      .select(`
        *,
        users!inner(email, name)
      `)
      .eq('status', 'active')
      .eq('email_notifications_enabled', true)
    
    if (challengeError) {
      console.error('Error fetching active challenges:', challengeError)
      return NextResponse.json({ error: challengeError.message }, { status: 500 })
    }

    let missedCount = 0
    let reminderCount = 0
    let penaltyCount = 0

    for (const challenge of activeChallenges || []) {
      const nextDeadline = challenge.next_upload_deadline ? new Date(challenge.next_upload_deadline) : null
      
      if (!nextDeadline) continue

      const userEmail = challenge.users.email
      const userName = challenge.users.name || 'Creator'
      
      // Check if deadline has passed (missed upload)
      if (nextDeadline < now) {
        const progress = challenge.progress || []
        const currentScheduleIndex = progress.findIndex((item: any) => {
          const itemDate = new Date(item.date)
          return itemDate.getTime() === nextDeadline.getTime()
        })

        // Check if already uploaded
        const { count: uploadCount } = await supabase
          .from('challenge_uploads')
          .select('*', { count: 'exact', head: true })
          .eq('challenge_id', challenge.id)
          .gte('upload_date', new Date(nextDeadline.getTime() - 24 * 60 * 60 * 1000).toISOString())
          .lte('upload_date', nextDeadline.toISOString())
        
        if (uploadCount === 0) {
          // Missed upload - apply penalty
          const penaltyPoints = 50
          const newMissedDays = (challenge.missed_days || 0) + 1
          const newStreak = 0 // Reset streak
          const newPoints = Math.max(0, (challenge.points_earned || 0) - penaltyPoints)

          // Update progress
          if (currentScheduleIndex >= 0) {
            progress[currentScheduleIndex].missed = true
            progress[currentScheduleIndex].points = -penaltyPoints
          }

          // Find next deadline
          const nextScheduleItem = progress.find((item: any, index: number) => {
            return index > currentScheduleIndex && !item.uploaded && !item.missed
          })

          await supabase
            .from('user_challenges')
            .update({
              points_earned: newPoints,
              streak_count: newStreak,
              missed_days: newMissedDays,
              progress: progress,
              next_upload_deadline: nextScheduleItem ? nextScheduleItem.date : null,
              updated_at: new Date().toISOString()
            })
            .eq('id', challenge.id)

          // Send missed upload email
          try {
            await sendMissedUploadEmail({
              userEmail,
              userName,
              challenge,
              penaltyPoints,
              missedDays: newMissedDays
            })
            missedCount++

            // Create notification record
            await supabase.from('challenge_notifications').insert({
              challenge_id: challenge.id,
              notification_type: 'missed',
              sent_date: new Date().toISOString(),
              email_status: 'sent',
              email_content: {
                penaltyPoints,
                missedDays: newMissedDays
              }
            })
          } catch (emailError) {
            console.error('Failed to send missed upload email:', emailError)
          }

          penaltyCount++
        }
      }
      // Check if deadline is within 24 hours (send reminder)
      else if (nextDeadline > now && nextDeadline <= tomorrow) {
        // Check if reminder was already sent today
        const { data: recentReminder } = await supabase
          .from('challenge_notifications')
          .select('*')
          .eq('challenge_id', challenge.id)
          .eq('notification_type', 'reminder')
          .gte('sent_date', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
          .single()
        
        if (!recentReminder) {
          const hoursUntil = Math.round((nextDeadline.getTime() - now.getTime()) / (1000 * 60 * 60))
          
          try {
            await sendUploadReminderEmail({
              userEmail,
              userName,
              challenge,
              timeUntilDeadline: `${hoursUntil} hours`,
              streakCount: challenge.streak_count || 0
            })
            reminderCount++

            // Create notification record
            await supabase.from('challenge_notifications').insert({
              challenge_id: challenge.id,
              notification_type: 'reminder',
              sent_date: new Date().toISOString(),
              email_status: 'sent',
              next_reminder_date: nextDeadline.toISOString(),
              email_content: {
                hoursUntil,
                deadline: nextDeadline.toISOString()
              }
            })
          } catch (emailError) {
            console.error('Failed to send reminder email:', emailError)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${activeChallenges?.length || 0} challenges`,
      stats: {
        totalChallenges: activeChallenges?.length || 0,
        missedUploads: missedCount,
        reminders: reminderCount,
        penalties: penaltyCount
      }
    })
  } catch (err: any) {
    console.error('Cron job error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// GET endpoint for manual testing
export async function GET(req: Request) {
  return NextResponse.json({ 
    message: 'Challenge notifications cron job. Use POST with authorization header.',
    info: 'This endpoint checks for missed uploads and sends email notifications.'
  })
}
