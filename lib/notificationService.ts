import { createServerSupabaseClient } from '@/lib/supabase'

export interface NotificationPayload {
  userId: string
  challengeId: string
  notificationType: string
  title: string
  message: string
  url?: string
  metadata?: Record<string, any>
}

/**
 * Create a notification for various events
 */
export async function createNotification(payload: NotificationPayload): Promise<boolean> {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('challenge_notifications')
      .insert({
        user_id: payload.userId,
        challenge_id: payload.challengeId,
        notification_type: payload.notificationType,
        email_content: {
          title: payload.title,
          message: payload.message,
          challengeTitle: payload.metadata?.challengeTitle,
          points: payload.metadata?.points,
          achievementType: payload.metadata?.achievementType
        },
        ui_url: payload.url || `/challenge/${payload.challengeId}`,
        ui_read: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return false
    }

    console.log(`🔔 Notification created: ${payload.notificationType} for user ${payload.userId}`)
    return true
  } catch (error) {
    console.error('Error in createNotification:', error)
    return false
  }
}

/**
 * Create achievement unlocked notification
 */
export async function createAchievementNotification(
  userId: string,
  challengeId: string,
  achievementTitle: string,
  achievementDescription: string,
  pointsAwarded: number,
  challengeTitle?: string
): Promise<boolean> {
  return createNotification({
    userId,
    challengeId,
    notificationType: 'achievement_unlocked',
    title: `🏆 Achievement Unlocked: ${achievementTitle}`,
    message: achievementDescription,
    metadata: {
      challengeTitle,
      points: pointsAwarded,
      achievementType: 'achievement_unlocked'
    }
  })
}

/**
 * Create upload success notification
 */
export async function createUploadSuccessNotification(
  userId: string,
  challengeId: string,
  videoTitle: string,
  pointsEarned: number,
  isOnTime: boolean,
  challengeTitle?: string
): Promise<boolean> {
  const notificationType = isOnTime ? 'upload_success' : 'upload_late'
  const title = isOnTime 
    ? `✅ On-Time Upload: ${videoTitle}`
    : `⏰ Late Upload: ${videoTitle}`
  const message = isOnTime
    ? `Great job uploading on time! You earned ${pointsEarned} points.`
    : `Video uploaded successfully. You earned ${pointsEarned} points.`

  return createNotification({
    userId,
    challengeId,
    notificationType,
    title,
    message,
    metadata: {
      challengeTitle,
      points: pointsEarned,
      videoTitle,
      isOnTime
    }
  })
}

/**
 * Create streak milestone notification
 */
export async function createStreakNotification(
  userId: string,
  challengeId: string,
  streakCount: number,
  challengeTitle?: string
): Promise<boolean> {
  const milestones = [7, 14, 30, 60, 100]
  if (!milestones.includes(streakCount)) return false

  const titles = {
    7: 'Weekly Warrior',
    14: 'Fortnight Fighter',
    30: 'Monthly Master',
    60: 'Double Month Champion',
    100: 'Century Legend'
  }

  const emojis = {
    7: '🔥',
    14: '🧨',
    30: '👑',
    60: '⚡',
    100: '🌟'
  }

  return createNotification({
    userId,
    challengeId,
    notificationType: 'streak_milestone',
    title: `${emojis[streakCount as keyof typeof emojis] || '🎯'} ${titles[streakCount as keyof typeof titles]} Achieved!`,
    message: `Incredible! You've maintained a ${streakCount}-day upload streak.`,
    metadata: {
      challengeTitle,
      streakCount,
      achievementType: 'streak_milestone'
    }
  })
}

/**
 * Create upload milestone notification
 */
export async function createUploadMilestoneNotification(
  userId: string,
  challengeId: string,
  uploadCount: number,
  challengeTitle?: string
): Promise<boolean> {
  const milestones = [10, 25, 50, 100, 200]
  if (!milestones.includes(uploadCount)) return false

  const titles = {
    10: 'Deca-Poster',
    25: 'Quarter Century',
    50: 'Golden Fifty',
    100: 'Century Club',
    200: 'Double Century'
  }

  const emojis = {
    10: '🥉',
    25: '🥈',
    50: '🥇',
    100: '🏆',
    200: '👑'
  }

  return createNotification({
    userId,
    challengeId,
    notificationType: 'upload_milestone',
    title: `${emojis[uploadCount as keyof typeof emojis] || '🎯'} ${titles[uploadCount as keyof typeof titles]} Milestone!`,
    message: `Amazing! You've uploaded ${uploadCount} videos in this challenge.`,
    metadata: {
      challengeTitle,
      uploadCount,
      achievementType: 'upload_milestone'
    }
  })
}

/**
 * Create early bird notification
 */
export async function createEarlyBirdNotification(
  userId: string,
  challengeId: string,
  videoTitle: string,
  challengeTitle?: string
): Promise<boolean> {
  return createNotification({
    userId,
    challengeId,
    notificationType: 'early_bird',
    title: '🐦 Early Bird Bonus!',
    message: `You uploaded "${videoTitle}" well before the deadline and earned extra points!`,
    metadata: {
      challengeTitle,
      videoTitle,
      achievementType: 'early_bird'
    }
  })
}

/**
 * Create first upload notification
 */
export async function createFirstUploadNotification(
  userId: string,
  challengeId: string,
  videoTitle: string,
  challengeTitle?: string
): Promise<boolean> {
  return createNotification({
    userId,
    challengeId,
    notificationType: 'first_upload',
    title: '🎯 First Steps!',
    message: `Congratulations on your first upload: "${videoTitle}"`,
    metadata: {
      challengeTitle,
      videoTitle,
      achievementType: 'first_upload'
    }
  })
}

/**
 * Create challenge master notification
 */
export async function createChallengeMasterNotification(
  userId: string,
  challengeId: string,
  challengeTitle: string,
  totalPoints: number,
  streakCount: number
): Promise<boolean> {
  return createNotification({
    userId,
    challengeId,
    notificationType: 'challenge_master',
    title: '👑 Challenge Master!',
    message: `You've completed "${challengeTitle}" with a perfect streak of ${streakCount} days and earned ${totalPoints} points!`,
    metadata: {
      challengeTitle,
      totalPoints,
      streakCount,
      achievementType: 'challenge_master'
    }
  })
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const supabase = createServerSupabaseClient()
    
    const { count, error } = await supabase
      .from('challenge_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_challenges.user_id', userId)
      .eq('ui_read', false)

    if (error) {
      console.error('Error counting unread notifications:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Error in getUnreadNotificationCount:', error)
    return 0
  }
}

/**
 * Get recent notifications for a user with enhanced categorization
 */
export async function getUserNotifications(userId: string, limit: number = 20): Promise<any[]> {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('challenge_notifications')
      .select(`
        id,
        challenge_id,
        notification_type,
        email_content,
        ui_read,
        ui_url,
        created_at,
        user_challenges!inner(challenge_title)
      `)
      .eq('user_challenges.user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching user notifications:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getUserNotifications:', error)
    return []
  }
}