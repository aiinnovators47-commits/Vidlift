"use client"

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trophy, Flame, Calendar, Upload, CheckCircle, XCircle, AlertCircle, Loader2, Eye, ThumbsUp, MessageCircle } from 'lucide-react'
import { Challenge } from '@/types/challenge'
import { useToast } from '@/hooks/use-toast'

interface UploadTrackingPanelV2Props {
  challenge: Challenge
  onRefresh?: () => void
}

export default function UploadTrackingPanelV2({ challenge, onRefresh }: UploadTrackingPanelV2Props) {
  const { toast } = useToast()
  const uploads = (challenge as any).challenge_uploads || challenge.uploads || []
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // Today's status
  const [todayUpload, setTodayUpload] = useState<any>(null)
  const [todayIsDeadline, setTodayIsDeadline] = useState(false)
  
  // Manual upload form
  const [showManualForm, setShowManualForm] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Automatic detection with polling
  const [autoSyncing, setAutoSyncing] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [pollCheckCount, setPollCheckCount] = useState(0)

  // Auto-detect videos when component loads and it's upload day
  // NOW WITH POLLING: Continuously checks for new uploads every 10 seconds
  const triggerAutoDetect = async (isAutomatic = false) => {
    try {
      setAutoSyncing(true)
      console.log('🔄 Auto-detecting videos from YouTube...')
      console.log('Challenge ID:', challenge.id)
      console.log('User ID:', challenge.user_id)
      console.log('Next deadline:', challenge.nextUploadDeadline)
      
      const res = await fetch('/api/challenges/sync-uploads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ challengeId: challenge.id })
      })

      const data = await res.json()
      console.log('API Response:', data)

      if (!res.ok) {
        // Silently fail if automatic - user can click button manually
        if (!isAutomatic) {
          throw new Error(data.error || 'Auto-sync failed')
        }
        console.warn('Auto-sync failed:', data.error)
        return
      }

      if (data.syncedCount > 0) {
        console.log(`✅ Auto-detected ${data.syncedCount} video(s)`)
        toast({
          title: '✅ Video Auto-Detected!',
          description: `${data.syncedCount} new video(s) detected and saved automatically! Check your challenge stats.`,
          duration: 3000
        })
        // Wait a moment for animation effect
        await new Promise(resolve => setTimeout(resolve, 500))
        if (onRefresh) {
          console.log('Refreshing challenge data...')
          onRefresh()
        }
        // Stop polling since we found a video
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
          setIsPolling(false)
        }
      } else if (!isAutomatic) {
        // Only show "no videos" if user clicked the button
        const debugInfo = data.results?.map((r: any) => `${r.status}: ${r.videoTitle || r.message || r.reason}`).join(' | ')
        toast({
          title: 'No new videos found',
          description: debugInfo || 'Try uploading a new video to YouTube',
          variant: 'destructive'
        })
      } else {
        console.log('No videos detected yet, checking again in 2 seconds...')
      }
    } catch (err: any) {
      if (!isAutomatic) {
        toast({
          title: 'Auto-sync failed',
          description: err.message,
          variant: 'destructive'
        })
      }
      console.error('Auto-sync error:', err)
    } finally {
      setAutoSyncing(false)
    }
  }

  // Setup polling when it's deadline day with no upload
  useEffect(() => {
    // Check if today is deadline
    if (challenge.nextUploadDeadline) {
      const deadline = new Date(challenge.nextUploadDeadline)
      const today = new Date()
      const isToday = deadline.toDateString() === today.toDateString()
      setTodayIsDeadline(isToday)

      // Check if we already have today's upload
      const todayStr = today.toDateString()
      const todayUp = uploads?.find((upload: any) => {
        const uploadDate = new Date(upload.upload_date).toDateString()
        return uploadDate === todayStr
      })
      setTodayUpload(todayUp || null)

      // Setup continuous polling on deadline day with no upload
      if (isToday && !todayUp) {
        console.log('📅 Today is upload deadline and no upload detected yet - starting polling...')
        console.log('Current uploads:', uploads)
        
        // Trigger initial check immediately
        setTimeout(() => {
          triggerAutoDetect(true)
        }, 500)

        // Setup polling interval: Check every 2 seconds (faster detection!)
        if (!pollingIntervalRef.current) {
          console.log('⏰ Starting polling interval (every 2 seconds)')
          setIsPolling(true)
          setPollCheckCount(0)
          
          const pollInterval = setInterval(async () => {
            setPollCheckCount(prev => prev + 1)
            console.log(`🔄 Polling check #${pollCheckCount + 1} at ${new Date().toLocaleTimeString()}`)
            await triggerAutoDetect(true)
          }, 2000) // Check every 2 seconds (much faster!)

          pollingIntervalRef.current = pollInterval
        }
      } else {
        // Stop polling if upload is found or it's not deadline day
        if (pollingIntervalRef.current) {
          console.log('✅ Upload found or not deadline day - stopping polling')
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
          setIsPolling(false)
          setPollCheckCount(0)
        }
      }
    }

    // Cleanup polling on unmount
    return () => {
      if (pollingIntervalRef.current) {
        console.log('🛑 Component unmounted - stopping polling')
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [challenge.nextUploadDeadline, uploads])

  const extractVideoId = (url: string) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }
    return null
  }

  const handleManualUpload = async () => {
    if (!videoUrl.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a video URL or ID',
        variant: 'destructive'
      })
      return
    }

    const videoId = extractVideoId(videoUrl)
    if (!videoId) {
      toast({
        title: 'Error',
        description: 'Invalid YouTube URL or ID format',
        variant: 'destructive'
      })
      return
    }

    try {
      setLoading(true)
      const res = await fetch('/api/challenge-uploads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          challengeId: challenge.id,
          videoId,
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
          uploadDate: new Date().toISOString(),
          scheduledDate: challenge.nextUploadDeadline
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload')
      }

      toast({
        title: '✅ Upload Recorded!',
        description: `You earned ${data.pointsEarned} points! ${data.isOnTime ? '🎉 On-time bonus!' : ''}`
      })

      setVideoUrl('')
      setShowManualForm(false)
      if (onRefresh) onRefresh()
    } catch (err: any) {
      toast({
        title: 'Upload Failed',
        description: err.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAutoSync = () => {
    triggerAutoDetect(false) // Manual trigger - show all messages
  }

  return (
    <div className="space-y-6 relative">
      {/* Loading Animation Overlay - Shows during detection */}
      {(autoSyncing || isPolling) && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
          <Card className="w-80 bg-white shadow-2xl border-0">
            <CardContent className="pt-8 pb-8 flex flex-col items-center gap-6">
              {/* Spinner */}
              <div className="relative w-16 h-16">
                <Loader2 className="w-16 h-16 text-blue-500 animate-spin" strokeWidth={1.5} />
                <div className="absolute inset-0 bg-linear-to-t from-blue-500/10 to-transparent rounded-full" />
              </div>
              
              {/* Text */}
              <div className="text-center space-y-2">
                <h3 className="text-lg font-bold text-gray-900">Detecting Video</h3>
                <p className="text-sm text-gray-600">
                  {isPolling ? (
                    <>Continuously checking YouTube for your upload... (Check #{pollCheckCount})</>
                  ) : (
                    <>Scanning YouTube for your latest upload...</>
                  )}
                </p>
              </div>

              {/* Progress indicator */}
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-linear-to-r from-blue-500 to-cyan-500 animate-pulse rounded-full" />
              </div>

              {isPolling && (
                <div className="text-xs text-gray-500 text-center">
                  <p>⏰ Automatically checking every 2 seconds</p>
                  <p>Will auto-save when your video is detected</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Today's Status */}
      {todayIsDeadline && (
        <Card className={`border-2 ${todayUpload ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {todayUpload ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
                <div>
                  <h3 className="font-bold text-lg">Today's Deadline</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(challenge.nextUploadDeadline).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                {todayUpload ? (
                  <div>
                    <p className="text-green-600 font-bold">✅ UPLOADED</p>
                    <p className="text-sm text-green-600">+{todayUpload.points_earned || 10} points</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-red-600 font-bold">❌ NOT UPLOADED</p>
                    <p className="text-sm text-red-600">-10 points lost!</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Latest Upload - Show when today's video is uploaded */}
      {todayUpload && (
        <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Trophy className="w-5 h-5 text-amber-500" />
              Today's Upload
            </CardTitle>
            <CardDescription className="text-sm text-slate-500">Recorded on {new Date(todayUpload.upload_date).toLocaleDateString()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Video Thumbnail */}
            <div className="rounded-md overflow-hidden border border-slate-100">
              <img
                src={`https://img.youtube.com/vi/${todayUpload.video_id}/maxresdefault.jpg`}
                alt={todayUpload.video_title}
                className="w-full h-auto aspect-video object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${todayUpload.video_id}/hqdefault.jpg`
                }}
              />
            </div>

            {/* Video Title & Date */}
            <div>
              <h3 className="font-semibold text-base text-slate-900 line-clamp-2">{todayUpload.video_title || 'Untitled'}</h3>
              <p className="text-sm text-slate-500 mt-1">{new Date(todayUpload.upload_date).toLocaleTimeString()}</p>
            </div>

            {/* Video Stats - Industry-style Full Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="flex items-center gap-4 bg-white border border-slate-100 rounded-lg p-4 shadow-sm">
                <div className="flex-none rounded-md bg-slate-50 border border-slate-100 p-2">
                  <Eye className="w-6 h-6 text-slate-500" />
                </div>
                <div className="flex-1">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Views</div>
                  <div className="mt-1 text-2xl font-extrabold text-slate-900">{(todayUpload.video_views || 0).toLocaleString()}</div>
                  <div className="text-xs text-slate-400 mt-1">Realtime · Updated now</div>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-white border border-slate-100 rounded-lg p-4 shadow-sm">
                <div className="flex-none rounded-md bg-slate-50 border border-slate-100 p-2">
                  <ThumbsUp className="w-6 h-6 text-slate-500" />
                </div>
                <div className="flex-1">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Likes</div>
                  <div className="mt-1 text-2xl font-extrabold text-slate-900">{(todayUpload.video_likes || 0).toLocaleString()}</div>
                  <div className="text-xs text-slate-400 mt-1">Engagement · Audience reaction</div>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-white border border-slate-100 rounded-lg p-4 shadow-sm">
                <div className="flex-none rounded-md bg-slate-50 border border-slate-100 p-2">
                  <MessageCircle className="w-6 h-6 text-slate-500" />
                </div>
                <div className="flex-1">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Comments</div>
                  <div className="mt-1 text-2xl font-extrabold text-slate-900">{(todayUpload.video_comments || 0).toLocaleString()}</div>
                  <div className="text-xs text-slate-400 mt-1">Community · Viewer feedback</div>
                </div>
              </div>
            </div>

            {/* Points Earned */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700">Points Earned</span>
                <span className="text-2xl font-bold text-slate-900">+{todayUpload.points_earned || 10}</span>
              </div>
              {todayUpload.on_time_status && (
                <p className="text-sm text-slate-500 mt-2">Uploaded on time — bonus points awarded</p>
              )}
            </div>

            {/* Next Upload Countdown */}
            <div className="bg-white rounded-lg p-3 border border-slate-100 text-center">
              <p className="text-xs text-slate-500 font-medium mb-1">Next Upload Deadline</p>
              <p className="text-sm text-slate-700">Countdown starts from tomorrow</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Upload Form - ALWAYS VISIBLE FOR TESTING */}
      {!todayUpload && (
        <Card className={`border-blue-200 ${isPolling ? 'bg-blue-100 border-blue-400' : 'bg-blue-50'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              {showManualForm ? 'Enter Video URL' : 'Record Your Upload'}
            </CardTitle>
            <CardDescription>
              {isPolling && (
                <span className="text-blue-600 font-semibold">
                  🔄 Auto-detecting in progress... System checking YouTube every 2 seconds
                </span>
              )}
              {!isPolling && todayIsDeadline && (
                <span>Only videos from your connected YouTube channel will be accepted</span>
              )}
              {!todayIsDeadline && (
                <span>⚠️ Not deadline day yet - but you can still test auto-detect</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showManualForm ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-700">
                  Choose how to record your video:
                </p>
                {isPolling && (
                  <div className="bg-white rounded-lg p-3 border border-blue-300 text-sm text-blue-700">
                    ✅ System is automatically checking YouTube every 2 seconds
                    <br/>
                    📝 Or manually paste your video URL below
                  </div>
                )}
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowManualForm(true)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    📝 Paste Video URL
                  </Button>
                  <Button
                    onClick={handleAutoSync}
                    disabled={autoSyncing}
                    variant="outline"
                    className="flex-1"
                  >
                    {autoSyncing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Detecting...
                      </>
                    ) : (
                      <>🔄 Auto-Detect</>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="videoUrl" className="text-sm font-semibold">
                    YouTube Video URL or ID
                  </Label>
                  <Input
                    id="videoUrl"
                    placeholder="https://youtube.com/watch?v=... or video ID"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="mt-2"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Example: https://www.youtube.com/watch?v=dQw4w9WgXcQ
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleManualUpload}
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Recording...
                      </>
                    ) : (
                      <>✅ Record Upload</>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowManualForm(false)
                      setVideoUrl('')
                    }}
                    disabled={loading}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Challenge Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            Challenge Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-gray-600">Total Videos</p>
              <p className="text-2xl font-bold text-blue-600">{uploads?.length || 0}</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-gray-600">On-Time</p>
              <p className="text-2xl font-bold text-green-600">
                {uploads?.filter((u: any) => u.on_time_status).length || 0}
              </p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-xs text-gray-600">Missed</p>
              <p className="text-2xl font-bold text-red-600">{challenge.missedDays || 0}</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-xs text-gray-600">Total Points</p>
              <p className="text-2xl font-bold text-purple-600">{challenge.pointsEarned || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Streak Info */}
      {challenge.streakCount > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Flame className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">Current Streak</p>
                  <p className="text-2xl font-bold text-orange-600">{challenge.streakCount} days</p>
                </div>
              </div>
              {challenge.longestStreak && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">Best Streak</p>
                  <p className="text-2xl font-bold text-orange-600">{challenge.longestStreak} days</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
