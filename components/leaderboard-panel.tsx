"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Trophy, Medal, Crown, Award, TrendingUp, Flame } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface LeaderboardEntry {
  rank: number
  userId: string
  userName: string
  userEmail: string
  totalPoints: number
  completedChallenges: number
  currentStreak: number
  longestStreak: number
  totalVideos: number
  levelTitle: string
  isCurrentUser: boolean
}

interface LeaderboardPanelProps {
  limit?: number
}

export default function LeaderboardPanel({ limit = 50 }: LeaderboardPanelProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLeaderboard()
  }, [limit])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const res = await fetch(`/api/leaderboard?limit=${limit}`, {
        credentials: 'include'
      })
      
      if (!res.ok) {
        throw new Error('Failed to fetch leaderboard')
      }
      
      const data = await res.json()
      setLeaderboard(data.leaderboard || [])
      setCurrentUserRank(data.currentUser || null)
    } catch (err: any) {
      console.error('Error fetching leaderboard:', err)
      setError(err.message || 'Failed to load leaderboard')
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 3:
        return <Medal className="w-6 h-6 text-orange-600" />
      default:
        return <span className="text-gray-600 font-semibold">#{rank}</span>
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300'
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300'
      case 3:
        return 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300'
      default:
        return 'bg-white border-gray-200'
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Legend':
        return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'Master':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'Pro':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'Creator':
        return 'bg-green-100 text-green-800 border-green-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Leaderboard
          </CardTitle>
          <CardDescription>Top performers in the challenge</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={fetchLeaderboard}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Trophy className="w-7 h-7 text-yellow-500" />
                Challenge Leaderboard
              </CardTitle>
              <CardDescription>Top creators crushing their challenges</CardDescription>
            </div>
            <button 
              onClick={fetchLeaderboard}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Refresh
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No leaderboard data yet</p>
              <p className="text-sm text-gray-500 mt-2">Complete challenges to appear on the leaderboard!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry) => (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-4 p-4 border-2 rounded-lg transition-all hover:shadow-md ${
                    getRankColor(entry.rank)
                  } ${entry.isCurrentUser ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center w-12">
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* Avatar */}
                  <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${entry.userName}`} />
                    <AvatarFallback>{getInitials(entry.userName)}</AvatarFallback>
                  </Avatar>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900 truncate">
                        {entry.userName}
                      </h4>
                      {entry.isCurrentUser && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                          You
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge variant="outline" className={getLevelColor(entry.levelTitle)}>
                        {entry.levelTitle}
                      </Badge>
                      {entry.currentStreak > 0 && (
                        <span className="text-sm text-orange-600 flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5" />
                          {entry.currentStreak} day streak
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="font-semibold text-gray-900">{entry.completedChallenges}</p>
                      <p className="text-xs text-gray-600">Challenges</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-900">{entry.totalVideos}</p>
                      <p className="text-xs text-gray-600">Videos</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-900">{entry.longestStreak}</p>
                      <p className="text-xs text-gray-600">Best Streak</p>
                    </div>
                  </div>

                  {/* Points */}
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-600">
                      {entry.totalPoints.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600">points</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Current User Rank (if not in top list) */}
          {currentUserRank && !leaderboard.find(e => e.isCurrentUser) && (
            <div className="mt-6 pt-6 border-t-2 border-dashed">
              <p className="text-sm text-gray-600 mb-3 text-center">Your Rank</p>
              <div className="flex items-center gap-4 p-4 border-2 border-blue-300 rounded-lg bg-blue-50">
                <div className="flex items-center justify-center w-12">
                  <span className="text-blue-700 font-bold">#{currentUserRank.rank}</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">You</p>
                  <p className="text-sm text-gray-600">{currentUserRank.totalPoints} points</p>
                </div>
                <div className="text-right">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Level Progress Info */}
      <Card className="bg-linear-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-600" />
            Level System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="text-center">
              <Badge className="bg-gray-100 text-gray-800 mb-1">Beginner</Badge>
              <p className="text-xs text-gray-600">0 - 499 pts</p>
            </div>
            <div className="text-center">
              <Badge className="bg-green-100 text-green-800 mb-1">Creator</Badge>
              <p className="text-xs text-gray-600">500 - 1,999 pts</p>
            </div>
            <div className="text-center">
              <Badge className="bg-blue-100 text-blue-800 mb-1">Pro</Badge>
              <p className="text-xs text-gray-600">2,000 - 4,999 pts</p>
            </div>
            <div className="text-center">
              <Badge className="bg-red-100 text-red-800 mb-1">Master</Badge>
              <p className="text-xs text-gray-600">5,000 - 9,999 pts</p>
            </div>
            <div className="text-center">
              <Badge className="bg-purple-100 text-purple-800 mb-1">Legend</Badge>
              <p className="text-xs text-gray-600">10,000+ pts</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
