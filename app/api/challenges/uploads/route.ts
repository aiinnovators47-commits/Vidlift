import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/challenges/uploads
 * Get all uploads for a specific challenge
 * Shows real-time upload data with videos, points, dates
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
      .select('id, user_id, challenge_title')
      .eq('id', challengeId)
      .eq('user_id', auth.userId)
      .single()

    if (challengeError || !challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    // Get all uploads for this challenge, ordered by date
    const { data: uploads, error: uploadsError } = await supabase
      .from('challenge_uploads')
      .select('*')
      .eq('challenge_id', challengeId)
      .order('upload_date', { ascending: false })

    if (uploadsError) {
      return NextResponse.json({ error: 'Failed to fetch uploads' }, { status: 500 })
    }

    // Transform to camelCase for frontend
    const transformedUploads = (uploads || []).map(upload => ({
      id: upload.id,
      challengeId: upload.challenge_id,
      videoId: upload.video_id,
      videoTitle: upload.video_title,
      videoUrl: upload.video_url,
      uploadDate: upload.upload_date,
      scheduledDate: upload.scheduled_date,
      onTimeStatus: upload.on_time_status,
      pointsEarned: upload.points_earned,
      createdAt: upload.created_at
    }))

    // Calculate statistics
    const totalUploads = transformedUploads.length
    const totalPoints = transformedUploads.reduce((sum, u) => sum + (u.pointsEarned || 0), 0)
    const onTimeCount = transformedUploads.filter(u => u.onTimeStatus).length
    const lateCount = transformedUploads.filter(u => !u.onTimeStatus).length

    return NextResponse.json({
      success: true,
      challenge: {
        id: challenge.id,
        title: challenge.challenge_title
      },
      uploads: transformedUploads,
      stats: {
        totalUploads,
        totalPoints,
        onTimeCount,
        lateCount,
        onTimePercentage: totalUploads > 0 ? Math.round((onTimeCount / totalUploads) * 100) : 0
      }
    })
  } catch (error: any) {
    console.error('❌ Get uploads error:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}
