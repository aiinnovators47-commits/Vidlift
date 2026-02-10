'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, Clock, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTodayStatus } from '@/hooks/useTodayStatus'

interface UploadNotificationBannerProps {
  challengeId: string
}

export default function UploadNotificationBanner({ challengeId }: UploadNotificationBannerProps) {
  const { status, deadline, loading } = useTodayStatus(challengeId)
  const [dismissed, setDismissed] = useState(false)

  if (loading || dismissed || !status || !deadline) {
    return null
  }

  // Uploaded today - success notification
  if (status.isUploadedToday) {
    return (
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-4 mb-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-green-900">🎉 Great Job!</h3>
            <p className="text-sm text-green-800 mt-1">
              You've uploaded your video for today! You earned <span className="font-bold">+{status.pointsEarned} points</span>.
            </p>
            {status.videoTitle && (
              <p className="text-xs text-green-700 mt-2 font-medium">
                📹 {status.videoTitle}
              </p>
            )}
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-green-500 hover:text-green-700 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    )
  }

  // Today is deadline but not uploaded - urgent notification
  if (deadline.isTodayDeadline) {
    return (
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 p-4 mb-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900">⚠️ Upload Deadline Today!</h3>
            <p className="text-sm text-red-800 mt-1">
              Don't miss your daily upload! Upload your video to YouTube to maintain your streak and earn points.
            </p>
            <div className="flex gap-2 mt-3">
              <a 
                href="https://youtube.com/upload" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                📹 Upload to YouTube
              </a>
              <button
                onClick={() => setDismissed(true)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Not uploaded but deadline in future - reminder notification
  if (deadline.nextUploadDate && deadline.daysUntilDeadline !== null && deadline.daysUntilDeadline > 0) {
    return (
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 p-4 mb-4">
        <div className="flex items-start gap-3">
          <Clock className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900">📅 Upcoming Upload</h3>
            <p className="text-sm text-blue-800 mt-1">
              Your next upload is due in <span className="font-bold">
                {deadline.daysUntilDeadline} {deadline.daysUntilDeadline === 1 ? 'day' : 'days'}
              </span>. Plan ahead!
            </p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-blue-500 hover:text-blue-700 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    )
  }

  return null
}
