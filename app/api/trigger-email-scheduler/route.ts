import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { sendIntervalMotivationalEmail } from '@/lib/challengeEmailService'

export const dynamic = 'force-dynamic'

// POST /api/trigger-email-scheduler - Manually trigger interval email check
export async function POST(req: Request) {
  try {
    // For testing - remove authentication requirement
    // const authHeader = req.headers.get('authorization')
    // const cronSecret = process.env.CRON_SECRET || 'dev-secret-key'
    // 
    // if (authHeader !== `Bearer ${cronSecret}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const supabase = createServerSupabaseClient()
    console.log('🔍 Triggering interval email scheduler...')

    // Query active challenges needing interval emails
    const { data: eligibleChallenges, error: queryError } = await supabase
      .from('user_challenges')
      .select(`
        id,
        user_id,
        challenge_title,
        started_at,
        config,
        points_earned,
        streak_count,
        longest_streak,
        missed_days,
        completion_percentage,
        next_upload_deadline,
        interval_minutes,
        last_interval_email_sent,
        users!inner (
          id,
          email,
          name
        )
      `)
      .eq('status', 'active')
      .eq('interval_email_enabled', true)
      .eq('email_notifications_enabled', true)
      .or('last_interval_email_sent.is.null,last_interval_email_sent.lt.' + getTimestampMinutesAgo(1440)) // At least 24 hours for Vercel free plan

    if (queryError) {
      console.error('❌ Database query error:', queryError)
      return NextResponse.json({ error: queryError.message }, { status: 500 })
    }

    if (!eligibleChallenges || eligibleChallenges.length === 0) {
      console.log('✅ No challenges need interval emails right now')
      return NextResponse.json({ 
        success: true, 
        message: 'No challenges need emails',
        emailsSent: 0 
      })
    }

    console.log(`📧 Found ${eligibleChallenges.length} challenge(s) needing emails`)
    
    let emailsSent = 0
    let emailsSkipped = 0
    let errors = 0

    // Process each challenge
    for (const challenge of eligibleChallenges) {
      try {
        // Check if challenge is expired
        const config = challenge.config
        const durationDays = (config?.durationMonths || 2) * 30
        const endDate = new Date(challenge.started_at)
        endDate.setDate(endDate.getDate() + durationDays)
        
        if (new Date() > endDate) {
          console.log(`⏰ Challenge ${challenge.challenge_title} (ID: ${challenge.id}) has expired. Skipping.`)
          continue
        }
        
        // Check if user uploaded video today
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const todayEnd = new Date()
        todayEnd.setHours(23, 59, 59, 999)

        const { data: todayUpload } = await supabase
          .from('challenge_uploads')
          .select('id')
          .eq('challenge_id', challenge.id)
          .gte('upload_date', todayStart.toISOString())
          .lte('upload_date', todayEnd.toISOString())
          .single()

        if (todayUpload) {
          const userArray = Array.isArray(challenge.users) ? challenge.users : [challenge.users];
          const userEmail = userArray[0]?.email || 'unknown@example.com'
          console.log(`⏭️  Skipping motivational email for ${userEmail}: Video already uploaded today`)
          
          // Update last_interval_email_sent to prevent repeated checks
          await supabase
            .from('user_challenges')
            .update({ last_interval_email_sent: new Date().toISOString() })
            .eq('id', challenge.id)
            
          emailsSkipped++
          continue
        }

        // Send motivational email
        const user = Array.isArray(challenge.users) ? challenge.users[0] : challenge.users
        
        if (!user?.email) {
          console.warn(`⚠️  No email found for user ${challenge.user_id}`)
          errors++
          continue
        }

        // Calculate stats
        const targetVideos = Math.ceil((config?.durationMonths || 2) * 30 / (config?.cadenceEveryDays || 1))
        const videosUploaded = Math.round((challenge.completion_percentage || 0) * targetVideos / 100)
        const videosRemaining = targetVideos - videosUploaded
        const daysRemaining = calculateDaysRemaining(challenge.started_at, config?.durationMonths || 2)

        await sendIntervalMotivationalEmail({
          userEmail: user.email,
          userName: user.name || 'Creator',
          challenge: {
            id: challenge.id,
            userId: challenge.user_id,
            challengeId: challenge.id,
            challengeTitle: challenge.challenge_title || 'YouTube Challenge',
            challengeType: config?.videoType || 'Mixed',
            startedAt: challenge.started_at,
            config: config,
            progress: [],
            status: 'active',
            pointsEarned: challenge.points_earned || 0,
            streakCount: challenge.streak_count || 0,
            longestStreak: challenge.longest_streak || 0,
            missedDays: challenge.missed_days || 0,
            completionPercentage: challenge.completion_percentage || 0,
            nextUploadDeadline: challenge.next_upload_deadline,
            uploads: [],
            durationMonths: config?.durationMonths || 2,
            cadenceEveryDays: config?.cadenceEveryDays || 1,
            videosPerCadence: config?.videosPerCadence || 1,
            videoType: config?.videoType || 'Mixed',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          videosUploaded,
          videosRemaining,
          daysRemaining,
          streakCount: challenge.streak_count || 0,
          pointsEarned: challenge.points_earned || 0
        })

        // Update last_sent_time
        await supabase
          .from('user_challenges')
          .update({ last_interval_email_sent: new Date().toISOString() })
          .eq('id', challenge.id)

        console.log(`✅ Email sent to ${user.email} (Challenge: ${challenge.challenge_title})`)
        emailsSent++

      } catch (emailError) {
        console.error(`❌ Error sending email for challenge ${challenge.id}:`, emailError)
        errors++
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Email scheduler completed',
      emailsSent,
      emailsSkipped,
      errors,
      totalProcessed: eligibleChallenges.length
    })

  } catch (error: any) {
    console.error('❌ Trigger email scheduler error:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

function getTimestampMinutesAgo(minutes: number): string {
  const date = new Date()
  date.setMinutes(date.getMinutes() - minutes)
  return date.toISOString()
}

function calculateDaysRemaining(startedAt: string, durationMonths: number): number {
  const start = new Date(startedAt)
  const end = new Date(start)
  end.setMonth(end.getMonth() + durationMonths)
  
  const now = new Date()
  const diffMs = end.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  
  return Math.max(0, diffDays)
}