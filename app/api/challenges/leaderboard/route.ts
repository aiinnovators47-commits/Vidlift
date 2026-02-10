import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET /api/challenges/leaderboard - Get challenge leaderboard
export async function GET(req: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || 'all-time' // all-time, monthly, weekly
    const limit = parseInt(searchParams.get('limit') || '10')
    
    // Build leaderboard from user_challenge_stats table
    // This is a fallback since the view might not exist
    const { data: leaderboard, error } = await supabase
      .from('user_challenge_stats')
      .select(`
        user_id,
        total_points,
        completed_challenges,
        current_streak,
        longest_streak,
        level_title,
        achievements,
        users!inner(
          id,
          email,
          display_name
        )
      `)
      .gt('total_points', 0)
      .order('total_points', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('leaderboard GET error', error)
      // Fallback: return empty leaderboard if table doesn't exist
      if (error.code === 'PGRST205') {
        return NextResponse.json({
          leaderboard: [],
          totalParticipants: 0,
          period,
          lastUpdated: new Date().toISOString(),
          message: 'Leaderboard not yet populated'
        })
      }
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
    
    // Transform data to match expected format
    const transformedLeaderboard = leaderboard?.map((entry, index) => ({
      user_id: entry.user_id,
      email: entry.users?.email,
      display_name: entry.users?.display_name || 'Anonymous Creator',
      total_points: entry.total_points,
      completed_challenges: entry.completed_challenges,
      current_streak: entry.current_streak,
      longest_streak: entry.longest_streak,
      level_title: entry.level_title,
      achievements: entry.achievements,
      rank: index + 1
    })) || []

    return NextResponse.json({
      leaderboard: transformedLeaderboard,
      totalParticipants: transformedLeaderboard.length,
      period,
      lastUpdated: new Date().toISOString()
    })
    
  } catch (err: any) {
    console.error('leaderboard GET unexpected', err)
    // Return graceful error with empty leaderboard
    return NextResponse.json({ 
      error: 'Failed to fetch leaderboard',
      leaderboard: [],
      totalParticipants: 0
    }, { status: 200 })
  }
}

// GET /api/challenges/achievements - Get user achievements
export async function POST(req: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const body = await req.json()
    const { userId, challengeId } = body
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    let query = supabase
      .from('challenge_achievements')
      .select('*')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false })
    
    if (challengeId) {
      query = query.eq('challenge_id', challengeId)
    }
    
    const { data: achievements, error } = await query
    
    if (error) {
      console.error('achievements GET error', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
    
    // Get achievement stats
    const totalPoints = achievements?.reduce((sum, a) => sum + (a.points_awarded || 0), 0) || 0
    const achievementTypes = [...new Set(achievements?.map(a => a.achievement_type) || [])]
    
    return NextResponse.json({
      achievements: achievements || [],
      totalAchievements: achievements?.length || 0,
      totalAchievementPoints: totalPoints,
      uniqueAchievements: achievementTypes.length
    })
    
  } catch (err: any) {
    console.error('achievements POST unexpected', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}