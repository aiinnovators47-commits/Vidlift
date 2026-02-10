"use client"

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Sparkles, Youtube, Monitor, Smartphone, Calendar, Clock, Eye, Heart, MessageCircle, Trophy, Target, Flame, Award, Users, Plus, BarChart3, Crown, Medal, Zap, CheckCircle, XCircle, AlertCircle, Upload, Info, Trash2, Loader2 } from 'lucide-react'
import SharedSidebar from '@/components/shared-sidebar'
import ChallengeTrackingCard from '@/components/challenge-tracking-card'
import ChallengeVideosModal from '@/components/challenge-videos-modal'
import ChallengeVideosDetailModal from '@/components/challenge-videos-detail-modal'
import ChallengeCreator from '@/components/challenge-creator'
import ChallengeStats from '@/components/challenge-stats'
import SideContentPanel from '@/components/side-content-panel'
import UploadTrackingPanelV2 from '@/components/upload-tracking-panel-v2'
import LeaderboardPanel from '@/components/leaderboard-panel'
import UploadVideoDialog from '@/components/upload-video-dialog'
import { useToast } from '@/hooks/use-toast'
import { savePrimaryChannelToLocalStorage, saveAllChannelsToLocalStorage, getPrimaryChannelFromLocalStorage } from '@/lib/channelStorage'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Challenge, UserChallengeStats, CHALLENGE_TEMPLATES, ChallengeConfig } from '@/types/challenge'

const NotificationBell = dynamic(() => import('@/components/notification-bell'), { ssr: false }) 

type CreatorChallengePlan = {
  durationMonths: number
  cadenceEveryDays: number
  videosPerCadence: number
  createdAt: string
}

type CreatorChallengeVideo = {
  videoNumber: number
  uploadDay: number
  uploadIndexInDay: number
}

interface YouTubeChannel {
  id: string
  title: string
  description?: string
  thumbnail: string
  subscriberCount: string
  videoCount: string
  viewCount: string
}

function formatNumber(num: string | number) {
  const n = typeof num === 'string' ? Number(num) : num
  if (!Number.isFinite(n)) return '0'

  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(Math.round(n))
}

export default function ChallengePage() {
  const { toast } = useToast()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [youtubeChannel, setYoutubeChannel] = useState<YouTubeChannel | null>(null)
  const [additionalChannelsList, setAdditionalChannelsList] = useState<YouTubeChannel[]>([])
  const [showChannelMenu, setShowChannelMenu] = useState(false)
  const channelMenuRef = useRef<HTMLDivElement | null>(null)
  const [showInitialLoader, setShowInitialLoader] = useState(false) // Disabled - no loading modal needed
  const [challengeLoaderDuration, setChallengeLoaderDuration] = useState(0)

  // Initial loader disabled - navigation is now instant
  useEffect(() => {
    // No loading needed - page loads instantly from localStorage
    setShowInitialLoader(false)
  }, [])

  const [plan, setPlan] = useState<CreatorChallengePlan | null>(null)
  const [setupHidden, setSetupHidden] = useState(false)
  const [durationMonths, setDurationMonths] = useState(6)
  const [cadenceEveryDays, setCadenceEveryDays] = useState(2)
  const [videosPerCadence, setVideosPerCadence] = useState(1)
  const [showMore, setShowMore] = useState(false)

  // Points system states
  const [points, setPoints] = useState<number | null>(null)
  const [pointsRefreshTrigger, setPointsRefreshTrigger] = useState(0)
  const [insufficientPointsError, setInsufficientPointsError] = useState("")

  const [challengeStartedAt, setChallengeStartedAt] = useState<string | null>(null)
  const [showAllVideos, setShowAllVideos] = useState(false)

  // UI states while preparing a schedule (shows spinner & disables actions)
  const [isPreparing, setIsPreparing] = useState(false)
  const [isStartingAnimation, setIsStartingAnimation] = useState(false)
  const [showStartedBanner, setShowStartedBanner] = useState(false)

  // Challenge modal states
  const [showChallengeModal, setShowChallengeModal] = useState(false)
  const [challengeData, setChallengeData] = useState<any>(null)
  const [challengeVideoSchedule, setChallengeVideoSchedule] = useState<any[]>([])
  const [loadingChallengeData, setLoadingChallengeData] = useState(true)

  // Enhanced features state
  const [activeTab, setActiveTab] = useState<'challenges' | 'create' | 'stats' | 'leaderboard'>('challenges')
  const [allChallenges, setAllChallenges] = useState<Challenge[]>([])
  const [userStats, setUserStats] = useState<UserChallengeStats | null>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [showUploadTracker, setShowUploadTracker] = useState(false)
  const [uploadVideoId, setUploadVideoId] = useState('')
  const [trackingChallenge, setTrackingChallenge] = useState<string | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [leaderboardLoading, setLeaderboardLoading] = useState(true)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadVideoUrl, setUploadVideoUrl] = useState('')
  const [selectedChallengeForUpload, setSelectedChallengeForUpload] = useState<string | null>(null)

  // Delete challenge confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [challengeToDelete, setChallengeToDelete] = useState<Challenge | null>(null)
  const [deletingChallengeId, setDeletingChallengeId] = useState<string | null>(null)
  
  // Side panel states
  const [sidePanelOpen, setSidePanelOpen] = useState(false)
  const [sidePanelType, setSidePanelType] = useState<'upload' | 'details'>('upload')
  const [sidePanelChallenge, setSidePanelChallenge] = useState<Challenge | null>(null)

  // Videos modal state
  const [showVideosModal, setShowVideosModal] = useState(false)
  const [selectedChallengeForVideos, setSelectedChallengeForVideos] = useState<Challenge | null>(null)
  const [challengeVideos, setChallengeVideos] = useState<any[]>([])
  const [visibleVideosCount, setVisibleVideosCount] = useState(6)

  // New states for the step-by-step flow
  const [step, setStep] = useState<'start' | 'setup' | 'videoType' | 'progress'>('start')
  const [selectedDuration, setSelectedDuration] = useState(6) // months
  const [selectedFrequency, setSelectedFrequency] = useState(2) // days
  const [selectedVideoType, setSelectedVideoType] = useState<'long' | 'shorts' | null>(null)
  const [challengeStartDate, setChallengeStartDate] = useState<Date | null>(null)
  const [showProgressDetails, setShowProgressDetails] = useState(false)

  // Staged animation when selecting video type: 'idle' | 'running' (first gif) | 'loading2' (second gif)
  const [animStage, setAnimStage] = useState<'idle' | 'running' | 'loading2'>('idle')
  const animT1 = useRef<number | null>(null)
  const animT2 = useRef<number | null>(null)
  const [isRefreshingStats, setIsRefreshingStats] = useState(false)
  const [lastStatsUpdate, setLastStatsUpdate] = useState<Date | null>(null)

  useEffect(() => {
    return () => {
      if (animT1.current) clearTimeout(animT1.current)
      if (animT2.current) clearTimeout(animT2.current)
    }
  }, [])

  // Fetch user points on mount
  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const response = await fetch('/api/user/points')
        const data = await response.json()
        if (data.success) {
          setPoints(data.points)
        }
      } catch (error) {
        console.error('Error fetching points:', error)
      }
    }
    fetchPoints()
  }, [])

  // Load enhanced features data
  useEffect(() => {
    loadAllChallenges()
    loadUserStats()
    loadLeaderboard()
  }, [])

  // Auto-refresh challenge upload stats every 1 minute
  useEffect(() => {
    const refreshStats = async () => {
      if (!allChallenges || allChallenges.length === 0) return

      // Collect all video IDs from all challenges
      const videoIds: string[] = []
      allChallenges.forEach((challenge) => {
        if (challenge.uploads && challenge.uploads.length > 0) {
          challenge.uploads.forEach((upload: any) => {
            const videoId = upload.video_id || upload.videoId
            if (videoId) videoIds.push(videoId)
          })
        }
      })

      if (videoIds.length === 0) return

      setIsRefreshingStats(true)
      try {
        const accessToken = localStorage.getItem('youtube_access_token')
        const response = await fetch('/api/challenge-uploads/refresh-stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoIds, accessToken })
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.stats) {
            // Update allChallenges with new stats
            setAllChallenges((prevChallenges) => {
              return prevChallenges.map((challenge) => {
                if (!challenge.uploads || challenge.uploads.length === 0) return challenge

                const updatedUploads = challenge.uploads.map((video: any) => {
                  const updatedStat = data.stats.find((s: any) => s.video_id === (video.video_id || video.videoId))
                  if (updatedStat) {
                    return {
                      ...video,
                      video_views: updatedStat.video_views,
                      videoViews: updatedStat.video_views,
                      video_likes: updatedStat.video_likes,
                      videoLikes: updatedStat.video_likes,
                      video_comments: updatedStat.video_comments,
                      videoComments: updatedStat.video_comments
                    }
                  }
                  return video
                })

                return { ...challenge, uploads: updatedUploads }
              })
            })
            setLastStatsUpdate(new Date())
            console.log('📊 Stats updated:', data.updated, 'videos')
          }
        }
      } catch (error) {
        console.error('Error refreshing stats:', error)
      } finally {
        setIsRefreshingStats(false)
      }
    }

    // Initial refresh after 5 seconds
    const initialTimeout = setTimeout(refreshStats, 5000)

    // Set up interval for every 60 seconds
    const interval = setInterval(refreshStats, 60000)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [allChallenges.length])

  const loadAllChallenges = async () => {
    try {
      const response = await fetch('/api/challenges?includeUploads=true', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        console.error('Failed to load challenges:', response.status, response.statusText)
        return
      }
      
      const data = await response.json()
      setAllChallenges(data.challenges || [])
    } catch (error) {
      console.error('Failed to load challenges:', error)
    }
  }

  const handleCreateChallenge = async (config: any) => {
    try {
      const response = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(config)
      })
      const data = await response.json()
      
      if (response.ok) {
        toast({ title: 'Challenge created successfully!', description: 'Your challenge has been started.' })
        setActiveTab('challenges')
        loadAllChallenges()
      } else {
        const errorMsg = data.message || data.error || `Error: ${response.status}`
        console.error('Challenge creation failed:', errorMsg, data)
        toast({ 
          title: 'Failed to create challenge', 
          description: errorMsg,
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Failed to create challenge:', error)
      toast({ 
        title: 'Error', 
        description: 'Failed to create challenge. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const loadUserStats = async () => {
    try {
      const response = await fetch('/api/challenges/stats', {
        credentials: 'include'
      })
      const data = await response.json()
      
      if (response.ok) {
        setUserStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  const loadLeaderboard = async () => {
    try {
      const response = await fetch('/api/challenges/leaderboard?limit=10', {
        credentials: 'include'
      })
      const data = await response.json()
      
      if (response.ok) {
        setLeaderboard(data.leaderboard || [])
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error)
    } finally {
      setLeaderboardLoading(false)
    }
  }

  // Enhanced challenge functions
  const handleTrackUpload = async (challengeId: string) => {
    if (!uploadVideoId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a video ID or URL",
        variant: "destructive"
      })
      return
    }

    try {
      const videoId = extractVideoId(uploadVideoId)
      const response = await fetch('/api/challenges/track-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          challengeId,
          videoId,
          videoTitle: 'Manual Upload',
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: "Success! 🎬",
          description: data.message || "Upload tracked successfully!",
        })
        
        setUploadVideoId('')
        setShowUploadTracker(false)
        setTrackingChallenge(null)
        loadAllChallenges()
        loadUserStats()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to track upload",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to track upload",
        variant: "destructive"
      })
    }
  }

  const extractVideoId = (input: string): string => {
    // Extract video ID from URL or return input if it's already an ID
    const match = input.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
    return match ? match[1] : input
  }

  const getStatusIcon = (challenge: Challenge) => {
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

  // Delete challenge helpers
  const handleRequestDelete = (challenge: Challenge) => {
    setChallengeToDelete(challenge)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteChallenge = async (challengeId?: string) => {
    if (!challengeId) return
    try {
      setDeletingChallengeId(challengeId)
      const res = await fetch(`/api/challenges/${encodeURIComponent(challengeId)}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: 'Challenge deleted', description: data.message || 'Deleted successfully' })
        setAllChallenges(prev => prev.filter(c => c.id !== challengeId))

        // If deleted challenge is stored locally (creator flow), clear local storage keys
        try {
          const storedId = localStorage.getItem('creator_challenge_id')
          if (storedId && storedId === challengeId) {
            localStorage.removeItem('creator_challenge_id')
            localStorage.removeItem('creator_challenge_plan')
            localStorage.removeItem('creator_challenge_setup_hidden')
            localStorage.removeItem('creator_challenge_started_at')
            localStorage.removeItem('challenge_scheduled_meta')
          }
        } catch (e) {
          console.warn('Could not clear localStorage after delete', e)
        }

        // Close side panel if this was the selected challenge
        if (sidePanelChallenge?.id === challengeId) {
          setSidePanelOpen(false)
          setSidePanelChallenge(null)
        }

        // If we were tracking upload for this challenge, reset
        if (trackingChallenge === challengeId) setTrackingChallenge(null)

        setDeleteConfirmOpen(false)
        setChallengeToDelete(null)
      } else {
        toast({ title: 'Delete failed', description: data.error || data.message || 'Failed to delete', variant: 'destructive' })
      }
    } catch (e) {
      console.error('Failed to delete challenge', e)
      toast({ title: 'Error', description: 'Failed to delete challenge', variant: 'destructive' })
    } finally {
      setDeletingChallengeId(null)
    }
  }

  const formatTimeUntilDeadline = (deadline: string): string => {
    const now = new Date()
    const target = new Date(deadline)
    const diff = target.getTime() - now.getTime()

    if (diff <= 0) return 'Overdue'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours < 24) return `${hours}h left`
    
    const days = Math.floor(hours / 24)
    return `${days}d left`
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />
    if (rank === 2) return <Trophy className="w-5 h-5 text-gray-400" />
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-500">#{rank}</span>
  }

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'Legend': return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
      case 'Master': return 'bg-gradient-to-r from-orange-400 to-red-500 text-white'
      case 'Pro': return 'bg-gradient-to-r from-blue-400 to-purple-500 text-white'
      case 'Creator': return 'bg-gradient-to-r from-green-400 to-blue-500 text-white'
      default: return 'bg-gray-200 text-gray-700'
    }
  }

  const handleSelectVideoType = (type: 'long' | 'shorts') => {
    // select immediately for visual state
    setSelectedVideoType(type)
    // start first animation (running gif)
    setAnimStage('running')
    // after 3s switch to loading2
    animT1.current = window.setTimeout(() => {
      setAnimStage('loading2')
    }, 3000)
    // after 5s finish and proceed to progress and persist selection
    animT2.current = window.setTimeout(async () => {
      setAnimStage('idle')
      setStep('progress')
      // persist to server if we have a challenge id
      try {
        let id = localStorage.getItem('creator_challenge_id')
        // If we don't have an id yet, try creating the challenge first
        if (!id) {
          const startRes = await startChallenge()
          if (!startRes || startRes?.success === false) {
            toast({ title: 'Failed to save selection', description: startRes?.error || 'Unable to start challenge' })
            return
          }
          id = startRes?.id || localStorage.getItem('creator_challenge_id')
        }

        if (id) {
          const res = await fetch(`/api/user-challenge?id=${encodeURIComponent(id)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ config: { videoType: type }, videoType: type })
          })
          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Server error' }))
            const { error } = err as any
            toast({ title: 'Could not save selection', description: error || 'Server error' })
          } else {
            toast({ title: 'Saved format', description: `Selected ${type === 'long' ? 'Long Video (16:9)' : 'Shorts (9:16)'}` })
          }
        }
      } catch (e) {
        console.error('Failed to persist videoType', e)
        toast({ title: 'Save failed', description: String(e?.message || e) })
      }
    }, 5000)
  }

  // Custom / flexible setup states
  const [customDurationEnabled, setCustomDurationEnabled] = useState(false)
  const [customMonths, setCustomMonths] = useState<number>(3)



  // Keep inputs synced with computed defaults when base settings change


  // Schedule count: show fewer items on small screens for clarity
  const scheduleCount = useMemo(() => {
    const months = customDurationEnabled ? customMonths : selectedDuration
    const daysBetween = selectedFrequency || 1
    const totalUploads = Math.max(1, Math.floor((months * 30) / daysBetween))
    if (typeof window === 'undefined') return Math.min(10, totalUploads)
    return window.innerWidth < 640 ? Math.min(5, totalUploads) : Math.min(10, totalUploads)
  }, [customDurationEnabled, customMonths, selectedDuration, selectedFrequency])

  // Toggle to view the full schedule list
  const [showFullSchedule, setShowFullSchedule] = useState(false)

  // Total uploads derived from plan (used for View more and full expansion)
  const totalUploads = useMemo(() => {
    const months = customDurationEnabled ? customMonths : selectedDuration
    const daysBetween = selectedFrequency || 1
    return Math.max(1, Math.floor((months * 30) / daysBetween))
  }, [customDurationEnabled, customMonths, selectedDuration, selectedFrequency])

  // Schedule dates for the whole plan (used for heatmap and stats)
  const scheduleDates = useMemo(() => {
    if (!challengeStartDate) return [] as Date[]
    const out: Date[] = []
    for (let i = 0; i < totalUploads; i++) {
      out.push(new Date(challengeStartDate.getTime() + i * (selectedFrequency || 1) * 24 * 60 * 60 * 1000))
    }
    return out
  }, [challengeStartDate, totalUploads, selectedFrequency])

  // Simple derived consistency metrics (based on dates that are in the past)
  const uploadedCount = useMemo(() => scheduleDates.filter(d => d < new Date()).length, [scheduleDates])
  const consistencyPercent = useMemo(() => Math.round((uploadedCount / Math.max(1, totalUploads)) * 100), [uploadedCount, totalUploads])
  const currentStreak = useMemo(() => {
    // Count consecutive past uploads starting from the most recent scheduled date
    let streak = 0
    const today = new Date().setHours(0,0,0,0)
    for (let i = scheduleDates.length - 1; i >= 0; i--) {
      const d = scheduleDates[i].setHours(0,0,0,0)
      if (d < today) streak++
      else break
    }
    return streak
  }, [scheduleDates])

  // Calculate days until next upload
  const daysUntilNext = useMemo(() => {
    const now = new Date()
    for (const date of scheduleDates) {
      if (date > now) {
        const diffTime = date.getTime() - now.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return Math.max(0, diffDays)
      }
    }
    return 0
  }, [scheduleDates])

  // Metadata for scheduled videos (titles, thumbnails, notes, uploaded state)
  type ScheduledMeta = {
    title?: string
    thumbnail?: string
    notes?: string
    duration?: string
    uploaded?: boolean
    uploadedAt?: string | null
  }

  const [scheduledMeta, setScheduledMeta] = useState<Record<number, ScheduledMeta>>({})
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editorDraft, setEditorDraft] = useState<ScheduledMeta>({})

  // Load saved meta from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('challenge_scheduled_meta')
      if (raw) setScheduledMeta(JSON.parse(raw))
    } catch {
      // noop
    }
  }, [])

  // Persist scheduled meta
  useEffect(() => {
    try {
      localStorage.setItem('challenge_scheduled_meta', JSON.stringify(scheduledMeta))
    } catch {
      // noop
    }
  }, [scheduledMeta])

  // Fetch active challenge data
  useEffect(() => {
    const fetchChallengeData = async () => {
      setLoadingChallengeData(true)
      try {
        const res = await fetch('/api/user-challenge', {
          credentials: 'include'
        })
        if (res.ok) {
          const data = await res.json()
          if (data?.challenge) {
            setChallengeData(data.challenge)
            const progress = data.challenge.progress || []
            setChallengeVideoSchedule(progress)
            console.log('Loaded challenge data on challenge page:', data.challenge)
            
            // If challenge already exists, skip to progress view
            if (data.challenge.started_at) {
              setStep('progress')
              // Set the start date and config from the existing challenge
              const startDate = new Date(data.challenge.started_at)
              setChallengeStartDate(startDate)
              
              // Extract config values
              if (data.challenge.config) {
                setSelectedDuration(data.challenge.config.durationMonths || 6)
                setSelectedFrequency(data.challenge.config.cadenceEveryDays || 2)
                setSelectedVideoType(data.challenge.config.videoType || null)
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching challenge on challenge page:', error)
      } finally {
        setLoadingChallengeData(false)
      }
    }

    fetchChallengeData()
  }, [])

  const toggleUploaded = (index: number) => {
    setScheduledMeta(prev => {
      const next = { ...prev };
      const current = next[index] || {};
      if (current.uploaded) {
        current.uploaded = false
        current.uploadedAt = null
      } else {
        current.uploaded = true
        current.uploadedAt = new Date().toISOString()
      }
      next[index] = current

      // Persist change to server in background
      ;(async () => {
        try {
          const id = localStorage.getItem('creator_challenge_id')
          if (!id) return
          const progressArr = Object.keys(next).map((k) => next[Number(k)])
          const res = await fetch(`/api/user-challenge?id=${encodeURIComponent(id)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ progress: progressArr })
          })
          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Server error' }))
            toast({ title: 'Failed to save progress', description: err?.error || 'Server error' })
          }
        } catch (e) {
          console.error('Failed to persist progress to server', e)
          toast({ title: 'Failed to save progress', description: String(e?.message || e) })
        }
      })()

      return next
    })
  }

  const openEditor = (index: number) => {
    setEditingIndex(index)
    setEditorDraft(scheduledMeta[index] || {
      title: `Video ${index + 1}`
    })
  }

  const saveEditor = async () => {
    if (editingIndex === null) return
    setScheduledMeta(prev => {
      const next = { ...prev, [editingIndex]: editorDraft };

      // Persist progress to server
      ;(async () => {
        try {
          const id = localStorage.getItem('creator_challenge_id')
          if (!id) return
          const progressArr = Object.keys(next).map((k) => next[Number(k)])
          const res = await fetch(`/api/user-challenge?id=${encodeURIComponent(id)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ progress: progressArr })
          })
          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Server error' }))
            toast({ title: 'Failed to save progress', description: err?.error || 'Server error' })
          }
        } catch (e) {
          console.error('Failed to persist progress to server', e)
          toast({ title: 'Failed to save progress', description: String(e?.message || e) })
        }
      })()

      return next
    })
    setEditingIndex(null)
  }

  const closeEditor = () => {
    setEditingIndex(null)
  }

  const visibleAdditionalChannels = useMemo(() => {
    return (additionalChannelsList || []).filter((ch) => ch && ch.id && ch.id !== youtubeChannel?.id)
  }, [additionalChannelsList, youtubeChannel?.id])

  const uniqueChannelCount = useMemo(() => {
    const map: Record<string, boolean> = {}
    if (youtubeChannel?.id) map[youtubeChannel.id] = true
    for (const ch of (additionalChannelsList || [])) {
      if (ch && ch.id) map[String(ch.id)] = true
    }
    return Object.keys(map).length
  }, [youtubeChannel, additionalChannelsList])

  const startYouTubeAuth = () => {
    try {
      localStorage.setItem('oauth_return_page', 'challenge')
    } catch {}
    window.location.href = '/api/youtube/auth'
  }

  const computed = useMemo(() => {
    const safeDurationMonths = Math.max(1, Math.min(24, Number(durationMonths) || 1))
    const safeCadenceEveryDays = Math.max(1, Math.min(30, Number(cadenceEveryDays) || 1))
    const safeVideosPerCadence = Math.max(1, Math.min(10, Number(videosPerCadence) || 1))

    // Use 30 days/month for simple, predictable math.
    const totalDays = safeDurationMonths * 30

    // Uploads happen on day 1, then every N days: 1, 1+N, 1+2N...
    const uploadDaysCount = Math.floor((Math.max(1, totalDays) - 1) / safeCadenceEveryDays) + 1
    const totalVideos = uploadDaysCount * safeVideosPerCadence
    const perMonth = Math.round((totalVideos / safeDurationMonths) * 10) / 10
    const perWeek = Math.round(((totalVideos / totalDays) * 7) * 10) / 10

    return {
      durationMonths: safeDurationMonths,
      cadenceEveryDays: safeCadenceEveryDays,
      videosPerCadence: safeVideosPerCadence,
      totalDays,
      totalVideos,
      perMonth,
      perWeek,
    }
  }, [durationMonths, cadenceEveryDays, videosPerCadence])

  // Setup summary for user-friendly calculations shown in the UI
  const setupSummary = useMemo(() => {
    const months = selectedDuration || 6
    const totalDays = months * 30
    const daysPerVideo = Math.max(1, selectedFrequency || 2)
    const totalVideos = Math.max(1, Math.floor(totalDays / daysPerVideo))
    const perDay = totalVideos / totalDays
    const perWeek = perDay * 7
    const perMonth = totalVideos / months
    const avgSpacing = Math.max(1, Math.round(totalDays / Math.max(1, totalVideos)))
    return { months, totalDays, daysPerVideo, totalVideos, perDay, perWeek, perMonth, avgSpacing }
  }, [selectedDuration, selectedFrequency])



  const plannedVideos = useMemo((): CreatorChallengeVideo[] => {
    const safeTotalDays = Math.max(1, computed.totalDays)
    const cadence = Math.max(1, computed.cadenceEveryDays)
    const perCadence = Math.max(1, computed.videosPerCadence)

    const out: CreatorChallengeVideo[] = []
    let videoNumber = 1

    for (let day = 1; day <= safeTotalDays; day += cadence) {
      for (let i = 1; i <= perCadence; i++) {
        out.push({
          videoNumber,
          uploadDay: day,
          uploadIndexInDay: i,
        })
        videoNumber += 1
      }
    }

    return out
  }, [computed.totalDays, computed.cadenceEveryDays, computed.videosPerCadence])

  const persistPlan = (nextPlan: CreatorChallengePlan) => {
    try {
      localStorage.setItem('creator_challenge_plan', JSON.stringify(nextPlan))
    } catch {}
    setPlan(nextPlan)
  }

  // Deduct points for starting a challenge
  const deductPointsForChallenge = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/user/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deduct', feature: 'CHALLENGE_START' }),
      })

      const data = await response.json()

      if (!data.success) {
        setInsufficientPointsError(`❌ Insufficient points! Need ${data.requiredPoints}, you have ${data.availablePoints}`)
        setTimeout(() => setInsufficientPointsError(""), 5000)
        return false
      }

      setPoints(data.points)
      setPointsRefreshTrigger(prev => prev + 1)
      console.log(`✅ Points deducted: ${data.deducted}. Remaining: ${data.points}`)
      return true
    } catch (error) {
      console.error('Error deducting points:', error)
      return false
    }
  }

  const startChallenge = async () => {
    // Deduct points first
    const canProceed = await deductPointsForChallenge()
    if (!canProceed) {
      return { success: false, error: 'Insufficient points to start challenge' }
    }
    
    // Use the ACTUAL user-selected values, not computed defaults
    const userSelectedDuration = customDurationEnabled ? customMonths : selectedDuration
    const userSelectedFrequency = selectedFrequency
    const userSelectedVideosPerCadence = videosPerCadence
    
    const nextPlan: CreatorChallengePlan = {
      durationMonths: userSelectedDuration,
      cadenceEveryDays: userSelectedFrequency,
      videosPerCadence: userSelectedVideosPerCadence,
      createdAt: new Date().toISOString(),
    }
    persistPlan(nextPlan)

    const ts = new Date().toISOString()
    try {
      localStorage.setItem('creator_challenge_started_at', ts)
      localStorage.setItem('creator_challenge_setup_hidden', '1')
    } catch {}
    setChallengeStartedAt(ts)
    setSetupHidden(true)
    setShowAllVideos(false)

    // Attempt to persist to server
    try {
      const res = await fetch('/api/user-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          config: nextPlan, 
          progress: Object.values(scheduledMeta),
          // Send explicit column values from user input
          durationMonths: userSelectedDuration,
          cadenceEveryDays: userSelectedFrequency,
          videosPerCadence: userSelectedVideosPerCadence,
          videoType: selectedVideoType
        })
      })

      if (!res.ok) {
        if (res.status === 401) {
          toast({ title: 'Sign in required', description: 'Please sign in to save your challenge' })
          return { success: false, error: 'Unauthorized' }
        }
        const err = await res.json().catch(() => ({ error: 'Unknown server error' }))
        console.error('Failed to start challenge:', err)
        toast({ title: 'Failed to start challenge', description: err?.error || 'Server error' })
        return { success: false, error: err?.error || 'Server error' }
      }

      const json = await res.json()
      console.log('Challenge started response:', json)
      
      if (json?.id) {
        try { localStorage.setItem('creator_challenge_id', json.id) } catch {}
      } else {
        console.warn('No challenge ID returned from server')
      }
      
      // Return the server response so caller can show success after animations
      return { success: true, id: json?.id, ...json }
    } catch (e) {
      console.error('Failed to persist challenge to server', e)
      // Return an error shape instead of showing toast here; caller will handle message timing
      return { success: false, error: String(e?.message || e) }
    }
  }

  const handleSaveAndHide = async () => {
    const nextPlan: CreatorChallengePlan = {
      durationMonths: computed.durationMonths,
      cadenceEveryDays: computed.cadenceEveryDays,
      videosPerCadence: computed.videosPerCadence,
      createdAt: new Date().toISOString(),
    }
    persistPlan(nextPlan)
    setShowMore(false)
    setSetupHidden(true)
    try {
      localStorage.setItem('creator_challenge_setup_hidden', '1')
    } catch {}

    // Persist config to server
    try {
      const id = localStorage.getItem('creator_challenge_id')
      if (!id) return
      await fetch(`/api/user-challenge?id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: nextPlan })
      })
    } catch (e) {
      console.error('Failed to persist challenge config to server', e)
    }
  }

  const handleEditPlan = () => {
    setSetupHidden(false)
    setShowMore(false)
    setStep('setup')
    toast({ title: 'Edit Mode', description: 'Adjust your challenge settings below' })
    try {
      localStorage.setItem('creator_challenge_setup_hidden', '0')
    } catch {}
  }

  const handleResetPlan = async () => {
    if (!confirm('Are you sure? This will delete your challenge and all progress data.')) return

    try {
      setShowAllVideos(false)
      // Attempt to delete on server
      try {
        const id = localStorage.getItem('creator_challenge_id')
        if (id) {
          const res = await fetch(`/api/user-challenge?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
          if (!res.ok) {
            throw new Error('Failed to delete from server')
          }
        }
      } catch (e) {
        console.error('Failed to delete challenge on server', e)
        toast({ title: 'Warning', description: 'Challenge deleted locally, but server sync failed' })
      }

      // Clear local storage
      try {
        localStorage.removeItem('creator_challenge_plan')
        localStorage.removeItem('creator_challenge_setup_hidden')
        localStorage.removeItem('creator_challenge_started_at')
        localStorage.removeItem('creator_challenge_id')
        localStorage.removeItem('challenge_scheduled_meta')
      } catch {}
      
      // Reset state
      setPlan(null)
      setSetupHidden(false)
      setShowMore(false)
      setChallengeStartedAt(null)
      setShowAllVideos(false)
      setStep('start')
      setSelectedDuration(6)
      setSelectedFrequency(2)
      setVideosPerCadence(1)
      setSelectedVideoType(null)
      setScheduledMeta({})
      
      toast({ title: 'Challenge Deleted', description: 'Your challenge has been removed' })
    } catch (e) {
      console.error('Error deleting challenge:', e)
      toast({ title: 'Error', description: 'Failed to delete challenge' })
    }
  }

  const handleOpenChallenge = () => {
    setShowAllVideos(true)
    setStep('progress')
    toast({ title: 'Challenge Opened', description: 'View your progress below' })
  }

  // Load channels from DB (same source as dashboard) - FAST strategy (localStorage first)
  useEffect(() => {
    const loadChannelData = async () => {
      try {
        // Strategy 1: Try localStorage first (instant, <1ms) ⚡
        let channel = getPrimaryChannelFromLocalStorage()
        
        if (channel) {
          console.log('[challenge] ⚡ Channel from localStorage (instant):', channel.title)
          setYoutubeChannel(channel as YouTubeChannel)
          
          // Load additional channels from localStorage too
          const stored = localStorage.getItem('additional_youtube_channels')
          if (stored) {
            try {
              const additional = JSON.parse(stored)
              setAdditionalChannelsList(additional)
            } catch (e) {
              console.warn('[challenge] Failed to parse additional channels')
            }
          }
          
          // In background, refresh from DB if needed
          loadChannelDataFromDB()
          return
        }

        // Strategy 2: If not in localStorage, fetch from DB
        console.log('[challenge] 📡 Loading channel from database...')
        await loadChannelDataFromDB()
        
      } catch (err) {
        console.error('[challenge] Error loading channel:', err)
      }
    }

    const loadChannelDataFromDB = async () => {
      try {
        const res = await fetch('/api/channels', {
          credentials: 'include'
        })
        if (!res.ok) return
        const data = await res.json()
        if (!data?.channels || !Array.isArray(data.channels)) return

        // Save all channels to localStorage for instant future access
        saveAllChannelsToLocalStorage(data.channels)
        
        const primary = data.channels.find((ch: any) => ch.is_primary)
        if (primary) {
          setYoutubeChannel({
            id: primary.channel_id,
            title: primary.title,
            description: primary.description,
            thumbnail: primary.thumbnail,
            subscriberCount: primary.subscriber_count?.toString() || '0',
            videoCount: primary.video_count?.toString() || '0',
            viewCount: primary.view_count?.toString() || '0',
          })
          console.log('[challenge] ✓ Primary channel loaded and cached:', primary.title)
        }

        const additional = data.channels
          .filter((ch: any) => !ch.is_primary)
          .map((ch: any) => ({
            id: ch.channel_id,
            title: ch.title,
            description: ch.description,
            thumbnail: ch.thumbnail,
            subscriberCount: ch.subscriber_count?.toString() || '0',
            videoCount: ch.video_count?.toString() || '0',
            viewCount: ch.view_count?.toString() || '0',
          }))
        setAdditionalChannelsList(additional)
        console.log('[challenge] ✓ Additional channels cached:', additional.length)
      } catch (error) {
        console.error('[challenge] Failed to load from DB:', error)
      }
    }

    loadChannelData()
  }, [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('creator_challenge_plan')
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<CreatorChallengePlan>
        if (
          parsed &&
          typeof parsed.durationMonths === 'number' &&
          typeof parsed.cadenceEveryDays === 'number' &&
          typeof parsed.videosPerCadence === 'number'
        ) {
          const loadedPlan: CreatorChallengePlan = {
            durationMonths: parsed.durationMonths,
            cadenceEveryDays: parsed.cadenceEveryDays,
            videosPerCadence: parsed.videosPerCadence,
            createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : new Date().toISOString(),
          }
          setPlan(loadedPlan)
          setDurationMonths(loadedPlan.durationMonths)
          setCadenceEveryDays(loadedPlan.cadenceEveryDays)
          setVideosPerCadence(loadedPlan.videosPerCadence)
        }
      }

      const hidden = localStorage.getItem('creator_challenge_setup_hidden')
      setSetupHidden(hidden === '1')

      const started = localStorage.getItem('creator_challenge_started_at')
      setChallengeStartedAt(started)
    } catch {
      // no-op
    }

    // Fetch persisted active challenge from server and merge
    const fetchActive = async () => {
      try {
        const res = await fetch('/api/user-challenge', {
          credentials: 'include'
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Server error' }))
          console.error('Failed to fetch active challenge:', err)
          return
        }
        const json = await res.json()
        const ch = json?.challenge
        if (!ch) return

        // Apply to UI state
        if (ch.config) {
          const cfg = ch.config
          setPlan({
            durationMonths: cfg.durationMonths || durationMonths,
            cadenceEveryDays: cfg.cadenceEveryDays || cadenceEveryDays,
            videosPerCadence: cfg.videosPerCadence || videosPerCadence,
            createdAt: cfg.createdAt || new Date().toISOString(),
          })
          setDurationMonths(cfg.durationMonths || durationMonths)
          setCadenceEveryDays(cfg.cadenceEveryDays || cadenceEveryDays)
          setVideosPerCadence(cfg.videosPerCadence || videosPerCadence)
          // If a video type was persisted previously, reflect it in the UI
          if (cfg.videoType) {
            setSelectedVideoType(cfg.videoType === 'shorts' ? 'shorts' : 'long')
          }
        }
        if (ch.started_at) {
          try { localStorage.setItem('creator_challenge_started_at', ch.started_at) } catch {}
          setChallengeStartedAt(ch.started_at)
          setSetupHidden(true)
        }
        if (Array.isArray(ch.progress) && ch.progress.length) {
          const map: Record<number, ScheduledMeta> = {}
          ch.progress.forEach((p: any, i: number) => {
            map[i] = {
              title: p.title,
              notes: p.notes,
              thumbnail: p.thumbnail,
              uploaded: !!p.uploaded,
              uploadedAt: p.uploadedAt || null,
            }
          })
          setScheduledMeta(map)
        }
        if (ch.id) {
          try { localStorage.setItem('creator_challenge_id', ch.id) } catch {}
        }
      } catch (e) {
        console.error('Failed to load persisted challenge from server', e)
      }
    }

    fetchActive()
  }, [])

  // Close channel menu on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!showChannelMenu) return
      const target = e.target as Node
      if (channelMenuRef.current && !channelMenuRef.current.contains(target)) {
        setShowChannelMenu(false)
      }
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [showChannelMenu])

  const handleDisconnectAdditional = async (channelId: string) => {
    if (!confirm('Disconnect this channel?')) return
    try {
      const deleteRes = await fetch(`/api/channels?channelId=${encodeURIComponent(channelId)}`, { method: 'DELETE' })
      if (deleteRes.ok) {
        setAdditionalChannelsList((prev) => prev.filter((ch) => ch.id !== channelId))
        localStorage.removeItem(`youtube_access_token_${channelId}`)
        localStorage.removeItem(`youtube_refresh_token_${channelId}`)
      }
    } catch (error) {
      console.error('Failed to disconnect additional channel:', error)
    }
  }

  const handleDisconnectPrimary = () => {
    if (!confirm('Disconnect primary channel?')) return
    try {
      localStorage.removeItem('youtube_channel')
      localStorage.removeItem('youtube_access_token')
      localStorage.removeItem('youtube_refresh_token')
      setYoutubeChannel(null)
      setShowChannelMenu(false)
    } catch (error) {
      console.error('Failed to disconnect primary channel', error)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Fixed notification bell at top-right */}
      <div className="fixed top-4 right-4 z-50">
        <NotificationBell />
      </div>
      
      <div className="flex">
        <SharedSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activePage="challenge"
          isCollapsed={sidebarCollapsed}
          setIsCollapsed={setSidebarCollapsed}
        />

        {/* Syntax fix: close the template literal for className */}
        <main className={`flex-1 pt-16 md:pt-18 px-3 sm:px-4 md:px-6 pb-24 md:pb-12 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-72'}`}> 
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
            aria-label="Open sidebar"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="max-w-7xl mx-auto">
            {/* Error Message */}
            {insufficientPointsError && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 font-medium max-w-3xl mx-auto">
                {insufficientPointsError}
              </div>
            )}

            <div className="mb-6" />
            {showStartedBanner && (
              <div className="mb-4">
                <div className="rounded-lg p-3 bg-green-50 border border-green-100 text-green-800 text-sm font-semibold max-w-3xl mx-auto text-center">Challenge started successfully — saved to your account</div>
              </div>
            )}

            <div className="mb-6 mt-4 md:mt-10">
              {/* Channel Selector (same dashboard style) */}
              {youtubeChannel && (
                <div className="flex justify-center mb-3 px-3 relative" ref={channelMenuRef}>
                  <div className="inline-flex items-center gap-2 bg-black/70 text-white px-3 py-1 rounded-full shadow-sm max-w-full truncate">
                    <img src={youtubeChannel.thumbnail} alt={youtubeChannel.title} className="w-6 h-6 rounded-full object-cover" />
                    <span className="text-sm font-medium truncate max-w-40">{youtubeChannel.title}</span>

                    <span className="ml-2 inline-flex items-center text-xs bg-white/10 px-2 py-0.5 rounded-full">
                      <span className="font-semibold mr-1">{uniqueChannelCount}</span>
                      <span className="text-xs">{uniqueChannelCount === 1 ? 'channel' : 'channels'}</span>
                    </span>

                    <button
                      aria-haspopup="menu"
                      aria-expanded={showChannelMenu}
                      onClick={() => setShowChannelMenu((s) => !s)}
                      className="ml-2 flex items-center justify-center w-7 h-7 rounded-full bg-black/30 hover:bg-white/10 transition"
                      title="Channel actions"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {showChannelMenu && (
                    <div className="absolute top-full mt-3 left-1/2 transform -translate-x-1/2 bg-white rounded-3xl shadow-2xl w-[calc(100vw-2rem)] sm:w-full max-w-md text-gray-800 overflow-hidden z-40 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center gap-4 px-4 sm:px-6 py-4 bg-linear-to-r from-indigo-50 to-pink-50 border-b border-gray-100">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="relative">
                            <img src={youtubeChannel?.thumbnail} alt={youtubeChannel?.title} className="w-14 h-14 rounded-full object-cover shadow-lg ring-2 ring-white" />
                            <span className="absolute -right-1 -bottom-1 bg-white rounded-full p-0.5 shadow-sm">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-semibold">{uniqueChannelCount}</span>
                            </span>
                          </div>

                          <div className="flex flex-col min-w-0">
                            <div className="text-sm sm:text-base font-bold truncate" title={youtubeChannel?.title}>{youtubeChannel?.title}</div>
                            <div className="text-xs text-gray-500">Connected • <span className="font-semibold text-gray-800">{formatNumber(youtubeChannel?.videoCount || 0)} videos</span></div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDisconnectPrimary()}
                            className="inline-flex items-center gap-2 text-sm text-red-600 bg-white border border-red-200 px-3 py-1 rounded-md hover:bg-red-50 focus:outline-none font-semibold transition-colors"
                            title="Disconnect primary channel"
                          >
                            <span className="hidden sm:inline">Disconnect</span>
                          </button>
                        </div>
                      </div>

                      <div className="px-3 py-3 max-h-64 sm:max-h-72 overflow-y-auto">
                        {visibleAdditionalChannels.length > 0 ? visibleAdditionalChannels.map((ch) => (
                          <div key={ch.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition">
                            <img src={ch.thumbnail} alt={ch.title} className="w-10 h-10 rounded-full object-cover shrink-0 shadow-sm" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold truncate">{ch.title}</div>
                              <div className="text-xs text-gray-500">{formatNumber(ch.videoCount)} videos • {formatNumber(ch.subscriberCount)} subs</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  // Switch to this channel using optimized storage
                                  savePrimaryChannelToLocalStorage(ch)
                                  const token = localStorage.getItem(`youtube_access_token_${ch.id}`) || null
                                  if (token) localStorage.setItem('youtube_access_token', token)
                                  setYoutubeChannel(ch)
                                  setShowChannelMenu(false)
                                }}
                                className="text-sm text-blue-600 px-3 py-1 rounded-md bg-white border border-blue-50 hover:bg-blue-50 font-semibold"
                              >
                                Use
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDisconnectAdditional(ch.id)
                                }}
                                className="text-sm text-red-600 px-3 py-1 rounded-md bg-white border border-red-50 hover:bg-red-50 font-semibold"
                                title="Disconnect this channel"
                              >
                                Disconnect
                              </button>
                            </div>
                          </div>
                        )) : (
                          <div className="flex items-center justify-center px-6 py-10 text-sm text-gray-500 font-medium bg-gray-50 rounded-xl">No other channels connected</div>
                        )}
                      </div>

                      <div className="px-5 py-4 bg-white border-t border-gray-100">
                        <button
                          onClick={() => {
                            setShowChannelMenu(false)
                            startYouTubeAuth()
                          }}
                          className="w-full bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full py-3 px-6 flex items-center justify-center gap-3 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 font-semibold text-sm transition-all active:scale-95"
                        >
                          <Youtube className="w-4 sm:w-5 h-4 sm:h-5" />
                          Connect Another Channel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Connect CTA if no channel connected */}
              {!youtubeChannel && (
                <div className="flex justify-center mb-8 px-3">
                  <button
                    onClick={startYouTubeAuth}
                    className="inline-flex items-center gap-3 bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-full shadow-lg transition-all duration-200"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                    <span className="text-sm font-semibold">Connect Your YouTube Channel</span>
                  </button>
                </div>
              )}

              {/* Plan banner (same style) */}
              <div className="flex justify-center mb-6 px-3">
                <div className="inline-flex items-center gap-3 rounded-full bg-white/5 border border-gray-100 px-4 py-2 text-sm text-gray-700 shadow-sm max-w-full overflow-hidden" suppressHydrationWarning>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">Plan: Free</span>
                    <span className="text-gray-500 hidden sm:inline">• Limited features</span>
                  </div>
                  <Link href="/settings" className="ml-3 hidden sm:inline-flex items-center px-3 py-1 rounded-full bg-gray-50 text-gray-800 text-sm font-semibold">
                    <span>Manage plan</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Creator Challenge Header */}
            <div className="w-full mb-6 sm:mb-8">
              <div className="flex flex-col gap-3 sm:gap-4 mb-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shadow-sm bg-white border border-gray-100 shrink-0">
                      <Youtube className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-gray-900 mb-1">
                        Creator Challenge
                      </h2>
                      <p className="text-gray-600 text-sm leading-snug">Build consistent upload habits and grow your YouTube channel.</p>

                      <p className="mt-2 text-sm text-gray-500">Using short, focused uploads and a repeatable schedule improves audience retention and growth. This view gives quick tips and reminders to help you stay consistent.</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    {youtubeChannel && (
                      <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-full bg-white border border-gray-100 text-xs sm:text-sm font-semibold text-gray-700 shadow-sm">
                        <span className="text-slate-500">Using:</span>
                        <span className="ml-2 font-medium truncate">{youtubeChannel.title}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Challenge System with Tabs */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
              <TabsList className="w-full grid grid-cols-4 gap-1 sm:gap-2 p-0 bg-transparent">
                <TabsTrigger 
                  value="challenges" 
                  className="flex items-center justify-center h-10 sm:h-11 px-1 sm:px-4 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-150 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-500 data-[state=active]:shadow-lg"
                >
                  <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">My Challenges</span>
                  <span className="sm:hidden">My</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="create" 
                  className="flex items-center justify-center h-10 sm:h-11 px-1 sm:px-4 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-150 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-500 data-[state=active]:shadow-lg"
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Create</span>
                  <span className="sm:hidden">Add</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="stats" 
                  className="flex items-center justify-center h-10 sm:h-11 px-1 sm:px-4 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-150 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-500 data-[state=active]:shadow-lg"
                >
                  <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Stats</span>
                  <span className="sm:hidden">Stats</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="leaderboard" 
                  className="flex items-center justify-center h-10 sm:h-11 px-1 sm:px-4 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-150 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-500 data-[state=active]:shadow-lg"
                >
                  <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Rank</span>
                  <span className="sm:hidden">Rank</span>
                </TabsTrigger>
              </TabsList>

              {/* My Challenges Tab */}
              <TabsContent value="challenges" className="space-y-6 pt-3">
                {allChallenges.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-linear-to-br from-blue-50 to-blue-100 border border-blue-200 flex items-center justify-center sm:w-20 sm:h-20 sm:mb-6">
                      <Trophy className="w-10 h-10 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Challenges</h3>
                    <p className="text-gray-600 mb-6">Create your first challenge to start building consistency!</p>
                    <Button onClick={() => setActiveTab('create')} className="bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Challenge
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {allChallenges.map((challenge) => {
                      // Sort uploads by date (descending) to get the latest upload
                      const sortedUploads = [...(challenge.uploads || [])].sort((a, b) => {
                        const dateA = new Date(a.upload_date || a.uploadDate || '1970-01-01').getTime()
                        const dateB = new Date(b.upload_date || b.uploadDate || '1970-01-01').getTime()
                        return dateB - dateA // Descending order (latest first)
                      })
                      const latestUpload = sortedUploads[0] || null
                      
                      const startDate = new Date(challenge.startedAt)
                      const config = challenge.config || {}
                      const durationDays = config.durationDays || 30
                      const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000)
                      const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
                      const nextUploadDate = challenge.nextUploadDeadline ? new Date(challenge.nextUploadDeadline) : endDate
                      const daysUntilNext = Math.max(0, Math.ceil((nextUploadDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
                      const uploadProgress = (challenge.uploads?.length || 0) > 0 ? Math.round(((challenge.uploads?.length || 0) / Math.max(1, Math.ceil(durationDays / (challenge.cadenceEveryDays || 1)))) * 100) : 0

                      return (
                        <div key={challenge.id} className="space-y-4">
                          {/* ⭐ TODAY'S TRACKING CARD - Countdown Timer & Upload Button */}
                          <ChallengeTrackingCard
                            challengeId={challenge.id}
                            latestVideoTitle={latestUpload?.video_title || latestUpload?.videoTitle || 'No uploads yet'}
                            latestVideoDate={latestUpload ? new Date(latestUpload.upload_date || latestUpload.uploadDate || '1970-01-01').toLocaleDateString() : 'N/A'}
                            latestVideoViews={latestUpload?.video_views || latestUpload?.videoViews || 0}
                            nextUploadDate={nextUploadDate.toLocaleDateString()}
                            daysUntilNext={daysUntilNext}
                            uploadProgress={uploadProgress}
                            videosUploaded={challenge.uploads?.length || 0}
                            cadenceEveryDays={challenge.cadenceEveryDays || 1}
                            totalPoints={challenge.pointsEarned || 0}
                            missedVideos={challenge.missedDays || 0}
                            streakCount={challenge.streakCount || 0}
                            challengeTitle={challenge.challengeTitle}
                            onEdit={() => {
                              setSidePanelChallenge(challenge)
                              setSidePanelType('details')
                              setSidePanelOpen(true)
                            }}
                            onDelete={() => handleRequestDelete(challenge)}
                            onUpload={() => {
                              setSidePanelChallenge(challenge)
                              setSidePanelType('upload')
                              setSidePanelOpen(true)
                            }}
                            onViewVideos={() => {
                              setSelectedChallengeForVideos(challenge)
                              setChallengeVideos(challenge.uploads || [])
                              setVisibleVideosCount(6)
                              setShowVideosModal(true)
                            }}
                          />

                          {/* Challenge Upload Videos Grid */}
                          {challenge.uploads && challenge.uploads.length > 0 && (
                            <div className="space-y-4">
                              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <span>📹</span> All Uploads ({challenge.uploads.length})
                              </h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                                {challenge.uploads.map((video: any, idx: number) => (
                                  <div key={idx} className="group bg-gradient-to-br from-white to-gray-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-200 hover:shadow-lg hover:border-purple-200 transition-all duration-300">
                                    {/* Thumbnail */}
                                    <div className="relative w-full h-32 sm:h-40 rounded-lg overflow-hidden bg-gray-100 mb-4 shadow-sm">
                                      <img 
                                        src={video.video_thumbnail || video.videoThumbnail || `https://i.ytimg.com/vi/${video.video_id || video.videoId}/hqdefault.jpg`} 
                                        alt={video.video_title || video.videoTitle}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        onError={(e: any) => { e.target.style.display = 'none' }}
                                      />
                                    </div>
                                    
                                    {/* Video Info */}
                                    <div className="space-y-3">
                                      <p className="text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-purple-600 transition-colors">
                                        {video.video_title || video.videoTitle || 'Untitled Video'}
                                      </p>
                                      
                                      {/* Stats */}
                                      <div className="grid grid-cols-3 gap-2">
                                        <div className="bg-blue-50 rounded-lg p-2 text-center border border-blue-100">
                                          <p className="text-xs text-gray-600 font-medium">Views</p>
                                          <p className="text-sm font-bold text-blue-600">{(video.video_views || video.videoViews || 0) > 999 ? Math.round((video.video_views || video.videoViews || 0) / 1000) + 'k' : (video.video_views || video.videoViews || 0)}</p>
                                        </div>
                                        <div className="bg-pink-50 rounded-lg p-2 text-center border border-pink-100">
                                          <p className="text-xs text-gray-600 font-medium">Likes</p>
                                          <p className="text-sm font-bold text-pink-600">{(video.video_likes || video.videoLikes || 0) > 999 ? Math.round((video.video_likes || video.videoLikes || 0) / 1000) + 'k' : (video.video_likes || video.videoLikes || 0)}</p>
                                        </div>
                                        <div className="bg-green-50 rounded-lg p-2 text-center border border-green-100">
                                          <p className="text-xs text-gray-600 font-medium">Comments</p>
                                          <p className="text-sm font-bold text-green-600">{(video.video_comments || video.videoComments || 0) > 999 ? Math.round((video.video_comments || video.videoComments || 0) / 1000) + 'k' : (video.video_comments || video.videoComments || 0)}</p>
                                        </div>
                                      </div>
                                      
                                      {/* Upload Date */}
                                      <div className="flex items-center gap-2 text-xs text-gray-600 p-2 bg-gray-50 rounded-lg border border-gray-100">
                                        <Calendar className="w-4 h-4" />
                                        <span>{new Date(video.upload_date || video.uploadDate || '1970-01-01').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        
                        </div>
                      )
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Create Challenge Tab */}
              <TabsContent value="create" className="space-y-6 pt-3">
                <ChallengeCreator 
                  onCreateChallenge={handleCreateChallenge}
                  onCancel={() => setActiveTab('challenges')}
                />
              </TabsContent>

              {/* Statistics Tab */}
              <TabsContent value="stats" className="space-y-6 pt-3">
                {allChallenges.filter(c => c.status === 'active').length > 0 ? (
                  <>
                    {/* Upload Tracking Panels for Active Challenges */}
                    {allChallenges.filter(c => c.status === 'active').map((challenge) => (
                      <div key={challenge.id} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">{challenge.challengeTitle}</h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedChallengeForUpload(challenge.id)
                              setShowUploadDialog(true)
                            }}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Track Upload
                          </Button>
                        </div>
                        <UploadTrackingPanelV2 
                          challenge={challenge} 
                          onRefresh={loadAllChallenges}
                        />
                      </div>
                    ))}
                    
                    {/* User Stats Summary */}
                    {userStats && <ChallengeStats stats={userStats} />}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600">No active challenges to track!</p>
                    <p className="text-sm text-gray-500 mt-2">Create a challenge to see your upload tracking and stats.</p>
                    <Button onClick={() => setActiveTab('create')} className="mt-4 bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Challenge
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="leaderboard" className="space-y-6 pt-3">
                <LeaderboardPanel limit={50} />
              </TabsContent>
            </Tabs>

            {/* Upload Tracking Dialog */}
            <UploadVideoDialog
              isOpen={showUploadDialog}
              onClose={() => {
                setShowUploadDialog(false)
                setUploadVideoUrl('')
                setSelectedChallengeForUpload(null)
              }}
              challenge={allChallenges.find(c => c.id === selectedChallengeForUpload) as Challenge}
              onSuccess={loadAllChallenges}
            />

            {step === 'start' && false && ( /* Keep original flow hidden for fallback */
                <div className="rounded-3xl bg-white border border-gray-200 shadow-sm p-5 sm:p-8">
                  <div className="max-w-2xl mx-auto">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                          <Youtube className="w-7 h-7 sm:w-8 sm:h-8 text-red-600" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-gray-100 text-xs font-semibold text-gray-700 shadow-sm">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            New challenge plan
                          </div>
                          <h3 className="mt-3 text-xl sm:text-2xl font-extrabold text-gray-900">Build a consistent upload streak</h3>
                          <p className="mt-2 text-gray-600 text-sm sm:text-base leading-relaxed">
                            Pick a schedule, generate your full upload calendar, and track progress day by day.
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <button
                          onClick={async () => {
                            if (isPreparing) return
                            setIsPreparing(true)
                            try {
                              // small preparation delay so users see the animation
                              await new Promise((r) => setTimeout(r, 700))
                              setStep('setup')
                            } finally {
                              setIsPreparing(false)
                            }
                          }}
                          disabled={isPreparing}
                          aria-busy={isPreparing}
                          className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 ${isPreparing ? 'opacity-90 cursor-wait' : ''} bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-semibold shadow-sm transition-all duration-150`}
                        >
                          {isPreparing ? (
                            <span className="inline-flex items-center gap-2">
                              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Preparing...
                            </span>
                          ) : (
                            'Create schedule'
                          )}
                        </button>

                        <button
                          onClick={async () => {
                            if (isPreparing) return
                            setIsPreparing(true)
                            try {
                              setCustomDurationEnabled(false)
                              setSelectedDuration(6)
                              setSelectedFrequency(2)
                              setVideosPerCadence(1)
                              // small delay for consistent UX
                              await new Promise((r) => setTimeout(r, 500))
                              setStep('setup')
                            } finally {
                              setIsPreparing(false)
                            }
                          }}
                          disabled={isPreparing}
                          aria-busy={isPreparing}
                          className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-gray-200 bg-white/80 px-6 py-3 rounded-full text-gray-800 font-semibold hover:bg-white transition ${isPreparing ? 'opacity-70 cursor-wait' : ''}`}
                        >
                          {isPreparing ? (
                            <span className="inline-flex items-center gap-2 text-gray-800">
                              <span className="w-4 h-4 border-2 border-gray-800 border-t-transparent rounded-full animate-spin" />
                              Preparing...
                            </span>
                          ) : (
                            'Quick start (2 days)'
                          )}
                        </button>
                      </div>
                  </div>
                </div>
              )}

              {step === 'setup' && (
                <div className="rounded-3xl bg-white border border-gray-100 shadow-[0_30px_60px_rgba(8,15,52,0.06)] p-8">
                  <div className="max-w-2xl mx-auto">
                    <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Set up your challenge</h3>
                    <p className="text-gray-600 mb-6">Choose your challenge duration and upload frequency to create a personalized plan.</p>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">Duration</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[1,3,6,12].map((m) => (
                            <button
                              key={m}
                              onClick={() => { setSelectedDuration(m); setCustomDurationEnabled(false) }}
                              className={`w-full px-3 py-3 rounded-xl border text-sm font-semibold transition ${selectedDuration === m && !customDurationEnabled ? 'bg-blue-600 border-blue-700 text-white shadow' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                              {m}m
                            </button>
                          ))}
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            max={60}
                            value={customMonths}
                            onChange={(e) => { const v = Math.max(1, Number(e.target.value) || 1); setCustomMonths(v); setCustomDurationEnabled(true); setSelectedDuration(v) }}
                            className="w-32 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                            aria-label="Custom months"
                          />
                          <div className="text-sm text-gray-600">months</div>
                          <div className="ml-3 text-xs text-gray-500">Presets: 1m / 3m / 6m / 12m</div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">Frequency</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[1,2,3].map((d) => (
                            <button
                              key={d}
                              onClick={() => setSelectedFrequency(d)}
                              className={`w-full px-3 py-3 rounded-xl border text-sm font-semibold transition ${selectedFrequency === d ? 'bg-blue-600 border-blue-700 text-white shadow' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                              1 / {d}d
                            </button>
                          ))}
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            max={90}
                            value={selectedFrequency}
                            onChange={(e) => setSelectedFrequency(Math.max(1, Number(e.target.value) || 1))}
                            className="w-32 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                            aria-label="Days per video" />
                          <div className="text-sm text-gray-600">days</div>
                          <div className="ml-3 text-xs text-gray-500">Choose spacing: 1 video every N days</div>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-2">
                          <div className="bg-gray-50 p-3 rounded-lg text-center">
                            <div className="text-xs text-gray-500">/ day</div>
                            <div className="text-lg font-extrabold text-gray-900 mt-1">{(1/selectedFrequency).toFixed(2)}</div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg text-center">
                            <div className="text-xs text-gray-500">/ week</div>
                            <div className="text-lg font-extrabold text-gray-900 mt-1">{(1/selectedFrequency*7).toFixed(1)}</div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg text-center">
                            <div className="text-xs text-gray-500">/ month</div>
                            <div className="text-lg font-extrabold text-gray-900 mt-1">{(1/selectedFrequency*30).toFixed(1)}</div>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-gray-600">
                          <div className="font-medium">1 video every <span className="font-semibold">{selectedFrequency}</span> day(s)</div>
                          <div className="text-gray-500">Duration ≈ <span className="font-semibold">{selectedDuration} months</span> • Total ≈ <span className="font-semibold">{Math.max(1, Math.floor((selectedDuration*30)/selectedFrequency))}</span> videos</div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">Videos Per Upload Day</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[1,2,3].map((v) => (
                            <button
                              key={v}
                              onClick={() => setVideosPerCadence(v)}
                              className={`w-full px-3 py-3 rounded-xl border text-sm font-semibold transition ${videosPerCadence === v ? 'bg-blue-600 border-blue-700 text-white shadow' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                              {v} video{v > 1 ? 's' : ''}
                            </button>
                          ))}
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={videosPerCadence}
                            onChange={(e) => setVideosPerCadence(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
                            className="w-32 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                            aria-label="Videos per day" />
                          <div className="text-sm text-gray-600">video(s)</div>
                          <div className="ml-3 text-xs text-gray-500">Presets: 1 / 2 / 3</div>
                        </div>

                        <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                          <div className="text-sm text-blue-800 font-medium">
                            Total videos: <span className="font-bold">{Math.max(1, Math.floor((selectedDuration * 30) / selectedFrequency) * videosPerCadence)}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <button
                          onClick={() => setStep('start')}
                          className="w-full sm:w-auto px-6 py-3 rounded-full border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-all"
                        >
                          Back
                        </button>
                        <button
                          onClick={async () => {
                            // derive values from selected months & frequency
                            const months = Math.max(1, selectedDuration)
                            const daysBetween = Math.max(1, selectedFrequency)
                            const videosPerDay = 1

                            const nextPlan: CreatorChallengePlan = {
                              durationMonths: months,
                              cadenceEveryDays: daysBetween,
                              videosPerCadence: videosPerDay,
                              createdAt: new Date().toISOString(),
                            }
                            persistPlan(nextPlan)

                            setSelectedDuration(months)
                            setSelectedFrequency(daysBetween)
                            setVideosPerCadence(videosPerDay)

                            // Start server save and play the start animation for 3s
                            setIsStartingAnimation(true)

                            const startPromise = startChallenge()

                            setTimeout(async () => {
                              setIsStartingAnimation(false)
                              setChallengeStartDate(new Date())
                              setStep('videoType')

                              const startResult = await startPromise.catch((e) => ({ success: false, error: String(e) }))

                              if (startResult && startResult.success !== false) {
                                // saved successfully on server
                                toast({ title: 'Challenge started', description: 'Saved to your account' })
                                setShowStartedBanner(true)
                                setTimeout(() => setShowStartedBanner(false), 4000)
                              } else {
                                toast({ title: 'Failed to start challenge', description: startResult?.error || 'Server error' })
                              }
                            }, 3000)
                          }}
                          className="w-full sm:w-auto px-8 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg transition-all"
                        >
                          Start Challenge
                        </button> 
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isStartingAnimation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                  <div className="bg-white rounded-xl p-6 flex flex-col items-center gap-4">
                    <div className="w-72 h-44 overflow-hidden rounded-md">
                      <video src="/animation/calander.mp4" autoPlay muted playsInline className="w-full h-full object-cover" />
                    </div>
                    <div className="w-64 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-2 bg-blue-600 animate-[load_3s_ease-in-out]" style={{ width: '100%' }} />
                    </div>
                    <div className="text-sm text-gray-700">Preparing your schedule…</div>
                  </div>
                </div>
              )}

              {step === 'videoType' && (
                <div className="rounded-3xl bg-white border border-gray-100 shadow-[0_30px_60px_rgba(8,15,52,0.06)] p-8">
                  <div className="max-w-2xl mx-auto text-center">
                    <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Choose your video type</h3>
                    <p className="text-gray-600 mb-8">Select the primary format for your challenge videos.</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        onClick={() => handleSelectVideoType('long')}
                        aria-pressed={selectedVideoType === 'long'}
                        className={`w-full p-5 rounded-2xl border transition-transform duration-150 text-left flex items-center gap-4 ${selectedVideoType === 'long' ? 'border-indigo-200 shadow-lg scale-100' : 'border-gray-200 hover:shadow-sm'} bg-white`}
                      >
                        <div className={`flex items-center justify-center rounded-md border ${selectedVideoType === 'long' ? 'border-indigo-200 shadow-sm' : 'border-gray-100'} bg-white w-16 h-10`}> 
                          <Monitor className="w-7 h-7 text-gray-700" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <h4 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">Long Video</h4>
                            <span className="ml-auto text-xs sm:text-sm font-semibold text-gray-500">16:9</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">Standard horizontal videos — great for tutorials and long-form content.</p>
                        </div>

                        {selectedVideoType === 'long' && (
                          <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">✓</div>
                        )}
                      </button>

                      <button
                        onClick={() => handleSelectVideoType('shorts')}
                        aria-pressed={selectedVideoType === 'shorts'}
                        className={`w-full p-5 rounded-2xl border transition-transform duration-150 text-left flex items-center gap-4 ${selectedVideoType === 'shorts' ? 'border-indigo-200 shadow-lg scale-100' : 'border-gray-200 hover:shadow-sm'} bg-white relative`}
                      >
                        <div className={`flex items-center justify-center rounded-md border ${selectedVideoType === 'shorts' ? 'border-indigo-200 shadow-sm' : 'border-gray-100'} bg-white w-12 h-16`}>
                          <Smartphone className="w-6 h-6 text-gray-700" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <h4 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">Shorts</h4>
                            <span className="ml-auto text-xs sm:text-sm font-semibold text-gray-500">9:16</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">Vertical short-form videos — optimized for reach and quick engagement.</p>
                        </div>

                        {selectedVideoType === 'shorts' && (
                          <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">✓</div>
                        )}
                      </button>
                    </div>

                    {/* Show selected type summary */}
                    {selectedVideoType && (
                      <div className="mt-6 p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                        <div className="text-sm text-indigo-700 font-semibold">
                          Selected: <span className="text-indigo-900 font-bold">{selectedVideoType === 'long' ? 'Long Video (16:9)' : 'Shorts (9:16)'}</span>
                        </div>
                      </div>
                    )}

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
                      <button
                        onClick={() => setStep('setup')}
                        className="px-8 py-3 rounded-full border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-all"
                      >
                        Back
                      </button>

                      <button
                        onClick={async () => {
                          if (!selectedVideoType) {
                            toast({ title: 'Please select a video type', description: 'Choose Long Video or Shorts to continue' })
                            return
                          }
                          
                          setIsStartingAnimation(true)
                          
                          const startPromise = startChallenge()
                          
                          setTimeout(async () => {
                            setIsStartingAnimation(false)
                            setChallengeStartDate(new Date())
                            setStep('progress')
                            
                            const startResult = await startPromise.catch((e) => ({ success: false, error: String(e) }))
                            
                            if (startResult && startResult.success !== false) {
                              toast({ title: 'Challenge started', description: 'Saved to your account' })
                              setShowStartedBanner(true)
                              setTimeout(() => setShowStartedBanner(false), 4000)
                            } else {
                              toast({ title: 'Failed to start challenge', description: startResult?.error || 'Server error' })
                            }
                          }, 3000)
                        }}
                        disabled={!selectedVideoType || isStartingAnimation}
                        className={`px-8 py-3 rounded-full font-semibold transition-all ${selectedVideoType && !isStartingAnimation ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                      >
                        {isStartingAnimation ? 'Starting...' : 'Start Challenge'}
                      </button>
                    </div>

                    {/* Selection animation overlay */}
                    {animStage !== 'idle' && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-4 shadow-2xl">
                          {animStage === 'running' ? (
                            <img src="/animation/running.gif" alt="Preparing" className="w-48 h-48 object-contain" />
                          ) : (
                            <img src="/animation/loading2.gif" alt="Loading" className="w-48 h-48 object-contain" />
                          )}
                          <div className="text-gray-800 font-semibold">Preparing your challenge…</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 'progress' && selectedVideoType && challengeStartDate && (
                <div className="space-y-6">
                  {/* Loading Skeleton */}
                  {loadingChallengeData && (
                    <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-white border border-purple-100 shadow-sm p-4 sm:p-6 mb-6 animate-pulse">
                      {/* Header skeleton */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex-1">
                          <div className="h-8 bg-purple-200 rounded w-48 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-64"></div>
                        </div>
                        <div className="flex gap-2">
                          <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                          <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                        </div>
                      </div>

                      {/* Latest Upload skeleton */}
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 mb-4">
                        <div className="h-3 bg-emerald-200 rounded w-32 mb-3"></div>
                        <div className="h-5 bg-gray-300 rounded w-48 mb-3"></div>
                        <div className="flex gap-4">
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                        </div>
                      </div>

                      {/* Next Upload skeleton */}
                      <div className="rounded-xl border border-cyan-100 bg-cyan-50 p-4 mb-4">
                        <div className="h-3 bg-cyan-200 rounded w-24 mb-2"></div>
                        <div className="h-6 bg-gray-300 rounded w-40"></div>
                      </div>

                      {/* Progress skeleton */}
                      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 mb-4">
                        <div className="flex justify-between mb-3">
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                        </div>
                        <div className="w-full h-2 bg-gray-300 rounded-full mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-48"></div>
                      </div>

                      {/* Stats skeleton */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <div key={i} className="rounded-lg bg-gray-50 border border-gray-100 p-4 text-center space-y-2">
                            <div className="h-8 bg-gray-200 rounded w-16 mx-auto"></div>
                            <div className="h-3 bg-gray-200 rounded w-20 mx-auto"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Challenge Configuration Summary */}
                </div>
              )}
            </div>
        </main>
      </div>

    {/* Challenge Videos Detail Modal */}
    <ChallengeVideosDetailModal
      isOpen={showVideosModal}
      onClose={() => setShowVideosModal(false)}
      challenge={selectedChallengeForVideos}
      videos={challengeVideos}
    />

    {/* Confirm Delete Dialog */}
    <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete challenge?</DialogTitle>
          <DialogDescription>Deleting this challenge will remove all uploads and progress. This action cannot be undone.</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => { setDeleteConfirmOpen(false); setChallengeToDelete(null) }}>Cancel</Button>
          <Button onClick={() => handleDeleteChallenge(challengeToDelete?.id)} className="bg-red-600 text-white" disabled={!!deletingChallengeId}>
            {deletingChallengeId ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Challenge Videos Modal */}
     <ChallengeVideosModal
        isOpen={showChallengeModal}
        onClose={() => setShowChallengeModal(false)}
        videoSchedule={challengeVideoSchedule}
        totalVideos={challengeData?.config?.videosPerCadence ? 
          Math.ceil((challengeData.config.durationMonths || 6) * 30 / (challengeData.config.cadenceEveryDays || 2)) * (challengeData.config.videosPerCadence || 1)
          : 0}
        uploadedCount={challengeVideoSchedule.filter((v: any) => v.uploaded).length}
        nextUploadDate={challengeVideoSchedule.find((v: any) => !v.uploaded)?.date}
        challengeStartDate={challengeData?.started_at}
        challengeEndDate={challengeData?.started_at ? 
          new Date(new Date(challengeData.started_at).getTime() + (challengeData.config?.durationMonths || 6) * 30 * 24 * 60 * 60 * 1000).toISOString()
          : undefined}
      />

      {/* Side Content Panel */}
      <SideContentPanel 
        challenge={sidePanelChallenge}
        isOpen={sidePanelOpen}
        type={sidePanelType}
        onClose={() => setSidePanelOpen(false)}
      />
    </div>
  )
}
