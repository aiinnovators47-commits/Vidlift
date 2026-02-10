"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { X, Upload, Info, Calendar, Video, Eye, ThumbsUp, MessageCircle, AlertCircle, CheckCircle, Clock, BarChart3, Flame, Target, Trophy } from 'lucide-react'
import { Challenge, ChallengeUpload } from '@/types/challenge'

interface SideContentPanelProps {
  challenge: Challenge | null
  isOpen: boolean
  type: 'upload' | 'details'
  onClose: () => void
}

export default function SideContentPanel({ 
  challenge, 
  isOpen, 
  type, 
  onClose 
}: SideContentPanelProps) {
  const [uploads, setUploads] = useState<ChallengeUpload[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && challenge && type === 'upload') {
      loadUploads()
    }
  }, [isOpen, challenge, type])

  const loadUploads = async () => {
    if (!challenge) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/challenges/${challenge.id}/videos`, {
        credentials: 'include'
      })
      const data = await response.json()
      setUploads(data.videos || [])
    } catch (error) {
      console.error('Failed to load uploads:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!challenge || !isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Side Panel */}
      <div className={`fixed right-0 top-0 h-screen w-full sm:w-[640px] bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-l border-gray-200 dark:border-slate-700 shadow-2xl transform transition-transform duration-300 z-50 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 via-blue-600 to-cyan-600 text-white p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          {type === 'upload' ? (
            <>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Track Upload</h2>
                <p className="text-xs text-blue-100 line-clamp-1">{challenge.challengeTitle}</p>
              </div>
            </>
          ) : (
            <>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Challenge Details</h2>
                <p className="text-xs text-blue-100 line-clamp-1">{challenge.challengeTitle}</p>
              </div>
            </>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/20 rounded-lg transition-colors active:bg-white/30"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto flex-1 p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
        {type === 'upload' ? (
          // Upload Tracking Section
          <>
            {/* Upload Summary */}
            <Card className="border border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Summary</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                    <Video className="w-4 h-4 text-blue-600 dark:text-blue-400 mb-1" />
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Videos</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{uploads.length}</div>
                  </div>
                  <div className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                    <Trophy className="w-4 h-4 text-cyan-600 dark:text-cyan-400 mb-1" />
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Points</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{challenge.pointsEarned || 0}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Uploads List */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Recent Uploads</h3>
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-6 h-6 border-3 border-blue-200 dark:border-blue-900/30 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">Loading...</p>
                </div>
              ) : uploads.length === 0 ? (
                <Card className="border border-dashed border-gray-300 dark:border-gray-600">
                  <CardContent className="py-6 text-center">
                    <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">No uploads yet</p>
                    <Button onClick={() => { /* TODO: open upload tracker */ }} className="mt-3 mx-auto w-fit px-4">
                      Track Upload
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {uploads.map((upload) => (
                    <Card key={upload.id} className="border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex gap-2.5">
                          {/* Thumbnail */}
                          <div className="relative flex-shrink-0">
                            <img
                              src={`https://img.youtube.com/vi/${upload.videoId}/default.jpg`}
                              alt={upload.videoTitle}
                              className="w-14 h-14 rounded-lg object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-xs text-gray-900 dark:text-white line-clamp-1 mb-1">
                              {upload.videoTitle}
                            </h4>
                            <div className="flex items-center gap-1.5 mb-1">
                              <Badge 
                                className={`text-xs h-4 ${upload.onTimeStatus ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'}`}
                              >
                                {upload.onTimeStatus ? 'On Time' : 'Late'}
                              </Badge>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(upload.uploadDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              <Eye className="w-3 h-3 text-blue-600" />
                              <span className="text-gray-600 dark:text-gray-400">{(upload.videoViews || 0) > 999 ? `${((upload.videoViews || 0) / 1000).toFixed(1)}K` : upload.videoViews || 0}</span>
                              <ThumbsUp className="w-3 h-3 text-red-600 ml-1" />
                              <span className="text-gray-600 dark:text-gray-400">{upload.videoLikes || 0}</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-sm font-bold text-green-600 dark:text-green-400">+{upload.pointsEarned}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">pts</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Next Upload */}
            <Card className="border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Next Due</p>
                    <p className="text-sm font-bold text-orange-600 dark:text-orange-400">
                      {challenge.nextUploadDeadline ? new Date(challenge.nextUploadDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No deadline'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          // Details Section
          <>
            {/* Status */}
            <div className="flex gap-2 pb-1">
              <Badge 
                className={`text-xs h-5 ${
                  challenge.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                  challenge.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                }`}
              >
                {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
              </Badge>
              <Badge className="text-xs h-5 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                {challenge.streakCount}d Streak
              </Badge>
            </div>

            {/* Challenge Info */}
            <Card className="border border-gray-200 dark:border-gray-700">
              <CardContent className="p-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Description</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100">{challenge.challengeDescription || 'No description'}</p>
                </div>
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Type</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100 capitalize">{(challenge.challengeType || 'Custom').replace(/_/g, ' ')}</p>
                </div>
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Started</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100">{new Date(challenge.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                </div>
              </CardContent>
            </Card>

            {/* Performance Stats */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Statistics</h3>
              <div className="grid grid-cols-2 gap-2">
                <Card className="border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Video className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Videos</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{challenge.uploads?.length || 0}</div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Flame className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Best</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{challenge.longestStreak || 0}d</div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Missed</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{challenge.missedDays || 0}</div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Trophy className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Points</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{challenge.pointsEarned || 0}</div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Progress */}
            <Card className="border border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Progress</p>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{challenge.completionPercentage || 0}%</span>
                </div>
                <Progress value={challenge.completionPercentage || 0} className="h-2" />
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-gray-700 p-3">
        <Button
          onClick={onClose}
          className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-semibold text-sm h-8"
        >
          Close
        </Button>
      </div>
      </div>
    </>
  )
}
