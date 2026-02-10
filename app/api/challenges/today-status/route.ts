import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/challenges/today-status
 * Check if today's video is uploaded for a challenge
 * Returns upload status, points, and next deadline
 */
export async function GET(req: Request) {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(req.url)
    const challengeId = searchParams.get('challengeId')

    if (!challengeId) {
      return NextResponse.json({ error: 'challengeId is required' }, { status: 400 })
    }

    // Get challenge to verify ownership
    const { data: challenge, error: challengeError } = await supabase
      .from('user_challenges')
      .select('id, user_id, challenge_title, next_upload_deadline, cadence_every_days')
      .eq('id', challengeId)
      .eq('user_id', auth.userId)
      .single()

    if (challengeError || !challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    // Get today's date (start of day)
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    // Check if today's upload exists
    const { data: todayUpload, error: uploadError } = await supabase
      .from('challenge_uploads')
      .select('*')
      .eq('challenge_id', challengeId)
      .gte('upload_date', todayStart.toISOString())
      .lte('upload_date', todayEnd.toISOString())
      .single()

    // Check next deadline
    const nextDeadline = challenge.next_upload_deadline
    const nextDeadlineDate = nextDeadline ? new Date(nextDeadline) : null

    // Calculate if today is deadline
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const isTodayDeadline = nextDeadlineDate && 
      new Date(nextDeadlineDate).toDateString() === today.toDateString()

    return NextResponse.json({
      success: true,
      challenge: {
        id: challenge.id,
        title: challenge.challenge_title
      },
      status: {
        isUploadedToday: !!todayUpload,
        uploadedAt: todayUpload?.upload_date || null,
        pointsEarned: todayUpload?.points_earned || 0,
        onTimeStatus: todayUpload?.on_time_status || false,
        videoTitle: todayUpload?.video_title || null,
        videoUrl: todayUpload?.video_url || null,
        videoId: todayUpload?.video_id || null
      },
      deadline: {
        nextUploadDate: nextDeadline,
        isTodayDeadline,
        daysUntilDeadline: nextDeadlineDate ? 
          Math.ceil((nextDeadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null
      }
    })
  } catch (error: any) {
    console.error('❌ Today status error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
