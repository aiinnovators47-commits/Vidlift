import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

// This endpoint should be called hourly to process pending notifications
// GET /api/challenges/cron/process-notifications
export async function GET(req: NextRequest) {
  try {
    // Verify this is a legitimate cron call
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // Also support a `token` query param for schedulers that cannot set headers (eg. UptimeRobot free)
    const url = new URL(req.url)
    const token = url.searchParams.get('token')

    if (cronSecret && authHeader !== `Bearer ${cronSecret}` && token !== cronSecret) {
      console.warn('Unauthorized cron call - missing or invalid token/header')
      return NextResponse.json({ error: 'Unauthorized - invalid cron token or header' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()
    console.log('📧 Processing pending notifications...')

    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Get pending notifications that need to be sent
    const { data: pendingNotifications, error } = await supabase
      .from('challenge_notifications')
      .select(`
        id,
        challenge_id,
        notification_type,
        email_content,
        retry_count,
        user_challenges!inner(
          id,
          challenge_title,
          users!inner(email, display_name)
        )
      `)
      .eq('email_status', 'pending')
      .lte('next_reminder_date', new Date().toISOString())
      .lt('retry_count', 3) // Max 3 retries

    if (error) {
      console.error('Error fetching pending notifications:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    console.log(`📋 Found ${pendingNotifications?.length || 0} pending notifications`)

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return NextResponse.json({ 
        message: 'No pending notifications to process',
        results 
      })
    }

    // Process each notification
    for (const notification of pendingNotifications) {
      try {
        results.processed++
        await processNotification(supabase, notification, results)
      } catch (error: any) {
        console.error(`Error processing notification ${notification.id}:`, error)
        results.errors.push(`Notification ${notification.id}: ${error.message}`)
        results.failed++

        // Update retry count
        await supabase
          .from('challenge_notifications')
          .update({
            retry_count: notification.retry_count + 1,
            email_status: notification.retry_count >= 2 ? 'failed' : 'pending',
            next_reminder_date: new Date(Date.now() + 60 * 60 * 1000).toISOString() // Retry in 1 hour
          })
          .eq('id', notification.id)
      }
    }

    // Clean up old notifications (older than 30 days)
    await supabase
      .from('challenge_notifications')
      .delete()
      .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    console.log('✅ Notification processing completed:', results)

    return NextResponse.json({
      message: 'Notification processing completed',
      results
    })

  } catch (error: any) {
    console.error('Notification cron job error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function processNotification(supabase: any, notification: any, results: any) {
  const { challenge_id, notification_type, email_content } = notification
  const userEmail = notification.user_challenges?.users?.email
  const userName = notification.user_challenges?.users?.display_name || 'Creator'
  const challengeTitle = notification.user_challenges?.challenge_title

  if (!userEmail) {
    throw new Error('No user email found')
  }

  let emailSent = false

  // Import email functions dynamically to avoid circular imports
  const { 
    sendUploadReminderEmail,
    sendMissedUploadEmail,
    sendStreakAchievementEmail,
    sendChallengeCompletionEmail,
    sendChallengeWelcomeEmail
  } = await import('@/lib/challengeEmailService')

  try {
    // Get challenge data for context
    const { data: challenge } = await supabase
      .from('user_challenges')
      .select('*')
      .eq('id', challenge_id)
      .single()

    if (!challenge) {
      throw new Error('Challenge not found')
    }

    const emailContext = {
      userEmail,
      userName,
      challenge,
      ...email_content
    }

    // Send appropriate email based on notification type
    switch (notification_type) {
      case 'welcome':
        await sendChallengeWelcomeEmail(emailContext)
        emailSent = true
        break
        
      case 'reminder':
        await sendUploadReminderEmail(emailContext)
        emailSent = true
        break
        
      case 'missed':
        await sendMissedUploadEmail(emailContext)
        emailSent = true
        break
        
      case 'streak':
        await sendStreakAchievementEmail(emailContext)
        emailSent = true
        break
        
      case 'completion':
        await sendChallengeCompletionEmail(emailContext)
        emailSent = true
        break
        
      default:
        console.warn(`Unknown notification type: ${notification_type}`)
        break
    }

    if (emailSent) {
      // Mark as sent
      await supabase
        .from('challenge_notifications')
        .update({
          email_status: 'sent',
          sent_date: new Date().toISOString()
        })
        .eq('id', notification.id)

      results.sent++
      console.log(`📧 ${notification_type} email sent to ${userEmail}`)
    }

  } catch (error: any) {
    console.error(`Failed to send ${notification_type} email to ${userEmail}:`, error)
    throw error
  }
}