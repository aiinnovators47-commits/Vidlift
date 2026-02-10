"use client"

import { useState, useEffect } from 'react'
import { Edit, Trash2, Calendar, Flame, AlertCircle, CheckCircle, XCircle, Upload, Loader2, Clock, Video, Star, X, CalendarClock, Trophy } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface ChallengeTrackingCardProps {
  challengeId: string
  latestVideoTitle: string
  latestVideoDate: string
  latestVideoViews: number
  nextUploadDate: string
  daysUntilNext: number
  uploadProgress: number
  videosUploaded: number
  cadenceEveryDays: number
  totalPoints?: number
  missedVideos?: number
  streakCount?: number
  onEdit: () => void
  onDelete: () => void
  onUpload?: () => void
  onViewVideos?: () => void
  challengeTitle?: string
}

interface TodayStatus {
  isUploadedToday: boolean
  uploadedAt: string | null
  pointsEarned: number
  videoTitle: string | null
  videoUrl: string | null
  videoId: string | null
  onTimeStatus: boolean
}

interface DeadlineInfo {
  nextUploadDate: string | null
  isTodayDeadline: boolean
  daysUntilDeadline: number | null
}

export default function ChallengeTrackingCard({
  challengeId,
  latestVideoTitle,
  latestVideoDate,
  latestVideoViews,
  nextUploadDate,
  daysUntilNext,
  uploadProgress,
  videosUploaded,
  cadenceEveryDays,
  totalPoints = 0,
  missedVideos = 0,
  streakCount = 0,
  onEdit,
  onDelete,
  onUpload,
  onViewVideos,
  challengeTitle = "Challenge"
}: ChallengeTrackingCardProps) {
  const { toast } = useToast()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [todayStatus, setTodayStatus] = useState<TodayStatus | null>(null)
  const [deadlineInfo, setDeadlineInfo] = useState<DeadlineInfo | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState<string>('')

  // Fetch today's upload status
  useEffect(() => {
    fetchTodayStatus()
    // Refresh every 30 seconds
    const interval = setInterval(fetchTodayStatus, 30000)
    return () => clearInterval(interval)
  }, [challengeId])

  // Real-time countdown timer (updates every second)
  useEffect(() => {
    const updateCountdown = () => {
      if (!deadlineInfo?.nextUploadDate) return
      
      const deadline = new Date(deadlineInfo.nextUploadDate)
      const now = new Date()
      const diff = deadline.getTime() - now.getTime()
      
      if (diff < 0) {
        setTimeRemaining('OVERDUE')
        return
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      
      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`)
    }

    updateCountdown() // Call immediately
    const interval = setInterval(updateCountdown, 1000) // Update every second
    return () => clearInterval(interval)
  }, [deadlineInfo])

  const fetchTodayStatus = async () => {
    try {
      const response = await fetch(`/api/challenges/today-status?challengeId=${challengeId}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setTodayStatus(data.status)
        setDeadlineInfo(data.deadline)
      }
    } catch (error) {
      console.error('Failed to fetch today status:', error)
    } finally {
      setLoadingStatus(false)
    }
  }

  const handleDelete = () => {
    onDelete()
    setShowDeleteConfirm(false)
  }

  const getTimeUntilDeadline = () => {
    if (!deadlineInfo?.nextUploadDate) return null
    
    const deadline = new Date(deadlineInfo.nextUploadDate)
    const now = new Date()
    const diff = deadline.getTime() - now.getTime()
    
    if (diff < 0) return 'Overdue'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours < 24) {
      return `${hours}h ${minutes}m`
    }
    
    const days = Math.floor(hours / 24)
    return `${days}d ${hours % 24}h`
  }

  return (
    <>
      <div 
        onClick={onViewVideos}
        className="rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-50 to-white border border-purple-100 shadow-sm hover:shadow-md hover:border-purple-200 p-4 sm:p-6 mb-6 cursor-pointer transition-all duration-300"
      >
        {/* Header - Mobile Responsive */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-5 h-5 sm:w-7 sm:h-7 text-purple-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Challenge Tracking</h2>
              <p className="text-gray-600 text-xs sm:text-sm mt-1">Daily Upload Status</p>
            </div>
          </div>
          <div className="flex gap-2 ml-auto sm:ml-0">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors flex-shrink-0"
              title="Edit challenge"
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowDeleteConfirm(true)
              }}
              className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-colors flex-shrink-0"
              title="Delete challenge"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TODAY'S UPLOAD STATUS CARD */}
        <div className="rounded-xl border border-purple-100 bg-white/50 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">TODAY'S VIDEO UPLOAD STATUS</span>
            {loadingStatus && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
          </div>

          {loadingStatus ? (
            <div className="py-4 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
              <p className="text-sm text-gray-600 mt-2">Loading status...</p>
            </div>
          ) : todayStatus?.isUploadedToday ? (
            // UPLOADED TODAY ✅
            <div className="space-y-3">
              {/* Status Header with Icon */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-green-600">Uploaded</p>
                    {todayStatus.uploadedAt && (
                      <p className="text-xs text-gray-500">
                        {new Date(todayStatus.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
                {todayStatus.onTimeStatus && (
                  <span className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                    <Flame className="w-3.5 h-3.5" />
                    Bonus
                  </span>
                )}
              </div>

              {/* Video Title */}
              {todayStatus.videoTitle && (
                <div className="border-l-4 border-green-500 bg-gray-50 rounded-r-lg p-3">
                  <p className="text-sm font-medium text-gray-900 line-clamp-2">{todayStatus.videoTitle}</p>
                </div>
              )}

              {/* Points & Next Upload Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Points Earned */}
                <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg p-3 border border-green-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="w-4 h-4 text-green-600 fill-green-600" />
                    <p className="text-xs font-medium text-green-700">Points</p>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{todayStatus.pointsEarned}</p>
                </div>

                {/* Next Upload */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg p-3 border border-purple-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <p className="text-xs font-medium text-purple-700">Next Upload</p>
                  </div>
                  <p className="text-sm font-bold text-purple-600">
                    {deadlineInfo?.nextUploadDate ? 
                      new Date(new Date(deadlineInfo.nextUploadDate).getTime() + (cadenceEveryDays * 24 * 60 * 60 * 1000)).toLocaleDateString([], { month: 'short', day: 'numeric' })
                      : `In ${cadenceEveryDays}d`
                    }
                  </p>
                </div>
              </div>

              {/* View Video Button */}
              {todayStatus.videoUrl && (
                <a
                  href={todayStatus.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
                >
                  <Upload className="w-4 h-4" />
                  View Video
                </a>
              )}
            </div>
          ) : (
            // NOT UPLOADED YET ❌
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                <span className="text-lg font-bold text-red-600">Not Uploaded</span>
              </div>

              {/* PROMINENT COUNTDOWN TIMER - Mobile responsive */}
              <div className="bg-gradient-to-br from-purple-100 to-white border-2 border-purple-200 rounded-2xl p-4 sm:p-6 shadow-sm">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 animate-spin" />
                    <p className="text-xs text-purple-700 uppercase font-bold tracking-widest">Time Remaining</p>
                  </div>
                  
                  {/* COUNTDOWN NUMBERS - Smaller on mobile, larger on desktop */}
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-purple-600 font-mono mb-4 sm:mb-6 tracking-tight leading-none">
                    {timeRemaining || 'Loading...'}
                  </div>
                  
                  {/* Deadline info */}
                  <div className="text-xs sm:text-sm text-gray-700 border-t border-purple-200 pt-3 sm:pt-4 space-y-1">
                    {deadlineInfo?.nextUploadDate ? (
                      <>
                        <p className="">Deadline <span className="font-bold text-purple-700">Today at {new Date(deadlineInfo.nextUploadDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></p>
                        <p className="text-xs text-gray-600">Upload before deadline to earn full points</p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-600">Upload today to keep your streak</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PERFORMANCE METRICS - 4 Cards in One Line on Desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4">
          {/* Videos Uploaded */}
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg sm:rounded-xl border border-blue-100 p-3 sm:p-4 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-700">Videos</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 sm:mt-2">{videosUploaded}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 flex items-center justify-center shadow-sm shrink-0">
                <Video className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Total Points */}
          <div className="bg-gradient-to-br from-green-50 to-white rounded-lg sm:rounded-xl border border-green-100 p-3 sm:p-4 shadow-sm hover:shadow-md hover:border-green-200 transition-all duration-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-700">Points</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 sm:mt-2">{totalPoints}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-100 flex items-center justify-center shadow-sm shrink-0">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 fill-green-600" />
              </div>
            </div>
          </div>

          {/* Missed Videos */}
          <div className="bg-gradient-to-br from-red-50 to-white rounded-lg sm:rounded-xl border border-red-100 p-3 sm:p-4 shadow-sm hover:shadow-md hover:border-red-200 transition-all duration-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-700">Missed</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 sm:mt-2">{missedVideos}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-100 flex items-center justify-center shadow-sm shrink-0">
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
              </div>
            </div>
          </div>

          {/* On-Time Streak */}
          <div className="bg-gradient-to-br from-amber-50 to-white rounded-lg sm:rounded-xl border border-amber-100 p-3 sm:p-4 shadow-sm hover:shadow-md hover:border-amber-200 transition-all duration-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-700">On-Time</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 sm:mt-2">{streakCount}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-100 flex items-center justify-center shadow-sm shrink-0">
                <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* PROGRESS BAR - Full Width */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-700 uppercase">Progress</span>
            <span className="text-sm font-bold text-purple-600">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-2">Challenge Progress</p>
        </div>


      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-white border border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Delete Challenge?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{challengeTitle}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-700 text-sm">
              <strong>Warning:</strong> All data associated with this challenge will be permanently deleted.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-gray-300"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleDelete}
            >
              Delete Challenge
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
