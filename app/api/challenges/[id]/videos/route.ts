import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/challenges/:id/videos - Get all videos for a challenge
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please log in to view videos' },
        { status: 401 }
      )
    }

    const supabase = createServerSupabaseClient()
    const challengeId = params.id

    if (!challengeId) {
      return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 })
    }

    // Verify the challenge belongs to the user
    const { data: challenge, error: challengeError } = await supabase
      .from('user_challenges')
      .select('id, user_id, challenge_title')
      .eq('id', challengeId)
      .single()

    if (challengeError || !challenge) {
      console.error('❌ Challenge fetch error:', challengeError)
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    if (challenge.user_id !== auth.userId) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You can only view your own challenge videos' },
        { status: 403 }
      )
    }

    // Get all videos for the challenge
    const { data: videos, error: videosError } = await supabase
      .from('challenge_uploads')
      .select('*')
      .eq('challenge_id', challengeId)
      .order('upload_date', { ascending: false })

    if (videosError) {
      console.error('❌ Videos fetch error:', videosError)
      return NextResponse.json({ error: videosError.message || 'Failed to fetch videos' }, { status: 500 })
    }

    console.log(`✅ Fetched ${videos?.length || 0} videos for challenge: ${challengeId}`)

    return NextResponse.json({
      challenge_id: challengeId,
      challenge_title: challenge.challenge_title,
      videos: videos || [],
      count: videos?.length || 0,
      stats: {
        total_videos: videos?.length || 0,
        total_views: videos?.reduce((sum, v) => sum + v.video_views, 0) || 0,
        total_likes: videos?.reduce((sum, v) => sum + v.video_likes, 0) || 0,
        total_comments: videos?.reduce((sum, v) => sum + v.video_comments, 0) || 0,
        total_points: videos?.reduce((sum, v) => sum + v.points_earned, 0) || 0,
        on_time_count: videos?.filter(v => v.on_time_status).length || 0
      }
    })
  } catch (err: any) {
    console.error('videos GET unexpected', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
