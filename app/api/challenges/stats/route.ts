import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/challenges/stats - Get user challenge statistics
export async function GET(req: Request) {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth) {
      console.warn('⚠️ GET /api/challenges/stats: No authenticated user')
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please log in to view statistics' },
        { status: 401 }
      )
    }

    console.log('✅ GET /api/challenges/stats: Auth successful for user:', auth.userId)
    const supabase = createServerSupabaseClient()
    
    // Get or create user stats from the user_challenge_stats table
    const { data: stats, error: statsError } = await supabase
      .from('user_challenge_stats')
      .select('*')
      .eq('user_id', auth.userId)
      .maybeSingle()
    
    if (statsError && !statsError.message.includes('No rows found')) {
      console.error('❌ stats GET error:', {
        message: statsError.message,
        details: statsError.details,
        hint: statsError.hint,
        code: statsError.code,
      })
      return NextResponse.json({ error: statsError.message || 'Database error' }, { status: 500 })
    }
    
    // If no stats exist, calculate them from challenges and insert
    if (!stats) {
      console.log('📊 Creating new stats for user...')
      const statsData = await calculateUserStats(supabase, auth.userId)
      
      const { data: newStats, error: insertError } = await supabase
        .from('user_challenge_stats')
        .insert(statsData)
        .select()
        .single()
      
      if (insertError) {
        console.error('❌ stats INSERT error:', insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
      
      return NextResponse.json({ stats: newStats })
    }
    
    return NextResponse.json({ stats })
  } catch (err: any) {
    console.error('stats GET unexpected', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// Helper function to calculate user stats from challenges
async function calculateUserStats(supabase: any, userId: string) {
  const { data: challenges } = await supabase
    .from('user_challenges')
    .select('status, points_earned, streak_count, longest_streak, completion_percentage, id')
    .eq('user_id', userId)
  
  if (!challenges || challenges.length === 0) {
    return {
      user_id: userId,
      total_challenges: 0,
      completed_challenges: 0,
      active_challenges: 0,
      total_points: 0,
      current_streak: 0,
      longest_streak: 0,
      total_videos_uploaded: 0,
      average_completion_rate: 0,
      achievements: [],
      level_title: 'Beginner'
    }
  }
  
  const totalChallenges = challenges.length
  const completedChallenges = challenges.filter((c: any) => c.status === 'completed').length
  const activeChallenges = challenges.filter((c: any) => c.status === 'active').length
  const totalPoints = challenges.reduce((sum: number, c: any) => sum + (c.points_earned || 0), 0)
  const longestStreak = Math.max(...challenges.map((c: any) => c.longest_streak || 0), 0)
  const currentStreaks = challenges.filter((c: any) => c.status === 'active').map((c: any) => c.streak_count || 0)
  const currentStreak = Math.max(...currentStreaks, 0)
  const avgCompletion = challenges.reduce((sum: number, c: any) => sum + (c.completion_percentage || 0), 0) / totalChallenges
  
  // Get total uploads
  const { data: uploads } = await supabase
    .from('challenge_uploads')
    .select('id')
    .in('challenge_id', challenges.map((c: any) => c.id))
  
  // Get user's achievements
  const { data: userAchievements } = await supabase
    .from('challenge_achievements')
    .select('achievement_type')
    .eq('user_id', userId)
  
  const achievementTypes = userAchievements?.map(a => a.achievement_type) || []
  
  // Determine level based on points
  let levelTitle = 'Beginner'
  if (totalPoints >= 10000) levelTitle = 'Legend'
  else if (totalPoints >= 5000) levelTitle = 'Master'
  else if (totalPoints >= 2000) levelTitle = 'Pro'
  else if (totalPoints >= 500) levelTitle = 'Creator'
  
  return {
    user_id: userId,
    total_challenges: totalChallenges,
    completed_challenges: completedChallenges,
    active_challenges: activeChallenges,
    total_points: totalPoints,
    current_streak: currentStreak,
    longest_streak: longestStreak,
    total_videos_uploaded: uploads?.length || 0,
    average_completion_rate: Math.round(avgCompletion * 100) / 100,
    achievements: achievementTypes,
    level_title: levelTitle
  }
}