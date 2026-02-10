import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import { Challenge, CHALLENGE_TEMPLATES, calculateNextDeadline, calculateProgress } from '@/types/challenge'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/challenges - Get all challenges for user
export async function GET(req: Request) {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth) {
      console.warn('⚠️ GET /api/challenges: No authenticated user')
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please log in to access challenges' },
        { status: 401 }
      )
    }

    console.log('✅ GET /api/challenges: Auth successful for user:', auth.userId)
    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') // active, completed, all
    const includeUploads = searchParams.get('includeUploads') === 'true'
    
    // Build the select query
    let selectString = `
      id,
      user_id,
      challenge_id,
      challenge_title,
      challenge_description,
      challenge_type_enum,
      started_at,
      config,
      progress,
      status,
      points_earned,
      streak_count,
      longest_streak,
      missed_days,
      completion_percentage,
      next_upload_deadline,
      duration_months,
      cadence_every_days,
      videos_per_cadence,
      video_type,
      category_niche,
      timezone,
      email_notifications_enabled,
      leaderboard_visible,
      created_at,
      updated_at
    `
    
    // Add challenge_uploads relationship if requested
    if (includeUploads) {
      selectString += ',challenge_uploads(*)'
    }
    
    let query = supabase
      .from('user_challenges')
      .select(selectString)
      .eq('user_id', auth.userId)
    
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    
    const { data: challenges, error } = await query.order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ challenges GET error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      return NextResponse.json({ error: error.message || 'Database error' }, { status: 500 })
    }
    
    // Calculate progress for each challenge
    const challengesWithProgress = [];
    
    if (challenges && challenges.length > 0) {
      for (const challenge of challenges) {
        // Handle potential error objects
        if ((challenge as any).error) {
          challengesWithProgress.push(challenge);
          continue;
        }
        
        const progress = calculateProgress(challenge as unknown as Challenge);
        const challengeAny = challenge as any;
        
        challengesWithProgress.push({
          ...challengeAny,
          // Map snake_case to camelCase for frontend
          userId: challengeAny.user_id,
          challengeId: challengeAny.challenge_id,
          challengeTitle: challengeAny.challenge_title,
          challengeDescription: challengeAny.challenge_description,
          challengeType: challengeAny.challenge_type_enum,
          startedAt: challengeAny.started_at,
          pointsEarned: challengeAny.points_earned,
          streakCount: challengeAny.streak_count,
          longestStreak: challengeAny.longest_streak,
          missedDays: challengeAny.missed_days,
          completionPercentage: challengeAny.completion_percentage,
          nextUploadDeadline: challengeAny.next_upload_deadline,
          durationMonths: challengeAny.duration_months,
          cadenceEveryDays: challengeAny.cadence_every_days,
          videosPerCadence: challengeAny.videos_per_cadence,
          videoType: challengeAny.video_type,
          categoryNiche: challengeAny.category_niche,
          emailNotificationsEnabled: challengeAny.email_notifications_enabled,
          leaderboardVisible: challengeAny.leaderboard_visible,
          createdAt: challengeAny.created_at,
          updatedAt: challengeAny.updated_at,
          uploads: challengeAny.challenge_uploads || [],
          progress: {
            ...progress,
            ...challengeAny.progress
          }
        });
      }
    }
    
    return NextResponse.json({ 
      challenges: challengesWithProgress || [],
      count: challengesWithProgress?.length || 0
    })
  } catch (err: any) {
    console.error('challenges GET unexpected', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// POST /api/challenges - Create new challenge
export async function POST(req: Request) {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please log in to create a challenge' },
        { status: 401 }
      )
    }

    const supabase = createServerSupabaseClient()
    const body = await req.json()
    
    const {
      challengeType,
      title,
      description,
      startDate,
      videoType,
      categoryNiche,
      timezone = 'UTC',
      emailNotifications = true,
      leaderboardVisible = true,
      customConfig
    } = body
    
    // Get challenge template or use custom config
    const template = CHALLENGE_TEMPLATES[challengeType as keyof typeof CHALLENGE_TEMPLATES]
    if (!template && !customConfig) {
      return NextResponse.json({ error: 'Invalid challenge type and no custom config provided' }, { status: 400 })
    }
    
    const config = customConfig || template
    const challengeId = `${challengeType || 'custom'}-${Date.now()}`
    
    // Calculate the upload schedule
    const start = new Date(startDate)
    const schedule = []
    const totalDays = config.durationDays
    let currentDate = new Date(start)
    
    for (let day = 0; day < totalDays; day += config.uploadFrequencyDays) {
      schedule.push({
        day: day + 1,
        date: new Date(currentDate).toISOString(),
        uploaded: false,
        videoId: null,
        videoTitle: null,
        points: 0
      })
      currentDate.setDate(currentDate.getDate() + config.uploadFrequencyDays)
    }
    
    // Calculate first deadline
    const nextDeadline = calculateNextDeadline(startDate, config.uploadFrequencyDays, 0)
    
    const challengeData = {
      user_id: auth.userId,
      challenge_id: challengeId,
      challenge_title: title || config.title,
      challenge_description: description || config.description,
      challenge_type_enum: challengeType || 'custom',
      started_at: startDate,
      config: {
        ...config,
        videoType,
        categoryNiche,
        timezone,
        emailNotifications,
        leaderboardVisible
      },
      progress: schedule,
      status: 'active',
      points_earned: 0,
      streak_count: 0,
      longest_streak: 0,
      missed_days: 0,
      completion_percentage: 0,
      next_upload_deadline: nextDeadline.toISOString(),
      duration_months: Math.ceil(config.durationDays / 30),
      cadence_every_days: config.uploadFrequencyDays,
      videos_per_cadence: config.videosPerUpload,
      video_type: videoType,
      category_niche: categoryNiche,
      timezone,
      email_notifications_enabled: emailNotifications,
      leaderboard_visible: leaderboardVisible,
      // Auto-enable interval motivational emails (every 60 minutes)
      interval_email_enabled: emailNotifications, // Enable if user wants email notifications
      interval_minutes: 60, // Send motivational emails every 60 minutes (1 hour)
      last_interval_email_sent: null, // Will be set when first email is sent
      updated_at: new Date().toISOString()
    }
    
    const { data: newChallenge, error } = await supabase
      .from('user_challenges')
      .insert(challengeData)
      .select()
      .single()
    
    if (error) {
      console.error('❌ challenge POST error:', {
        message: error.message,
        details: error.details,
        code: error.code,
        hint: error.hint
      })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('✅ Challenge created successfully:', newChallenge.id)
    
    // Schedule welcome email notification and try to send immediately
    const { data: insertedNotif, error: notifError } = await supabase.from('challenge_notifications').insert({
      challenge_id: newChallenge.id,
      notification_type: 'welcome',
      next_reminder_date: new Date(Date.now() + 2 * 60 * 1000).toISOString(), // 2 minutes from now
      email_content: {
        challengeTitle: title || config.title,
        startDate,
        config
      },
      ui_url: '/challenge'
    }).select().single()

    if (notifError) {
      console.warn('⚠️ Failed to create welcome notification:', notifError.message)
      // Don't fail the whole request if notification fails
    }

    // If notifications are enabled for this challenge, attempt to send the welcome email immediately
    if (emailNotifications) {
      try {
        const { sendChallengeWelcomeEmail } = await import('@/lib/challengeEmailService')
        await sendChallengeWelcomeEmail({ userEmail: auth.email, userName: auth.name, challenge: newChallenge })

        // Mark notification as sent to avoid double-send via cron
        if (insertedNotif?.id) {
          await supabase.from('challenge_notifications').update({ email_status: 'sent', sent_date: new Date().toISOString() }).eq('id', insertedNotif.id)
        }

        console.log('✅ Welcome email sent immediately to', auth.email)
      } catch (e: any) {
        console.warn('⚠️ Immediate welcome email failed (will be retried by cron):', e?.message || e)
      }
    }
    
    return NextResponse.json({ 
      challenge: newChallenge,
      message: 'Challenge created successfully!'
    })
  } catch (err: any) {
    console.error('challenge POST unexpected', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// PUT /api/challenges - Update challenge
export async function PUT(req: Request) {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please log in to update a challenge' },
        { status: 401 }
      )
    }
    
    const supabase = createServerSupabaseClient()
    const userRow = { id: auth.userId }
    const body = await req.json()
    
    const { challengeId, status, progress, config } = body
    
    if (!challengeId) {
      return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 })
    }
    
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    
    if (status) updateData.status = status
    if (progress) updateData.progress = progress
    if (config) updateData.config = config
    
    // If marking as completed, award completion bonus
    if (status === 'completed') {
      const { data: challenge } = await supabase
        .from('user_challenges')
        .select('points_earned, missed_days')
        .eq('id', challengeId)
        .eq('user_id', userRow.id)
        .single()
      
      if (challenge) {
        const completionBonus = challenge.missed_days === 0 ? 1000 : 500 // Perfect challenge bonus
        updateData.points_earned = (challenge.points_earned || 0) + completionBonus
        updateData.completion_percentage = 100
      }
    }
    
    const { data: updatedChallenge, error } = await supabase
      .from('user_challenges')
      .update(updateData)
      .eq('id', challengeId)
      .eq('user_id', userRow.id)
      .select()
      .single()
    
    if (error) {
      console.error('challenge PUT error', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ 
      challenge: updatedChallenge,
      message: 'Challenge updated successfully!'
    })
  } catch (err: any) {
    console.error('challenge PUT unexpected', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// DELETE /api/challenges - Delete challenge
export async function DELETE(req: Request) {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please log in to delete a challenge' },
        { status: 401 }
      )
    }
    
    const supabase = createServerSupabaseClient()
    const userRow = { id: auth.userId }
    const { searchParams } = new URL(req.url)
    const challengeId = searchParams.get('id')
    
    if (!challengeId) {
      return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('user_challenges')
      .delete()
      .eq('id', challengeId)
      .eq('user_id', userRow.id)
    
    if (error) {
      console.error('challenge DELETE error', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ message: 'Challenge deleted successfully!' })
  } catch (err: any) {
    console.error('challenge DELETE unexpected', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}