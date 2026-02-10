import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET /api/leaderboard - Get challenge leaderboard rankings
export async function GET(req: Request) {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const timeframe = searchParams.get('timeframe') || 'all' // all, week, month
    
    const supabase = createServerSupabaseClient()

    // Get leaderboard data from view or calculate it
    const { data: leaderboardData, error } = await supabase
      .from('user_challenge_stats')
      .select(`
        user_id,
        total_points,
        completed_challenges,
        current_streak,
        longest_streak,
        total_videos_uploaded,
        level_title,
        users!inner(id, name, email)
      `)
      .order('total_points', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('Error fetching leaderboard:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Format leaderboard with rankings
    const leaderboard = leaderboardData?.map((entry, index) => ({
      rank: index + 1,
      userId: entry.user_id,
      userName: entry.users.name || entry.users.email.split('@')[0],
      userEmail: entry.users.email,
      totalPoints: entry.total_points || 0,
      completedChallenges: entry.completed_challenges || 0,
      currentStreak: entry.current_streak || 0,
      longestStreak: entry.longest_streak || 0,
      totalVideos: entry.total_videos_uploaded || 0,
      levelTitle: entry.level_title || 'Beginner',
      isCurrentUser: entry.user_id === auth.userId
    })) || []

    // Find current user's rank if not in top results
    const currentUserEntry = leaderboard.find(entry => entry.userId === auth.userId)
    let currentUserRank = null

    if (!currentUserEntry) {
      // Get user's stats separately
      const { data: userStats } = await supabase
        .from('user_challenge_stats')
        .select('total_points')
        .eq('user_id', auth.userId)
        .single()
      
      if (userStats) {
        // Count how many users have more points
        const { count } = await supabase
          .from('user_challenge_stats')
          .select('*', { count: 'exact', head: true })
          .gt('total_points', userStats.total_points)
        
        currentUserRank = {
          rank: (count || 0) + 1,
          totalPoints: userStats.total_points
        }
      }
    }

    return NextResponse.json({
      leaderboard,
      currentUser: currentUserEntry || currentUserRank,
      totalUsers: leaderboard.length
    })
  } catch (err: any) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
