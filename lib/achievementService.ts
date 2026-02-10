import { createServerSupabaseClient } from '@/lib/supabase'
import { createAchievementNotification } from '@/lib/notificationService'

export interface Achievement {
  id: string
  userId: string
  challengeId: string
  achievementType: string
  achievementTitle: string
  achievementDescription: string
  pointsAwarded: number
  unlockedAt: string
}

export interface AchievementDefinition {
  type: string
  title: string
  description: string
  points: number
  condition: (userData: any) => boolean
}

// Predefined achievement definitions
export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    type: 'first_upload',
    title: 'First Steps',
    description: 'Upload your first video in a challenge',
    points: 50,
    condition: (userData) => userData.totalUploads >= 1
  },
  {
    type: 'streak_7',
    title: 'Weekly Warrior',
    description: 'Maintain a 7-day upload streak',
    points: 100,
    condition: (userData) => userData.currentStreak >= 7
  },
  {
    type: 'streak_14',
    title: 'Fortnight Fighter',
    description: 'Maintain a 14-day upload streak',
    points: 200,
    condition: (userData) => userData.currentStreak >= 14
  },
  {
    type: 'streak_30',
    title: 'Monthly Master',
    description: 'Maintain a 30-day upload streak',
    points: 500,
    condition: (userData) => userData.currentStreak >= 30
  },
  {
    type: 'perfect_week',
    title: 'Perfect Week',
    description: 'Complete a full week without missing any uploads',
    points: 150,
    condition: (userData) => userData.missedDaysInPeriod === 0 && userData.daysInPeriod >= 7
  },
  {
    type: 'challenge_master',
    title: 'Challenge Master',
    description: 'Complete your first challenge with 100% success rate',
    points: 1000,
    condition: (userData) => userData.challengeCompleted && userData.missedDays === 0
  },
  {
    type: 'upload_10',
    title: 'Deca-Poster',
    description: 'Upload 10 videos in a single challenge',
    points: 250,
    condition: (userData) => userData.totalUploads >= 10
  },
  {
    type: 'upload_25',
    title: 'Quarter Century',
    description: 'Upload 25 videos in a single challenge',
    points: 500,
    condition: (userData) => userData.totalUploads >= 25
  },
  {
    type: 'upload_50',
    title: 'Golden Fifty',
    description: 'Upload 50 videos in a single challenge',
    points: 1000,
    condition: (userData) => userData.totalUploads >= 50
  },
  {
    type: 'early_bird',
    title: 'Early Bird',
    description: 'Upload 5 videos before their deadline',
    points: 200,
    condition: (userData) => userData.earlyUploads >= 5
  }
]

/**
 * Check and unlock achievements for a user
 */
export async function checkAndUnlockAchievements(userId: string, challengeId: string): Promise<Achievement[]> {
  try {
    const supabase = createServerSupabaseClient()
    
    // Get user's current challenge data
    const { data: challengeData, error: challengeError } = await supabase
      .from('user_challenges')
      .select(`
        id,
        streak_count,
        longest_streak,
        missed_days,
        points_earned,
        uploads:challenge_uploads(count)
      `)
      .eq('id', challengeId)
      .eq('user_id', userId)
      .single()

    if (challengeError || !challengeData) {
      console.error('Error fetching challenge data:', challengeError)
      return []
    }

    // Get user's upload timing data for early bird achievement
    const { data: uploadTimingData } = await supabase
      .from('challenge_uploads')
      .select('on_time_status')
      .eq('challenge_id', challengeId)
      .eq('on_time_status', 'early')

    const userData = {
      totalUploads: challengeData.uploads?.[0]?.count || 0,
      currentStreak: challengeData.streak_count || 0,
      longestStreak: challengeData.longest_streak || 0,
      missedDays: challengeData.missed_days || 0,
      pointsEarned: challengeData.points_earned || 0,
      earlyUploads: uploadTimingData?.length || 0,
      challengeCompleted: false, // Will be set based on challenge status
      missedDaysInPeriod: 0, // Will be calculated
      daysInPeriod: 7 // Default week period
    }

    // Get already unlocked achievements for this user
    const { data: existingAchievements } = await supabase
      .from('challenge_achievements')
      .select('achievement_type')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)

    const unlockedTypes = new Set(existingAchievements?.map(a => a.achievement_type) || [])
    const newlyUnlocked: Achievement[] = []

    // Check each achievement
    for (const achievementDef of ACHIEVEMENT_DEFINITIONS) {
      // Skip if already unlocked
      if (unlockedTypes.has(achievementDef.type)) {
        continue
      }

      // Check if achievement condition is met
      if (achievementDef.condition(userData)) {
        const newAchievement = await unlockAchievement(
          userId,
          challengeId,
          achievementDef
        )
        if (newAchievement) {
          newlyUnlocked.push(newAchievement)
        }
      }
    }

    // Award points for newly unlocked achievements
    if (newlyUnlocked.length > 0) {
      const totalPoints = newlyUnlocked.reduce((sum, ach) => sum + ach.pointsAwarded, 0)
      await awardAchievementPoints(userId, totalPoints)
    }

    return newlyUnlocked
  } catch (error) {
    console.error('Error checking achievements:', error)
    return []
  }
}

/**
 * Unlock a specific achievement
 */
async function unlockAchievement(
  userId: string,
  challengeId: string,
  achievementDef: AchievementDefinition
): Promise<Achievement | null> {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('challenge_achievements')
      .insert({
        user_id: userId,
        challenge_id: challengeId,
        achievement_type: achievementDef.type,
        achievement_title: achievementDef.title,
        achievement_description: achievementDef.description,
        points_awarded: achievementDef.points
      })
      .select()
      .single()

    if (error) {
      console.error('Error unlocking achievement:', error)
      return null
    }

    console.log(`🎉 Achievement unlocked: ${achievementDef.title} for user ${userId}`)
    
    // Create notification for achievement unlock
    try {
      const { data: challengeData } = await supabase
        .from('user_challenges')
        .select('challenge_title')
        .eq('id', challengeId)
        .single()
      
      await createAchievementNotification(
        userId,
        challengeId,
        achievementDef.title,
        achievementDef.description,
        achievementDef.points,
        challengeData?.challenge_title
      )
    } catch (notificationError) {
      console.warn('Failed to create achievement notification:', notificationError)
    }
    
    return {
      id: data.id,
      userId: data.user_id,
      challengeId: data.challenge_id,
      achievementType: data.achievement_type,
      achievementTitle: data.achievement_title,
      achievementDescription: data.achievement_description,
      pointsAwarded: data.points_awarded,
      unlockedAt: data.unlocked_at
    }
  } catch (error) {
    console.error('Error in unlockAchievement:', error)
    return null
  }
}

/**
 * Award points for achievements
 */
async function awardAchievementPoints(userId: string, points: number) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Update user's total points
    const { error } = await supabase
      .from('user_challenges')
      .update({
        points_earned: Math.max(0, (await getCurrentPoints(userId)) + points)
      })
      .eq('user_id', userId)

    if (error) {
      console.error('Error awarding achievement points:', error)
    } else {
      console.log(`💰 ${points} points awarded for achievements to user ${userId}`)
    }
  } catch (error) {
    console.error('Error in awardAchievementPoints:', error)
  }
}

/**
 * Get user's current points
 */
async function getCurrentPoints(userId: string): Promise<number> {
  try {
    const supabase = createServerSupabaseClient()
    const { data } = await supabase
      .from('user_challenges')
      .select('points_earned')
      .eq('user_id', userId)
    
    return data?.reduce((sum, challenge) => sum + (challenge.points_earned || 0), 0) || 0
  } catch (error) {
    console.error('Error getting current points:', error)
    return 0
  }
}

/**
 * Get all achievements for a user
 */
export async function getUserAchievements(userId: string): Promise<Achievement[]> {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('challenge_achievements')
      .select('*')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false })

    if (error) {
      console.error('Error fetching user achievements:', error)
      return []
    }

    return data?.map(ach => ({
      id: ach.id,
      userId: ach.user_id,
      challengeId: ach.challenge_id,
      achievementType: ach.achievement_type,
      achievementTitle: ach.achievement_title,
      achievementDescription: ach.achievement_description,
      pointsAwarded: ach.points_awarded,
      unlockedAt: ach.unlocked_at
    })) || []
  } catch (error) {
    console.error('Error in getUserAchievements:', error)
    return []
  }
}

/**
 * Get achievements for a specific challenge
 */
export async function getChallengeAchievements(userId: string, challengeId: string): Promise<Achievement[]> {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('challenge_achievements')
      .select('*')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .order('unlocked_at', { ascending: false })

    if (error) {
      console.error('Error fetching challenge achievements:', error)
      return []
    }

    return data?.map(ach => ({
      id: ach.id,
      userId: ach.user_id,
      challengeId: ach.challenge_id,
      achievementType: ach.achievement_type,
      achievementTitle: ach.achievement_title,
      achievementDescription: ach.achievement_description,
      pointsAwarded: ach.points_awarded,
      unlockedAt: ach.unlocked_at
    })) || []
  } catch (error) {
    console.error('Error in getChallengeAchievements:', error)
    return []
  }
}