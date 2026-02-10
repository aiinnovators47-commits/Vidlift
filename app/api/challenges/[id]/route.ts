import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// DELETE /api/challenges/:id - Delete a challenge
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please log in to delete a challenge' },
        { status: 401 }
      )
    }

    const supabase = createServerSupabaseClient()
    const challengeId = params.id

    if (!challengeId) {
      return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 })
    }

    // Verify the challenge belongs to the user
    const { data: challenge, error: fetchError } = await supabase
      .from('user_challenges')
      .select('id, user_id, status')
      .eq('id', challengeId)
      .single()

    if (fetchError || !challenge) {
      console.error('❌ Challenge fetch error:', fetchError)
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    if (challenge.user_id !== auth.userId) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You can only delete your own challenges' },
        { status: 403 }
      )
    }

    // Delete the challenge (primary row)
    const { error: deleteError } = await supabase
      .from('user_challenges')
      .delete()
      .eq('id', challengeId)

    if (deleteError) {
      console.error('❌ Challenge delete error:', deleteError)
      return NextResponse.json({ error: deleteError.message || 'Failed to delete challenge' }, { status: 500 })
    }

    console.log('✅ Challenge deleted successfully:', challengeId)

    // Also remove any related rows (uploads, notifications, achievements) to be safe
    try {
      const { error: uploadsError } = await supabase
        .from('challenge_uploads')
        .delete()
        .eq('challenge_id', challengeId)

      if (uploadsError) console.warn('Could not delete challenge_uploads:', uploadsError)

      const { error: notifError } = await supabase
        .from('challenge_notifications')
        .delete()
        .eq('challenge_id', challengeId)

      if (notifError) console.warn('Could not delete challenge_notifications:', notifError)

      const { error: achievementsError } = await supabase
        .from('challenge_achievements')
        .delete()
        .eq('challenge_id', challengeId)

      if (achievementsError) console.warn('Could not delete challenge_achievements:', achievementsError)
    } catch (e) {
      console.error('Error cleaning up related challenge rows:', e)
    }

    // Refresh user stats (trigger should have updated stats but fetch fresh value)
    const { data: updatedStats } = await supabase
      .from('user_challenge_stats')
      .select('active_challenges, total_challenges, total_points')
      .eq('user_id', auth.userId)
      .single()

    return NextResponse.json({
      message: 'Challenge deleted successfully',
      activeChallengeCount: updatedStats?.active_challenges || 0,
      totalChallenges: updatedStats?.total_challenges || 0,
      totalPoints: updatedStats?.total_points || 0
    })
  } catch (err: any) {
    console.error('challenge DELETE unexpected', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
