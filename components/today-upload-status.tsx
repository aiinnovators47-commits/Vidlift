'use client'

import { CheckCircle, Clock, AlertCircle, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useTodayStatus } from '@/hooks/useTodayStatus'

interface TodayUploadStatusProps {
  challengeId: string
  compact?: boolean
}

export default function TodayUploadStatus({ challengeId, compact = false }: TodayUploadStatusProps) {
  const { status, deadline, loading, error } = useTodayStatus(challengeId)

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-600">Checking status...</span>
      </div>
    )
  }

  if (error) {
    return null
  }

  if (!status) {
    return null
  }

  // Uploaded today
  if (status.isUploadedToday) {
    return (
      <div className={`flex items-center gap-2 ${compact ? 'text-sm' : ''}`}>
        <CheckCircle className="w-5 h-5 text-green-500" />
        <div>
          <p className="font-semibold text-green-700">Video Uploaded Today ✓</p>
          {!compact && (
            <>
              <p className="text-sm text-green-600">+{status.pointsEarned} points earned</p>
              {status.videoTitle && (
                <p className="text-xs text-gray-600 line-clamp-1 mt-1">
                  📹 {status.videoTitle}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  // Not uploaded but today is deadline
  if (deadline?.isTodayDeadline) {
    return (
      <div className={`flex items-center gap-2 ${compact ? 'text-sm' : ''}`}>
        <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" />
        <div>
          <p className="font-semibold text-red-700">⚠️ Upload Your Video Today!</p>
          {!compact && (
            <p className="text-sm text-red-600">Deadline is today</p>
          )}
        </div>
      </div>
    )
  }

  // Not uploaded and deadline in future
  if (deadline?.nextUploadDate) {
    return (
      <div className={`flex items-center gap-2 ${compact ? 'text-sm' : ''}`}>
        <Clock className="w-5 h-5 text-orange-500" />
        <div>
          <p className="font-semibold text-orange-700">No Upload Yet</p>
          {!compact && (
            <p className="text-sm text-orange-600">
              Due in {deadline.daysUntilDeadline} {deadline.daysUntilDeadline === 1 ? 'day' : 'days'}
            </p>
          )}
        </div>
      </div>
    )
  }

  return null
}
