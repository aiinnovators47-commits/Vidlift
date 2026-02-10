import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * POST /api/challenges/refresh-deadline
 * Recalculates and updates the next_upload_deadline for a user's active challenge
 */
export async function POST(req: Request) {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()
    const { challengeId } = await req.json()

    if (!challengeId) {
      return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 })
    }

    // Get the challenge
    const { data: challenge, error: fetchError } = await supabase
      .from('user_challenges')
      .select('*, challenge_uploads(*)')
      .eq('id', challengeId)
      .eq('user_id', auth.userId)
      .single()

    if (fetchError || !challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    // Calculate next deadline
    const startDate = new Date(challenge.started_at)
    const uploadsCount = challenge.challenge_uploads?.length || 0
    const frequency = challenge.cadence_every_days || 1

    // Next deadline is: start_date + (uploads_count + 1) * frequency
    const nextDeadline = new Date(startDate)
    nextDeadline.setDate(startDate.getDate() + ((uploadsCount + 1) * frequency))

    console.log('📅 Recalculating deadline:', {
      challengeId,
      startDate: startDate.toISOString(),
      uploadsCount,
      frequency,
      nextDeadline: nextDeadline.toISOString()
    })

    // Update the challenge
    const { data: updatedChallenge, error: updateError } = await supabase
      .from('user_challenges')
      .update({
        next_upload_deadline: nextDeadline.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', challengeId)
      .eq('user_id', auth.userId)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating deadline:', updateError)
      return NextResponse.json({ error: 'Failed to update deadline' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      nextDeadline: nextDeadline.toISOString(),
      challenge: {
        ...updatedChallenge,
        nextUploadDeadline: updatedChallenge.next_upload_deadline
      }
    })
  } catch (error: any) {
    console.error('❌ refresh-deadline error:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}
