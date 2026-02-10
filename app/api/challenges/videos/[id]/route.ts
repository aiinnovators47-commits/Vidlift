import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// DELETE /api/challenges/videos/:id - Delete a video upload
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please log in to delete a video' },
        { status: 401 }
      )
    }

    const supabase = createServerSupabaseClient()
    const videoId = params.id

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 })
    }

    // Get the video and verify user owns the challenge
    const { data: video, error: fetchError } = await supabase
      .from('challenge_uploads')
      .select('id, challenge_id')
      .eq('id', videoId)
      .single()

    if (fetchError || !video) {
      console.error('❌ Video fetch error:', fetchError)
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Verify the challenge belongs to the user
    const { data: challenge, error: challengeError } = await supabase
      .from('user_challenges')
      .select('id, user_id')
      .eq('id', video.challenge_id)
      .single()

    if (challengeError || !challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    if (challenge.user_id !== auth.userId) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You can only delete your own videos' },
        { status: 403 }
      )
    }

    // Delete the video
    const { error: deleteError } = await supabase
      .from('challenge_uploads')
      .delete()
      .eq('id', videoId)

    if (deleteError) {
      console.error('❌ Video delete error:', deleteError)
      return NextResponse.json({ error: deleteError.message || 'Failed to delete video' }, { status: 500 })
    }

    console.log('✅ Video deleted successfully:', videoId)

    // Recalculate points and stats for the challenge
    const { data: remainingVideos } = await supabase
      .from('challenge_uploads')
      .select('points_earned')
      .eq('challenge_id', video.challenge_id)

    const totalPoints = remainingVideos?.reduce((sum, v) => sum + v.points_earned, 0) || 0

    // Update challenge stats
    const { error: updateError } = await supabase
      .from('user_challenges')
      .update({
        points_earned: totalPoints,
        updated_at: new Date().toISOString()
      })
      .eq('id', video.challenge_id)

    if (updateError) {
      console.warn('⚠️ Failed to update challenge stats:', updateError)
    }

    return NextResponse.json({
      message: 'Video deleted successfully',
      challenge_id: video.challenge_id,
      new_total_points: totalPoints
    })
  } catch (err: any) {
    console.error('video DELETE unexpected', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
