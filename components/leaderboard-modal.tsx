"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Trophy, Crown, Medal, Users, TrendingUp, Calendar, Target, Flame } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface LeaderboardEntry {
  rank: number
  userId: string
  email: string
  displayName?: string
  totalPoints: number
  completedChallenges: number
  currentStreak: number
  longestStreak: number
  levelTitle: string
  achievements: string[]
}

interface LeaderboardModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LeaderboardModal({ isOpen, onClose }: LeaderboardModalProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState<'all-time' | 'monthly' | 'weekly'>('all-time')
  const [totalParticipants, setTotalParticipants] = useState(0)

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard()
    }
  }, [isOpen, period])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/challenges/leaderboard?period=${period}&limit=50`)
      const data = await response.json()
      
      if (response.ok) {
        setLeaderboard(data.leaderboard || [])
        setTotalParticipants(data.totalParticipants || 0)
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />
    if (rank === 2) return <Trophy className="w-5 h-5 text-gray-400" />
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-500">#{rank}</span>
  }

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-700'
    if (rank === 2) return 'bg-gray-200 text-gray-700'
    if (rank === 3) return 'bg-amber-100 text-amber-700'
    return 'bg-gray-100 text-gray-700'
  }

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'Legend': return 'bg-purple-100 text-purple-700'
      case 'Master': return 'bg-orange-100 text-orange-700'
      case 'Pro': return 'bg-blue-100 text-blue-700'
      case 'Creator': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-200 text-gray-700'
    }
  }

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (email) {
      return email.slice(0, 2).toUpperCase()
    }
    return 'U'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Trophy className="w-6 h-6 text-yellow-500" />
                Community Leaderboard
              </DialogTitle>
              <DialogDescription>
                See how you stack up against other creators in the community
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Users className="w-4 h-4" />
              <span>{totalParticipants} creators</span>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6">
          <Tabs value={period} onValueChange={(value: any) => setPeriod(value)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all-time">All Time</TabsTrigger>
              <TabsTrigger value="monthly">This Month</TabsTrigger>
              <TabsTrigger value="weekly">This Week</TabsTrigger>
            </TabsList>

            <TabsContent value={period} className="mt-6">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <Skeleton className="w-12 h-6" />
                      <Skeleton className="flex-1 h-6" />
                      <Skeleton className="w-20 h-6" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {leaderboard.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No leaderboard data available yet</p>
                      <p className="text-sm">Complete some challenges to see rankings!</p>
                    </div>
                  ) : (
                    leaderboard.map((entry, index) => (
                      <Card 
                        key={entry.userId}
                        className="border border-gray-200 dark:border-gray-700 transition-all hover:shadow-md"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            {/* Rank */}
                            <div className="flex items-center gap-2">
                              <div className={`px-3 py-1 rounded-full font-bold text-sm ${getRankBadgeColor(entry.rank)}`}>
                                #{entry.rank}
                              </div>
                              {getRankIcon(entry.rank)}
                            </div>

                            {/* Avatar & Name */}
                            <div className="flex items-center gap-3 flex-1">
                              <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white font-bold">
                                  {getInitials(entry.displayName, entry.email)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="font-semibold text-gray-900">
                                  {entry.displayName || entry.email.split('@')[0]}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className={`text-xs ${getLevelBadgeColor(entry.levelTitle)}`}>
                                    {entry.levelTitle}
                                  </Badge>
                                  {entry.achievements.length > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      {entry.achievements.length} achievements
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <div className="text-lg font-bold text-blue-600">
                                  {entry.totalPoints.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500">Points</div>
                              </div>
                              <div>
                                <div className="text-lg font-bold text-green-600">
                                  {entry.completedChallenges}
                                </div>
                                <div className="text-xs text-gray-500">Completed</div>
                              </div>
                              <div>
                                <div className="flex items-center justify-center gap-1">
                                  <Flame className="w-4 h-4 text-orange-500" />
                                  <span className="text-lg font-bold text-orange-600">
                                    {entry.currentStreak}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500">Streak</div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Stats Footer */}
        {!loading && leaderboard.length > 0 && (
          <div className="bg-gray-50 px-6 py-4 border-t">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-gray-700">
                  {totalParticipants.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">Total Creators</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-600">
                  {leaderboard.reduce((sum, entry) => sum + entry.totalPoints, 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">Combined Points</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">
                  {leaderboard.reduce((sum, entry) => sum + entry.completedChallenges, 0)}
                </div>
                <div className="text-xs text-gray-500">Total Completed</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-600">
                  {leaderboard.length > 0 ? Math.max(...leaderboard.map(entry => entry.longestStreak || 0)) : 0}
                </div>
                <div className="text-xs text-gray-500">Best Streak</div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}