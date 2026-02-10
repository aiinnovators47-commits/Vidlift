// Challenge Types and Configuration
export interface ChallengeConfig {
  challengeType: 'daily_30' | 'daily_60' | 'daily_90' | 'every_2_days_30' | 'every_2_days_60' | 'every_3_days_45' | 'every_3_days_90' | 'weekly_4' | 'weekly_8' | 'weekly_12' | 'custom'
  title: string
  description?: string
  startDate: string
  durationDays: number
  uploadFrequencyDays: number
  videosPerUpload: number
  videoType: 'long' | 'shorts' | 'mixed'
  categoryNiche?: string
  timezone: string
  emailNotifications: boolean
  leaderboardVisible: boolean
}

export interface ChallengeUpload {
  id: string
  challengeId: string
  videoId: string
  videoTitle: string
  video_title?: string  // For database compatibility
  videoUrl: string
  uploadDate: string
  upload_date?: string  // For database compatibility
  scheduledDate: string
  onTimeStatus: boolean
  pointsEarned: number
  videoDuration?: number
  videoViews?: number
  video_views?: number  // For database compatibility
  videoLikes?: number
  videoComments?: number
}

export interface Challenge {
  id: string
  userId: string
  challengeId: string
  challengeTitle: string
  challengeDescription?: string
  challengeType: string
  startedAt: string
  config: any
  progress: any[]
  status: 'active' | 'completed' | 'paused'
  pointsEarned: number
  streakCount: number
  longestStreak: number
  missedDays: number
  completionPercentage: number
  nextUploadDeadline?: string
  uploads?: ChallengeUpload[]
  durationMonths?: number
  cadenceEveryDays?: number
  videosPerCadence?: number
  videoType?: string
  createdAt: string
  updatedAt: string
}

export interface UserChallengeStats {
  userId: string
  totalChallenges: number
  completedChallenges: number
  activeChallenges: number
  totalPoints: number
  currentStreak: number
  longestStreak: number
  totalVideosUploaded: number
  averageCompletionRate: number
  achievements: string[]
  levelTitle: string
}

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

// Challenge Templates
export const CHALLENGE_TEMPLATES = {
  daily_30: {
    title: "30-Day Daily Upload Challenge",
    description: "Upload one video every single day for 30 days straight",
    durationDays: 30,
    uploadFrequencyDays: 1,
    videosPerUpload: 1,
    targetVideos: 30
  },
  daily_60: {
    title: "60-Day Daily Upload Challenge",
    description: "Upload one video every day for 2 months - the ultimate consistency test",
    durationDays: 60,
    uploadFrequencyDays: 1,
    videosPerUpload: 1,
    targetVideos: 60
  },
  daily_90: {
    title: "90-Day Daily Upload Challenge",
    description: "Upload daily for 3 months - build an unstoppable habit",
    durationDays: 90,
    uploadFrequencyDays: 1,
    videosPerUpload: 1,
    targetVideos: 90
  },
  every_2_days_30: {
    title: "30-Day Upload Every 2 Days",
    description: "Upload every other day for a month - sustainable consistency",
    durationDays: 30,
    uploadFrequencyDays: 2,
    videosPerUpload: 1,
    targetVideos: 15
  },
  every_2_days_60: {
    title: "60-Day Upload Every 2 Days",
    description: "Upload every 2 days for 2 months - quality over quantity",
    durationDays: 60,
    uploadFrequencyDays: 2,
    videosPerUpload: 1,
    targetVideos: 30
  },
  every_3_days_45: {
    title: "45-Day Upload Every 3 Days",
    description: "Upload every 3 days for 6+ weeks - perfect for longer content",
    durationDays: 45,
    uploadFrequencyDays: 3,
    videosPerUpload: 1,
    targetVideos: 15
  },
  every_3_days_90: {
    title: "90-Day Upload Every 3 Days",
    description: "Upload every 3 days for 3 months - marathon consistency",
    durationDays: 90,
    uploadFrequencyDays: 3,
    videosPerUpload: 1,
    targetVideos: 30
  },
  weekly_4: {
    title: "4-Week Weekly Upload Challenge",
    description: "Upload once per week for a month - beginner friendly",
    durationDays: 28,
    uploadFrequencyDays: 7,
    videosPerUpload: 1,
    targetVideos: 4
  },
  weekly_8: {
    title: "8-Week Weekly Upload Challenge",
    description: "Upload once per week for 2 months - build the habit",
    durationDays: 56,
    uploadFrequencyDays: 7,
    videosPerUpload: 1,
    targetVideos: 8
  },
  weekly_12: {
    title: "12-Week Weekly Upload Challenge",
    description: "Upload once per week for 3 months - quarter-year consistency",
    durationDays: 84,
    uploadFrequencyDays: 7,
    videosPerUpload: 1,
    targetVideos: 12
  }
}

// Points System
export const POINTS_CONFIG = {
  ON_TIME_UPLOAD: 10,
  STREAK_BONUS_PER_DAY: 5,
  EARLY_UPLOAD_BONUS: 3,
  CHALLENGE_COMPLETION: 500,
  PERFECT_CHALLENGE: 1000,
  ACHIEVEMENT_BONUSES: {
    first_upload: 50,
    streak_7: 100,
    streak_30: 300,
    perfect_month: 500,
    challenge_master: 1000
  }
}

// Achievement Definitions
export const ACHIEVEMENTS = {
  first_upload: {
    title: "First Steps",
    description: "Uploaded your first challenge video",
    badge: "Bronze",
    points: 50
  },
  streak_7: {
    title: "Week Warrior",
    description: "Maintained a 7-day upload streak",
    badge: "Silver",
    points: 100
  },
  streak_30: {
    title: "Month Master",
    description: "Achieved a 30-day upload streak",
    badge: "Gold",
    points: 300
  },
  perfect_month: {
    title: "Perfection",
    description: "Completed a 30-day challenge without missing a single day",
    badge: "Platinum",
    points: 500
  },
  challenge_master: {
    title: "Challenge Master",
    description: "Completed 5 different challenges",
    badge: "Diamond",
    points: 1000
  },
  consistency_king: {
    title: "Consistency King",
    description: "Maintained streaks across multiple challenges",
    badge: "Diamond",
    points: 1000
  }
}

// Utility Functions
export function calculateNextDeadline(startDate: string, frequencyDays: number, currentDay: number): Date {
  const start = new Date(startDate)
  const nextUpload = new Date(start)
  // If currentDay is 0, set the first deadline to be frequencyDays from start
  // Otherwise calculate based on currentDay
  const daysToAdd = currentDay === 0 ? frequencyDays : (currentDay * frequencyDays)
  nextUpload.setDate(start.getDate() + daysToAdd)
  return nextUpload
}

export function calculateProgress(challenge: Challenge): {
  videosUploaded: number
  targetVideos: number
  daysCompleted: number
  totalDays: number
  completionPercentage: number
} {
  const template = CHALLENGE_TEMPLATES[challenge.challengeType as keyof typeof CHALLENGE_TEMPLATES]
  const startDate = new Date(challenge.startedAt)
  const now = new Date()
  const daysElapsed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  
  return {
    videosUploaded: challenge.uploads?.length || 0,
    targetVideos: template?.targetVideos || 0,
    daysCompleted: Math.min(daysElapsed, template?.durationDays || 0),
    totalDays: template?.durationDays || 0,
    completionPercentage: challenge.completionPercentage || 0
  }
}

export function isUploadOnTime(uploadDate: string, scheduledDate: string): boolean {
  const upload = new Date(uploadDate)
  const scheduled = new Date(scheduledDate)
  // Allow uploads up to 4 hours after deadline
  const gracePeriod = 4 * 60 * 60 * 1000 // 4 hours in milliseconds
  return upload.getTime() <= (scheduled.getTime() + gracePeriod)
}

export function calculatePoints(upload: ChallengeUpload, streakDays: number): number {
  let points = 0
  
  // Base points for upload
  points += POINTS_CONFIG.ON_TIME_UPLOAD
  
  // Streak bonus
  if (upload.onTimeStatus && streakDays > 0) {
    points += streakDays * POINTS_CONFIG.STREAK_BONUS_PER_DAY
  }
  
  // Early upload bonus (uploaded before scheduled time)
  const uploadTime = new Date(upload.uploadDate).getTime()
  const scheduledTime = new Date(upload.scheduledDate).getTime()
  if (uploadTime < scheduledTime) {
    points += POINTS_CONFIG.EARLY_UPLOAD_BONUS
  }
  
  return points
}

export function getUserLevel(totalPoints: number): string {
  if (totalPoints >= 10000) return 'Legend'
  if (totalPoints >= 5000) return 'Master'
  if (totalPoints >= 2000) return 'Pro'
  if (totalPoints >= 500) return 'Creator'
  return 'Beginner'
}