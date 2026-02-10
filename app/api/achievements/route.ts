import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { getUserAchievements, getChallengeAchievements } from '@/lib/achievementService'

export const dynamic = 'force-dynamic'

// GET /api/achievements - Get user's achievements
export async function GET(req: Request) {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const challengeId = searchParams.get('challengeId')

    let achievements
    if (challengeId) {
      // Get achievements for specific challenge
      achievements = await getChallengeAchievements(auth.userId, challengeId)
    } else {
      // Get all user achievements
      achievements = await getUserAchievements(auth.userId)
    }

    return NextResponse.json({
      achievements,
      count: achievements.length
    })

  } catch (err: any) {
    console.error('achievements GET error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}