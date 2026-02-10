"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Trophy, Target, Flame, Calendar, Clock, Upload, CheckCircle, XCircle, AlertCircle, TrendingUp, Award, Zap } from 'lucide-react'
import { Challenge } from '@/types/challenge'
import { useSyncUploads } from '@/hooks/useSyncUploads'

interface UploadTrackingPanelProps {
  challenge: Challenge
  onRefresh?: () => void
}

export default function UploadTrackingPanel({ challenge, onRefresh }: UploadTrackingPanelProps) {
  // Get uploads from challenge data (populated by API with includeUploads=true)
  const uploads = (challenge as any).challenge_uploads || challenge.uploads || []
  const [nextDeadline, setNextDeadline] = useState<Date | null>(null)
  const [timeUntilDeadline, setTimeUntilDeadline] = useState<string>('')
  const [todayIsUploadDay, setTodayIsUploadDay] = useState(false)
  const [todayUploadStatus, setTodayUploadStatus] = useState<'uploaded' | 'not-uploaded' | 'none'>('none')
  const { isSyncing, syncedCount, results, triggerSync } = useSyncUploads()
  const [showSyncResult, setShowSyncResult] = useState(false)

  useEffect(() => {
    // Calculate next deadline
    if (challenge.nextUploadDeadline) {
      const deadline = new Date(challenge.nextUploadDeadline)
      setNextDeadline(deadline)
      
      // Check if today is upload day
      const today = new Date()
      const isToday = deadline.toDateString() === today.toDateString()
      setTodayIsUploadDay(isToday)
      
      // Update time until deadline
      updateTimeUntilDeadline(deadline)
      const interval = setInterval(() => updateTimeUntilDeadline(deadline), 60000) // Update every minute
      
      return () => clearInterval(interval)
    }
  }, [challenge.nextUploadDeadline])

  useEffect(() => {
    // Check today's upload status
    if (todayIsUploadDay && uploads && uploads.length > 0) {
      const today = new Date().toDateString()
      const todayUpload = uploads.find((upload: any) => {
        const uploadDate = new Date(upload.upload_date).toDateString()
        return uploadDate === today
      })
      
      
      setTodayUploadStatus(todayUpload ? 'uploaded' : 'not-uploaded')
    }
  }, [todayIsUploadDay, uploads])

  const updateTimeUntilDeadline = (deadline: Date) => {
    const now = new Date()
    const diff = deadline.getTime() - now.getTime()
    
    if (diff < 0) {
      setTimeUntilDeadline('Overdue')
      return
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const days = Math.floor(hours / 24)
    
    if (days > 0) {
      setTimeUntilDeadline(`${days}d ${hours % 24}h`)
    } else if (hours > 0) {
      setTimeUntilDeadline(`${hours}h ${minutes}m`)
    } else {
      setTimeUntilDeadline(`${minutes}m`)
    }
  }

  const getStatusIcon = () => {
    if (todayUploadStatus === 'uploaded') {
      return <CheckCircle className="w-5 h-5 text-green-500" />
    } else if (todayUploadStatus === 'not-uploaded') {
      return <XCircle className="w-5 h-5 text-red-500" />
    }
    return <AlertCircle className="w-5 h-5 text-gray-400" />
  }

  const getStatusText = () => {
    if (todayUploadStatus === 'uploaded') {
      return 'Uploaded ✅'
    } else if (todayUploadStatus === 'not-uploaded') {
      return 'Not Uploaded ⚠️ - Points will be lost!'
    }
    return 'No upload scheduled'
  }

  const getStatusColor = () => {
    if (todayUploadStatus === 'uploaded') return 'bg-green-50 border-green-200'
    if (todayUploadStatus === 'not-uploaded') return 'bg-red-50 border-red-200'
    return 'bg-gray-50 border-gray-200'
  }

  const calculatePointsForNextUpload = () => {
    const basePoints = 100
    const streakBonus = challenge.streakCount ? Math.min(challenge.streakCount * 5, 100) : 0
    const onTimeBonus = 50
    return basePoints + streakBonus + onTimeBonus
  }

  return (
    <div className="space-y-6">
      {/* Upload Tracker Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Upload className="w-6 h-6 text-blue-600" />
                Track Upload
              </CardTitle>
              <CardDescription>Monitor your challenge progress and deadlines</CardDescription>
            </div>
            {challenge.streakCount > 0 && (
              <Badge variant="outline" className="text-lg px-4 py-2 bg-orange-50 border-orange-300">
                <Flame className="w-4 h-4 mr-1 text-orange-500" />
                {challenge.streakCount} Day Streak
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Today's Status Card */}
      {todayIsUploadDay && (
        <Card className={`border-2 ${getStatusColor()}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon()}
                <div>
                  <h3 className="font-semibold text-lg">Today's Upload</h3>
                  <p className="text-sm text-gray-600">
                    {nextDeadline?.toLocaleDateString()} at {nextDeadline?.toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${todayUploadStatus === 'uploaded' ? 'text-green-600' : 'text-red-600'}`}>
                  {getStatusText()}
                </p>
                {todayUploadStatus === 'not-uploaded' && (
                  <p className="text-sm text-red-500 mt-1">-50 points penalty</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Next Deadline */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Next Deadline</p>
                <p className="text-2xl font-bold text-gray-900">
                  {timeUntilDeadline || 'N/A'}
                </p>
                {nextDeadline && (
                  <p className="text-xs text-gray-500 mt-1">
                    {nextDeadline.toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Upload Points */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Trophy className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Potential Points</p>
                <p className="text-2xl font-bold text-yellow-600">
                  +{calculatePointsForNextUpload()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  If uploaded on time
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Points */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-3 bg-purple-100 rounded-full">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Points</p>
                <p className="text-2xl font-bold text-purple-600">
                  {challenge.pointsEarned || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Earned so far
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completion Progress */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-3 bg-green-100 rounded-full">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Progress</p>
                <p className="text-2xl font-bold text-green-600">
                  {Math.round(challenge.completionPercentage || 0)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {uploads?.length || 0} uploads
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auto-Sync Button - Appears when today is upload deadline */}
      {todayIsUploadDay && todayUploadStatus === 'not-uploaded' && (
        <Card className="border-2 border-blue-500 bg-blue-50">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Quick Sync</h3>
              </div>
              <p className="text-sm text-blue-800">
                Automatically detect your latest YouTube uploads and add them to today's challenge.
              </p>
              <Button
                onClick={() => {
                  triggerSync(challenge.id)
                  setShowSyncResult(true)
                }}
                disabled={isSyncing}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isSyncing ? (
                  <>
                    <div className="mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Sync My Videos
                  </>
                )}
              </Button>

              {/* Sync Results */}
              {showSyncResult && results.length > 0 && (
                <div className="mt-4 p-3 bg-white rounded border border-blue-200 space-y-2">
                  {results.map((result, idx) => (
                    <div key={idx} className="text-sm">
                      {result.status === 'success' && (
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle className="w-4 h-4" />
                          <span>✅ {result.videoTitle} - +{result.pointsEarned} points!</span>
                        </div>
                      )}
                      {result.status === 'duplicate' && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <AlertCircle className="w-4 h-4" />
                          <span>Already synced: {result.videoTitle}</span>
                        </div>
                      )}
                      {result.status === 'no_upload' && (
                        <div className="flex items-center gap-2 text-orange-600">
                          <AlertCircle className="w-4 h-4" />
                          <span>No videos found for today</span>
                        </div>
                      )}
                      {result.status === 'error' && (
                        <div className="flex items-center gap-2 text-red-600">
                          <XCircle className="w-4 h-4" />
                          <span>Error: {result.reason}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Challenge Progress</h3>
              <span className="text-sm text-gray-600">
                {uploads?.length || 0} / {challenge.progress?.length || 0} videos
              </span>
            </div>
            <Progress value={challenge.completionPercentage || 0} className="h-3" />
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center">
                <p className="text-sm text-gray-600">Uploads</p>
                <p className="text-lg font-bold text-blue-600">{uploads?.length || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Missed</p>
                <p className="text-lg font-bold text-red-600">{challenge.missedDays || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Remaining</p>
                <p className="text-lg font-bold text-gray-600">
                  {(challenge.progress?.length || 0) - (uploads?.length || 0) - (challenge.missedDays || 0)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Next Deadline</p>
              <p className="text-lg font-bold text-orange-600">
                {nextDeadline ? nextDeadline.toLocaleDateString() : 'N/A'}
              </p>
              <p className="text-xs text-gray-500">{timeUntilDeadline || 'No deadline'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Total Points</p>
              <p className="text-2xl font-bold text-purple-600">{challenge.pointsEarned || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Current Streak</p>
              <p className="text-2xl font-bold flex items-center gap-1">
                {challenge.streakCount || 0}
                <Flame className="w-5 h-5 text-orange-500" />
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Longest Streak</p>
              <p className="text-2xl font-bold">{challenge.longestStreak || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">On-Time Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {uploads && uploads.length > 0
                  ? Math.round((uploads.filter((u: any) => u.on_time_status).length / uploads.length) * 100)
                  : 0}%
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Total Challenges</p>
              <p className="text-2xl font-bold text-blue-600">
                {0}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Best Streak</p>
              <p className="text-2xl font-bold text-red-600">
                {challenge.longestStreak || 0}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Videos Created</p>
              <p className="text-2xl font-bold text-indigo-600">
                {uploads?.length || 0}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Avg. Completion</p>
              <p className="text-2xl font-bold text-teal-600">
                {Math.round(challenge.completionPercentage || 0)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
