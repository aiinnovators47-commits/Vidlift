"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Calendar, Clock, Target, Trophy, Zap, CheckCircle, XCircle, AlertCircle, Flame } from 'lucide-react'
import { Challenge } from '@/types/challenge'
import TodayUploadStatus from '@/components/today-upload-status'

interface ChallengeCardProps {
  challenge: Challenge
  onViewDetails: (challenge: Challenge) => void
  onTrackUpload?: (challengeId: string) => void
}

export default function ChallengeCard({ challenge, onViewDetails, onTrackUpload }: ChallengeCardProps) {
  const [timeUntilDeadline, setTimeUntilDeadline] = useState<string>('')

  useEffect(() => {
    if (!challenge.nextUploadDeadline) return

    const updateCountdown = () => {
      const now = new Date()
      const deadline = new Date(challenge.nextUploadDeadline!)
      const diff = deadline.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeUntilDeadline('Deadline passed')
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      if (days > 0) {
        setTimeUntilDeadline(`${days}d ${hours}h left`)
      } else if (hours > 0) {
        setTimeUntilDeadline(`${hours}h ${minutes}m left`)
      } else {
        setTimeUntilDeadline(`${minutes}m left`)
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [challenge.nextUploadDeadline])

  const getStatusIcon = () => {
    if (challenge.status === 'completed') {
      return <CheckCircle className="w-5 h-5 text-green-500" />
    }
    if (challenge.status === 'paused') {
      return <AlertCircle className="w-5 h-5 text-yellow-500" />
    }
    if (challenge.nextUploadDeadline && new Date(challenge.nextUploadDeadline) < new Date()) {
      return <XCircle className="w-5 h-5 text-red-500" />
    }
    return <CheckCircle className="w-5 h-5 text-green-500" />
  }

  const getStatusColor = () => {
    if (challenge.status === 'completed') return 'text-green-600'
    if (challenge.status === 'paused') return 'text-yellow-600'
    if (challenge.nextUploadDeadline && new Date(challenge.nextUploadDeadline) < new Date()) {
      return 'text-red-600'
    }
    return 'text-blue-600'
  }

  const getDeadlineUrgency = () => {
    if (!challenge.nextUploadDeadline) return 'normal'
    
    const now = new Date()
    const deadline = new Date(challenge.nextUploadDeadline)
    const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    if (hoursLeft <= 0) return 'overdue'
    if (hoursLeft <= 24) return 'urgent'
    if (hoursLeft <= 48) return 'warning'
    return 'normal'
  }

  const urgency = getDeadlineUrgency()

  return (
    <Card className={`relative overflow-hidden transition-all hover:shadow-lg ${
      urgency === 'overdue' ? 'border-red-500 bg-red-50/30' :
      urgency === 'urgent' ? 'border-orange-500 bg-orange-50/30' :
      urgency === 'warning' ? 'border-yellow-500 bg-yellow-50/30' :
      'border-gray-200'
    }`}>
      {/* Status indicator stripe */}
      <div className={`absolute top-0 left-0 w-full h-1 ${
        challenge.status === 'completed' ? 'bg-green-500' :
        challenge.status === 'paused' ? 'bg-yellow-500' :
        urgency === 'overdue' ? 'bg-red-500' :
        urgency === 'urgent' ? 'bg-orange-500' :
        'bg-blue-500'
      }`} />

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {getStatusIcon()}
              <CardTitle className="text-lg font-semibold line-clamp-1">
                {challenge.challengeTitle || 'Challenge'}
              </CardTitle>
            </div>
            <CardDescription className="text-sm line-clamp-2">
              {challenge.challengeDescription || 'No description'}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={challenge.status === 'active' ? 'default' : 'secondary'} className="text-xs">
              {challenge.status}
            </Badge>
            {challenge.streakCount > 0 && (
              <div className="flex items-center gap-1 text-orange-600">
                <Flame className="w-3 h-3" />
                <span className="text-xs font-medium">{challenge.streakCount}</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Progress</span>
            <span className="text-sm font-medium">
              {Math.round(challenge.completionPercentage || 0)}%
            </span>
          </div>
          <Progress value={challenge.completionPercentage || 0} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{challenge.uploads?.length || 0} uploaded</span>
            <span>Target: {challenge.progress?.length || 0}</span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <div>
              <div className="text-sm font-medium">{challenge.pointsEarned || 0}</div>
              <div className="text-xs text-gray-500">Points</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-500" />
            <div>
              <div className="text-sm font-medium">{challenge.streakCount || 0}</div>
              <div className="text-xs text-gray-500">Streak</div>
            </div>
          </div>
        </div>

        {/* Next deadline */}
        {challenge.status === 'active' && challenge.nextUploadDeadline && (
          <div className={`rounded-lg p-3 mb-4 ${
            urgency === 'overdue' ? 'bg-red-100 border border-red-200' :
            urgency === 'urgent' ? 'bg-orange-100 border border-orange-200' :
            urgency === 'warning' ? 'bg-yellow-100 border border-yellow-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className={`w-4 h-4 ${
                  urgency === 'overdue' ? 'text-red-600' :
                  urgency === 'urgent' ? 'text-orange-600' :
                  urgency === 'warning' ? 'text-yellow-600' :
                  'text-blue-600'
                }`} />
                <div>
                  <div className="text-sm font-medium">Next Upload</div>
                  <div className="text-xs text-gray-600">
                    {new Date(challenge.nextUploadDeadline).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className={`text-right ${getStatusColor()}`}>
                <div className="text-sm font-medium">{timeUntilDeadline}</div>
                <div className="text-xs">
                  {urgency === 'overdue' ? 'Overdue!' :
                   urgency === 'urgent' ? 'Due soon!' :
                   urgency === 'warning' ? 'Approaching' :
                   'On track'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Today's Upload Status */}
        {challenge.status === 'active' && (
          <div className="mb-4 p-3 rounded-lg bg-gray-50 border border-gray-200">
            <TodayUploadStatus challengeId={challenge.id} compact={true} />
          </div>
        )}

        {/* Challenge info */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Every {challenge.cadenceEveryDays || 1} days</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            <span>{challenge.videoType || 'Videos'}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onViewDetails(challenge)}
            className="flex-1"
          >
            View Details
          </Button>
          {challenge.status === 'active' && onTrackUpload && (
            <Button 
              size="sm"
              onClick={() => onTrackUpload(challenge.id)}
              className="flex-1"
            >
              Track Upload
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}