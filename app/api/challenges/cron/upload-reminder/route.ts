import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '')

export const dynamic = 'force-dynamic'

/**
 * POST /api/challenges/cron/upload-reminder
 * Send email reminders at 6 AM and every hour if upload not done
 * Runs on Vercel cron
 */
export async function POST(req: Request) {
  try {
    console.log('🔔 Starting upload reminder cron...')

    const supabase = createServerSupabaseClient()

    // Get current hour to determine reminder type
    const now = new Date()
    const currentHour = now.getUTCHours()
    const is6AM = currentHour === 6

    // Get all active challenges with today's deadline
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data: challenges, error: challengeError } = await supabase
      .from('user_challenges')
      .select(`
        id,
        user_id,
        challenge_title,
        next_upload_deadline,
        users!user_id(email, name)
      `)
      .eq('status', 'active')
      .gte('next_upload_deadline', today.toISOString())
      .lt('next_upload_deadline', tomorrow.toISOString())

    if (challengeError) {
      console.error('Error fetching challenges:', challengeError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!challenges || challenges.length === 0) {
      console.log('✅ No challenges with today deadline')
      return NextResponse.json({ success: true, message: 'No reminders needed' })
    }

    let remindersSent = 0
    let skipped = 0

    // Process each challenge
    for (const challenge of challenges) {
      try {
        const user = (challenge.users as any)
        if (!user?.email) {
          console.log(`⏭️ Skipping challenge ${challenge.id} - no email`)
          skipped++
          continue
        }

        // Check if today's upload exists
        const { data: todayUpload } = await supabase
          .from('challenge_uploads')
          .select('id')
          .eq('challenge_id', challenge.id)
          .gte('upload_date', today.toISOString())
          .lt('upload_date', tomorrow.toISOString())
          .single()

        // Skip if already uploaded
        if (todayUpload) {
          console.log(`✅ Challenge ${challenge.id} already uploaded`)
          skipped++
          continue
        }

        // Determine message based on time
        let emailSubject: string
        let emailBody: string

        if (is6AM) {
          emailSubject = `⏰ Good Morning! Don't forget your daily upload: ${challenge.challenge_title}`
          emailBody = `
            <h2>Good Morning, ${user.name || 'there'}!</h2>
            <p>Today is the deadline for your <strong>${challenge.challenge_title}</strong> challenge.</p>
            <p>📹 Don't forget to upload your video to YouTube today!</p>
            <p>Upload your video and we'll automatically detect it. You'll earn points and keep your streak going!</p>
            <div style="margin-top: 20px; padding: 15px; background-color: #f0f9ff; border-radius: 8px;">
              <p><strong>What to do:</strong></p>
              <ul>
                <li>Upload your video to YouTube</li>
                <li>We'll automatically detect it in your dashboard</li>
                <li>Earn points and continue your streak</li>
              </ul>
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              This is your 6 AM daily reminder. You have until end of day to upload.
            </p>
          `
        } else {
          emailSubject = `⚠️ Reminder: Your daily video upload deadline is today!`
          emailBody = `
            <h2>Quick Reminder</h2>
            <p>Hi ${user.name || 'there'},</p>
            <p>Don't forget! Today is the deadline for your <strong>${challenge.challenge_title}</strong> challenge.</p>
            <p>📹 Upload your video to YouTube now to maintain your streak!</p>
            <div style="margin-top: 20px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://yt-ai.vercel.app'}/dashboard" 
                 style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Go to Dashboard
              </a>
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              This is an hourly reminder. Upload your video to stop receiving these reminders.
            </p>
          `
        }

        // Send email
        await sgMail.send({
          to: user.email,
          from: process.env.SENDGRID_FROM_EMAIL || 'noreply@yt-ai.com',
          subject: emailSubject,
          html: emailBody
        })

        remindersSent++
        console.log(`📧 Reminder sent to ${user.email} for challenge ${challenge.id}`)
      } catch (error: any) {
        console.error(`Error processing challenge ${challenge.id}:`, error)
      }
    }

    console.log(`✅ Cron completed: ${remindersSent} sent, ${skipped} skipped`)

    return NextResponse.json({
      success: true,
      remindersSent,
      skipped,
      type: is6AM ? 'morning-reminder' : 'hourly-reminder'
    })
  } catch (error: any) {
    console.error('❌ Cron error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
