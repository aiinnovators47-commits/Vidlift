"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Calendar, CheckCircle, XCircle, Clock, Trophy, Target, Flame, Video, Eye, Heart, MessageCircle } from 'lucide-react'
import { Challenge, ChallengeUpload } from '@/types/challenge'
import { format } from 'date-fns'
import UploadList from '@/components/upload-list'
import TodayUploadStatus from '@/components/today-upload-status'

interface ChallengeDetailsModalProps {
  challenge: Challenge | null
  isOpen: boolean
  onClose: () => void
  onTrackUpload?: (challengeId: string, videoData: any) => void
}

export default function ChallengeDetailsModal({ 
  challenge, 
  isOpen, 
  onClose, 
  onTrackUpload 
}: ChallengeDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'uploads'>('overview')
  const [trackUploadOpen, setTrackUploadOpen] = useState(false)
  const [videoId, setVideoId] = useState('')
  const [videoTitle, setVideoTitle] = useState('')
  
  if (!challenge) return null

  const handleTrackUpload = () => {
    if (!videoId.trim()) return
    
    onTrackUpload?.(challenge.id, {
      videoId: videoId.trim(),
      videoTitle: videoTitle.trim() || 'Untitled Video',
      videoUrl: `https://www.youtube.com/watch?v=${videoId.trim()}`
    })
    
    setVideoId('')
    setVideoTitle('')
    setTrackUploadOpen(false)
  }

  const getUploadStatus = (scheduleItem: any) => {
    if (scheduleItem.uploaded && scheduleItem.onTime) {
      return { icon: CheckCircle, color: 'text-green-500', label: 'On Time' }
    }
    if (scheduleItem.uploaded && !scheduleItem.onTime) {
      return { icon: CheckCircle, color: 'text-orange-500', label: 'Late' }
    }
    if (new Date(scheduleItem.date) < new Date()) {
      return { icon: XCircle, color: 'text-red-500', label: 'Missed' }
    }
    return { icon: Clock, color: 'text-gray-400', label: 'Pending' }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl mb-1">
                {challenge.challengeTitle}
              </DialogTitle>
              <DialogDescription>
                {challenge.challengeDescription}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={challenge.status === 'active' ? 'default' : 'secondary'}>
                {challenge.status}
              </Badge>
              {challenge.streakCount > 0 && (
                <div className="flex items-center gap-1 text-orange-600">
                  <Flame className="w-4 h-4" />
                  <span className="text-sm font-medium">{challenge.streakCount}</span>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b px-6">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'schedule', label: 'Schedule' },
            { key: 'uploads', label: 'Uploads' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <ScrollArea className="flex-1 p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Progress Overview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Progress Overview</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Overall Progress</span>
                      <span className="text-sm font-medium">
                        {Math.round(challenge.completionPercentage || 0)}%
                      </span>
                    </div>
                    <Progress value={challenge.completionPercentage || 0} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                        <Video className="w-4 h-4" />
                      </div>
                      <div className="text-lg font-semibold">{challenge.uploads?.length || 0}</div>
                      <div className="text-xs text-gray-500">Uploaded</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                        <Target className="w-4 h-4" />
                      </div>
                      <div className="text-lg font-semibold">{challenge.progress?.length || 0}</div>
                      <div className="text-xs text-gray-500">Target</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-orange-600 mb-1">
                        <Flame className="w-4 h-4" />
                      </div>
                      <div className="text-lg font-semibold">{challenge.streakCount || 0}</div>
                      <div className="text-xs text-gray-500">Streak</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-yellow-600 mb-1">
                        <Trophy className="w-4 h-4" />
                      </div>
                      <div className="text-lg font-semibold">{challenge.pointsEarned || 0}</div>
                      <div className="text-xs text-gray-500">Points</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Today's Upload Status */}
              {challenge.status === 'active' && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="font-semibold mb-3 text-blue-900">Today's Status</h3>
                  <TodayUploadStatus challengeId={challenge.id} />
                </div>
              )}

              {/* Challenge Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="font-semibold">Challenge Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span>{challenge.durationMonths ? `${challenge.durationMonths} months` : 'Custom'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Frequency:</span>
                      <span>Every {challenge.cadenceEveryDays || 1} day(s)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Video Type:</span>
                      <span className="capitalize">{challenge.videoType || 'Mixed'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Started:</span>
                      <span>{format(new Date(challenge.startedAt), 'PPP')}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold">Statistics</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Longest Streak:</span>
                      <span>{challenge.longestStreak || 0} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Missed Days:</span>
                      <span>{challenge.missedDays || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Next Deadline:</span>
                      <span>
                        {challenge.nextUploadDeadline 
                          ? format(new Date(challenge.nextUploadDeadline), 'PPP')
                          : 'Completed'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Action */}
              {challenge.status === 'active' && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-blue-900">Ready to Upload?</h3>
                      <p className="text-sm text-blue-700">
                        Track your latest video upload to update your progress
                      </p>
                    </div>
                    <Button onClick={() => setTrackUploadOpen(true)}>
                      Track Upload
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Upload Schedule</h3>
                <div className="text-sm text-gray-500">
                  {challenge.progress?.filter((p: any) => p.uploaded).length || 0} / {challenge.progress?.length || 0} completed
                </div>
              </div>

              <div className="grid gap-3">
                {challenge.progress?.map((item: any, index: number) => {
                  const status = getUploadStatus(item)
                  const StatusIcon = status.icon
                  
                  return (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <StatusIcon className={`w-5 h-5 ${status.color}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Day {item.day}</span>
                          <Badge variant="outline" className="text-xs">
                            {status.label}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(item.date), 'PPP')}
                        </div>
                        {item.uploaded && item.videoTitle && (
                          <div className="text-sm text-blue-600 mt-1">
                            📹 {item.videoTitle}
                          </div>
                        )}
                      </div>
                      {item.uploaded && (
                        <div className="text-right">
                          <div className="text-sm font-medium text-yellow-600">
                            +{item.points || 0} pts
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === 'uploads' && (
            <UploadList challengeId={challenge.id} />
          )}
        </ScrollArea>

        {/* Track Upload Dialog */}
        {trackUploadOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="font-semibold text-lg mb-4">Track Video Upload</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="videoId">YouTube Video ID or URL</Label>
                  <Input
                    id="videoId"
                    placeholder="e.g., dQw4w9WgXcQ or full URL"
                    value={videoId}
                    onChange={(e) => {
                      const input = e.target.value.trim()
                      // Extract video ID from various YouTube URL formats
                      const match = input.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
                      setVideoId(match ? match[1] : input)
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="videoTitle">Video Title (Optional)</Label>
                  <Input
                    id="videoTitle"
                    placeholder="Will be fetched automatically if connected"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setTrackUploadOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleTrackUpload} disabled={!videoId.trim()}>
                  Track Upload
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}