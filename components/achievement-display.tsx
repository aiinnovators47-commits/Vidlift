'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Star, Zap, Flame, Crown, Medal, Target, Calendar, CheckCircle } from 'lucide-react'

interface Achievement {
  id: string
  userId: string
  challengeId: string
  achievementType: string
  achievementTitle: string
  achievementDescription: string
  pointsAwarded: number
  unlockedAt: string
}

interface AchievementDisplayProps {
  userId?: string
  challengeId?: string
  compact?: boolean
}

const ACHIEVEMENT_ICONS: Record<string, any> = {
  'first_upload': Target,
  'streak_7': Flame,
  'streak_14': Flame,
  'streak_30': Crown,
  'perfect_week': Star,
  'challenge_master': Trophy,
  'upload_10': Medal,
  'upload_25': Medal,
  'upload_50': Crown,
  'early_bird': Zap
}

const ACHIEVEMENT_COLORS: Record<string, string> = {
  'first_upload': 'bg-blue-500',
  'streak_7': 'bg-orange-500',
  'streak_14': 'bg-red-500',
  'streak_30': 'bg-purple-500',
  'perfect_week': 'bg-yellow-500',
  'challenge_master': 'bg-green-500',
  'upload_10': 'bg-indigo-500',
  'upload_25': 'bg-pink-500',
  'upload_50': 'bg-gradient-to-r from-yellow-400 to-orange-500',
  'early_bird': 'bg-teal-500'
}

export function AchievementDisplay({ userId, challengeId, compact = false }: AchievementDisplayProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAchievements()
  }, [userId, challengeId])

  const fetchAchievements = async () => {
    try {
      setLoading(true)
      const url = challengeId 
        ? `/api/achievements?challengeId=${challengeId}`
        : '/api/achievements'
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.achievements) {
        setAchievements(data.achievements)
      }
    } catch (error) {
      console.error('Error fetching achievements:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-wrap gap-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (achievements.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No achievements yet</p>
        <p className="text-sm">Start uploading to earn your first badge!</p>
      </div>
    )
  }

  const sortedAchievements = [...achievements].sort((a, b) => 
    new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime()
  )

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {sortedAchievements.slice(0, 6).map(achievement => {
          const IconComponent = ACHIEVEMENT_ICONS[achievement.achievementType] || Trophy
          const bgColor = ACHIEVEMENT_COLORS[achievement.achievementType] || 'bg-gray-500'
          
          return (
            <div 
              key={achievement.id}
              className={`${bgColor} text-white p-2 rounded-lg flex flex-col items-center w-20 tooltip`}
              title={`${achievement.achievementTitle}: ${achievement.achievementDescription}`}
            >
              <IconComponent className="w-6 h-6 mb-1" />
              <span className="text-xs font-bold truncate w-full text-center">
                {achievement.pointsAwarded} pts
              </span>
            </div>
          )
        })}
        {achievements.length > 6 && (
          <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg flex items-center justify-center w-20">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              +{achievements.length - 6} more
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          Achievements ({achievements.length})
        </h3>
        <Badge variant="secondary">
          Total Points: {achievements.reduce((sum, ach) => sum + ach.pointsAwarded, 0)}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedAchievements.map(achievement => {
          const IconComponent = ACHIEVEMENT_ICONS[achievement.achievementType] || Trophy
          const bgColor = ACHIEVEMENT_COLORS[achievement.achievementType] || 'bg-gray-500'
          
          return (
            <Card key={achievement.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className={`${bgColor} p-4 text-white`}>
                <div className="flex items-center justify-between">
                  <IconComponent className="w-8 h-8" />
                  <div className="text-right">
                    <div className="text-2xl font-bold">+{achievement.pointsAwarded}</div>
                    <div className="text-xs opacity-90">points</div>
                  </div>
                </div>
              </div>
              
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  {achievement.achievementTitle}
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  {achievement.achievementDescription}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Earned</span>
                  <span>{new Date(achievement.unlockedAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// Component to show achievement notification when unlocked
export function AchievementNotification({ achievement }: { achievement: Achievement }) {
  const IconComponent = ACHIEVEMENT_ICONS[achievement.achievementType] || Trophy
  const bgColor = ACHIEVEMENT_COLORS[achievement.achievementType] || 'bg-gray-500'

  return (
    <div className={`${bgColor} text-white p-4 rounded-lg shadow-lg max-w-md`}>
      <div className="flex items-start gap-3">
        <div className="bg-white bg-opacity-20 p-2 rounded-full">
          <IconComponent className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Achievement Unlocked!
          </h4>
          <h3 className="font-bold text-xl my-1">{achievement.achievementTitle}</h3>
          <p className="text-sm opacity-90 mb-2">{achievement.achievementDescription}</p>
          <div className="flex items-center gap-2 text-sm">
            <Star className="w-4 h-4" />
            <span>+{achievement.pointsAwarded} points awarded</span>
          </div>
        </div>
      </div>
    </div>
  )
}