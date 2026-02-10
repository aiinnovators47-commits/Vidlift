"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Trophy, Crown, Medal, Award, Zap, Target, Flame, Star, Users } from 'lucide-react'
import { AchievementSummaryCard } from './achievement-summary-card'
import { UserChallengeStats } from '@/types/challenge'

interface ChallengeStatsProps {
  stats: UserChallengeStats
  onViewLeaderboard?: () => void
}

export default function ChallengeStats({ stats, onViewLeaderboard }: ChallengeStatsProps) {
  const [levelProgress, setLevelProgress] = useState(0)

  // Guard clause for undefined stats
  if (!stats) {
    return <div className="text-gray-500 text-center py-4">Loading stats...</div>
  }

  const levelThresholds = {
    'Beginner': 0,
    'Creator': 500,
    'Pro': 2000,
    'Master': 5000,
    'Legend': 10000
  }

  const levelColors = {
    'Beginner': 'text-gray-600 bg-gray-100',
    'Creator': 'text-blue-600 bg-blue-100',
    'Pro': 'text-purple-600 bg-purple-100',
    'Master': 'text-orange-600 bg-orange-100',
    'Legend': 'text-yellow-600 bg-yellow-100'
  }

  const achievements = [
    {
      id: 'first_upload',
      title: 'First Steps',
      description: 'Uploaded your first challenge video',
      icon: Award,
      color: 'text-bronze-600',
      unlocked: stats.achievements.includes('first_upload')
    },
    {
      id: 'streak_7',
      title: 'Week Warrior',
      description: 'Maintained a 7-day upload streak',
      icon: Medal,
      color: 'text-gray-600',
      unlocked: stats.achievements.includes('streak_7')
    },
    {
      id: 'streak_30',
      title: 'Month Master',
      description: 'Achieved a 30-day upload streak',
      icon: Trophy,
      color: 'text-yellow-600',
      unlocked: stats.achievements.includes('streak_30')
    },
    {
      id: 'perfect_month',
      title: 'Perfection',
      description: 'Completed a challenge without missing a day',
      icon: Crown,
      color: 'text-purple-600',
      unlocked: stats.achievements.includes('perfect_month')
    },
    {
      id: 'challenge_master',
      title: 'Challenge Master',
      description: 'Completed 5 different challenges',
      icon: Star,
      color: 'text-blue-600',
      unlocked: stats.achievements.includes('challenge_master')
    }
  ]

  useEffect(() => {
    const currentThreshold = levelThresholds[stats.levelTitle as keyof typeof levelThresholds] || 0
    const levels = Object.keys(levelThresholds) as (keyof typeof levelThresholds)[]
    const currentIndex = levels.indexOf(stats.levelTitle as keyof typeof levelThresholds)
    const nextLevel = levels[currentIndex + 1]
    
    if (nextLevel) {
      const nextThreshold = levelThresholds[nextLevel]
      const progressInLevel = stats.totalPoints - currentThreshold
      const levelRange = nextThreshold - currentThreshold
      setLevelProgress((progressInLevel / levelRange) * 100)
    } else {
      setLevelProgress(100) // Max level
    }
  }, [stats])

  return (
    <div className="space-y-6">
      {/* Level and Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Creator Level
              </CardTitle>
              <CardDescription>Your current rank and progress</CardDescription>
            </div>
            <Badge className={`px-3 py-1 font-bold ${levelColors[stats.levelTitle as keyof typeof levelColors]}`}>
              {stats.levelTitle}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Points to next level</span>
              <span className="text-sm font-medium">{(stats?.totalPoints || 0).toLocaleString()}</span>
            </div>
            <Progress value={levelProgress} className="h-3" />
            {stats.levelTitle !== 'Legend' && (
              <div className="text-xs text-gray-500 text-center">
                {Math.round(levelProgress)}% progress to {
                  Object.keys(levelThresholds)[
                    Object.keys(levelThresholds).indexOf(stats.levelTitle) + 1
                  ]
                }
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalChallenges}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Total Challenges</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">{stats.completedChallenges}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">{stats.longestStreak}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Best Streak</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalVideosUploaded}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Videos Created</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-500" />
              Achievements
            </CardTitle>
            <CardDescription>
              {stats.achievements.length} of {achievements.length} unlocked
            </CardDescription>
          </div>
          <Badge variant="outline">
            {Math.round((stats.achievements.length / achievements.length) * 100)}%
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement) => {
              const Icon = achievement.icon
              return (
                <div 
                  key={achievement.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    achievement.unlocked 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    achievement.unlocked 
                      ? `${achievement.color} bg-opacity-20` 
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium text-sm ${
                      achievement.unlocked ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {achievement.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {achievement.description}
                    </div>
                  </div>
                  {achievement.unlocked && (
                    <div className="text-green-600">
                      <Trophy className="w-4 h-4" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard Preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Community Ranking
            </CardTitle>
            <CardDescription>See how you compare with other creators</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onViewLeaderboard}>
            View Full Leaderboard
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {(stats?.totalPoints || 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 mb-4">Total Points Earned</div>
            <div className="text-xs text-gray-500">
              Keep challenging yourself to climb the leaderboard!
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {stats.currentStreak}
              </div>
              <div className="text-sm text-gray-600">Current Streak</div>
              {stats.currentStreak > 0 && (
                <div className="flex items-center justify-center gap-1 mt-2 text-orange-600">
                  <Flame className="w-3 h-3" />
                  <span className="text-xs">On fire!</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {(stats?.averageCompletionRate || 0).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Avg. Completion Rate</div>
              {(stats?.averageCompletionRate || 0) >= 90 && (
                <div className="flex items-center justify-center gap-1 mt-2 text-green-600">
                  <Star className="w-3 h-3" />
                  <span className="text-xs">Excellent!</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}