import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET /api/user/points - Get user's total points and stats
export async function GET(req: Request) {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()
    
    // Get user's total points from user_challenges table
    const { data: challenges, error: challengesError } = await supabase
      .from('user_challenges')
      .select('points_earned, status, streak_count, longest_streak')
      .eq('user_id', auth.userId)
    
    if (challengesError) {
      console.error('Error fetching user challenges:', challengesError)
      return NextResponse.json({ error: challengesError.message }, { status: 500 })
    }
    
    // Calculate total points
    const totalPoints = challenges?.reduce((sum, challenge) => sum + (challenge.points_earned || 0), 0) || 0
    
    // Count active and completed challenges
    const activeChallenges = challenges?.filter(c => c.status === 'active').length || 0
    const completedChallenges = challenges?.filter(c => c.status === 'completed').length || 0
    
    // Get user's streak information
    const longestStreak = Math.max(...(challenges?.map(c => c.longest_streak || 0) || [0]))
    const currentStreak = Math.max(...(challenges?.map(c => c.streak_count || 0) || [0]))
    
    return NextResponse.json({
      totalPoints,
      activeChallenges,
      completedChallenges,
      currentStreak,
      longestStreak,
      totalChallenges: challenges?.length || 0
    })
    
  } catch (err: any) {
    console.error('Unexpected error in points API:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}