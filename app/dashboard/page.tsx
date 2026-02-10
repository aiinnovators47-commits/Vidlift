"use client"

import React from 'react'
import Link from "next/link"
import { Button } from '@/components/ui/button'
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import SharedSidebar from "@/components/shared-sidebar"
import Image from "next/image"
import { TagBox } from "@/components/tag-box"
import ChallengeVideosModal from '@/components/challenge-videos-modal'
import ChallengeRoadmapCard from '@/components/challenge-roadmap-card'
import ChallengeVideosDetailModal from '@/components/challenge-videos-detail-modal'
import { AchievementDisplay } from '@/components/achievement-display'
import AddMissingTagsCard from '@/components/add-missing-tags-card'
import AddMissingDescriptionsCard from '@/components/add-missing-descriptions-card'
import ConnectedVideosStrip from '@/components/connected-videos-strip'
import { Trophy, TrendingUp, Flame, Target, Calendar, CheckCircle, Play, Loader2, Youtube, Sparkles, ChevronRight, Users, Eye, Film, BarChart3, Clock, ThumbsUp, MessageSquare, Share, Download, Upload, Settings, Search, Bell, Star, Heart, Zap, Activity, Award, TrendingDown, AlertTriangle, Check, X, Plus, Minus, ExternalLink, ArrowUpRight, ArrowDownRight, Filter, Grid, List } from 'lucide-react'
import dynamic from 'next/dynamic'
import { savePrimaryChannelToLocalStorage, saveAllChannelsToLocalStorage, getPrimaryChannelFromLocalStorage, getChannelWithCache } from '@/lib/channelStorage'
import { useApiOptimization } from '@/hooks/usePerformanceOptimization'
import { withPerformance } from '@/lib/performance'
const NotificationBell = dynamic(() => import('@/components/notification-bell'), { ssr: false })

interface VidIQChannelStats {
  subscribers: number;
  totalViews: number;
  totalVideos: number;
  avgViews: number;
  avgWatchTime: number;
  engagementRate: number;
  subscriberGrowth: number;
  videoGrowth: number;
  revenueEstimate: number;
  subscriberChange: number;
  viewChange: number;
  videoChange: number;
  ctr: number;
}

interface YouTubeChannel {
  id: string
  title: string
  description: string
  customUrl?: string
  thumbnail: string
  subscriberCount: string
  videoCount: string
  viewCount: string
  publishedAt: string
}

interface LatestVideo {
  id: string
  title: string
  thumbnail: string
  publishedAt: string
  viewCount: number
  titleScore?: number
}

// Define a compatible type for videos with missing content that includes all required fields
interface VideoWithMissingContent extends LatestVideo {
  hasTags?: boolean;
  hasDescription?: boolean;
  tags?: string[];
  description?: string;
  suggestedTags?: string[];
  suggestedDescription?: string;
}

interface VideoStats {
  views: number;
  likes: number;
  comments: number;
  engagementRate: number;
  estimatedRevenue: number;
  watchTime: number;
  impressions: number;
  ctr: number;
}

interface VidIQVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  stats: VideoStats;
  tags: string[];
  duration: string;
  status: 'published' | 'scheduled' | 'draft';
  category: string;
  thumbnailScore: number;
  titleScore: number;
  descriptionScore: number;
}



interface VidIQChallenge {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  goal: number;
  progress: number;
  status: 'active' | 'completed' | 'paused';
  videos: VidIQVideo[];
  points: number;
  streak: number;
  nextDeadline: string;
}

export default function DashboardPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const firstName = session?.user?.name ? session.user.name.split(' ')[0] : 'Deepak'
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [youtubeChannel, setYoutubeChannel] = useState<YouTubeChannel | null>(null)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  
  // Dashboard states
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Scroll animation states
  // Performance optimization hooks
  const { fetchWithCache } = useApiOptimization()
  const channelRef = useRef<YouTubeChannel | null>(null)
  
  // Scroll animation states
  const [animatedStats, setAnimatedStats] = useState({
    subscribers: 0,
    totalViews: 0,
    totalVideos: 0,
    revenueEstimate: 0
  });
  
  // Memoized expensive calculations
  const memoizedAnalyticsData = useMemo(() => ({
    views: 0,
    subscribers: 0,
    videos: 0
  }), [])
  
  // Optimized data loading function
  const loadChannelData = useCallback(withPerformance(async () => {
    try {
      const channel: any = await getChannelWithCache()
      if (channel) {
        setYoutubeChannel(channel as YouTubeChannel)
        channelRef.current = channel as YouTubeChannel
      }
    } catch (error) {
      console.error('Failed to load channel data:', error)
    }
  }, 'loadChannelData'), [])
  
  // Optimized API calls with caching
  const fetchDashboardStats = useCallback(withPerformance(async () => {
    if (!youtubeChannel?.id) return
    
    try {
      // Use cached API calls for better performance
      const [analyticsRes, videosRes] = await Promise.all([
        fetchWithCache(`/api/youtube/analytics/summary?channelId=${youtubeChannel.id}`, {}, 300000),
        fetchWithCache(`/api/youtube/videos?channelId=${youtubeChannel.id}&maxResults=5`, {}, 300000)
      ])
      
      // Process results...
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    }
  }, 'fetchDashboardStats'), [youtubeChannel?.id, fetchWithCache])
  
  // Optimized formatting function
  const optimizedFormatNumber = useCallback((num: string | number): string => {
    const n = typeof num === 'string' ? parseInt(num) : num
    if (isNaN(n)) return '0'
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return n.toString()
  }, [])
  const [latestVideo, setLatestVideo] = useState<LatestVideo | null>(null)
  const [topVideos, setTopVideos] = useState<LatestVideo[]>([])
  const [loadingVideo, setLoadingVideo] = useState(false)
  const [suggestedTags, setSuggestedTags] = useState<Array<{tag: string, score: number, color: string, viralScore?: number, confidence?: string}>>([])
  const [showAllTags, setShowAllTags] = useState(false)
  const [cardExpanded, setCardExpanded] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishSuccess, setPublishSuccess] = useState(false)
  const [newTagInput, setNewTagInput] = useState('')
  const [showInitialLoader, setShowInitialLoader] = useState(false) // Disabled - no loading modal needed
  const [dashboardLoaderDuration, setDashboardLoaderDuration] = useState(0)
  
  // Channel connection step states (similar to challenge flow)
  const [connectionStep, setConnectionStep] = useState<'start' | 'select' | 'authorize' | 'complete'>('start')
  const [isConnectingChannel, setIsConnectingChannel] = useState(false)
  const [selectedChannelForConnection, setSelectedChannelForConnection] = useState<YouTubeChannel | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  // Input suggestion states
  const [inputSuggestions, setInputSuggestions] = useState<Array<{tag: string, score?: number}>>([])
  const [suggestionLoading, setSuggestionLoading] = useState(false)
  const [showInputSuggestions, setShowInputSuggestions] = useState(false)
  const suggestionTimerRef = useRef<number | null>(null)
  const addTagInputRef = useRef<HTMLInputElement | null>(null)
  const [publishError, setPublishError] = useState('')
  // Define a compatible type for videos with missing content that includes all required fields
  interface VideoWithMissingContent extends LatestVideo {
    hasTags?: boolean;
    hasDescription?: boolean;
    tags?: string[];
    description?: string;
    suggestedTags?: string[];
    suggestedDescription?: string;
  }
  
  const [videosWithoutTags, setVideosWithoutTags] = useState<VideoWithMissingContent[]>([])
  const [videosWithoutDescriptions, setVideosWithoutDescriptions] = useState<VideoWithMissingContent[]>([])
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)

  // Challenge states
  const [challengeData, setChallengeData] = useState<any>(null)
  const [loadingChallenge, setLoadingChallenge] = useState(false)
  const [showChallengeModal, setShowChallengeModal] = useState(false)
  const [challengeVideoSchedule, setChallengeVideoSchedule] = useState<any[]>([])
  const [showVideosModal, setShowVideosModal] = useState(false)
  const [selectedChallengeForVideos, setSelectedChallengeForVideos] = useState<any>(null)
  const [challengeVideos, setChallengeVideos] = useState<any[]>([])
  const [isRefreshingStats, setIsRefreshingStats] = useState(false)
  const [lastStatsUpdate, setLastStatsUpdate] = useState<Date | null>(null)

  // Channel menu state
  const [showChannelMenu, setShowChannelMenu] = useState(false)
  const channelMenuRef = useRef<HTMLDivElement | null>(null)

  // Additional channels (for switching)
  const [additionalChannelsList, setAdditionalChannelsList] = useState<YouTubeChannel[]>([])
  
  // Track which channels have already loaded analytics data (to prevent reloading on tab changes)
  const analyticsLoadedRef = useRef<Set<string>>(new Set())

  // Derived values for UI
  const visibleAdditionalChannels = additionalChannelsList.filter(ch => ch && ch.id && ch.id !== youtubeChannel?.id)
  const uniqueChannelCount = React.useMemo(() => {
    const map: Record<string, boolean> = {}
    if (youtubeChannel?.id) map[youtubeChannel.id] = true
    for (const ch of (additionalChannelsList || [])) {
      if (ch && ch.id) { map[String(ch.id)] = true }
    }
    return Object.keys(map).length
  }, [youtubeChannel, additionalChannelsList])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('additional_youtube_channels')
      if (stored) {
        const parsed = JSON.parse(stored) || []
        // Deduplicate by id defensively
        const map = new Map<string, YouTubeChannel>()
        parsed.forEach((ch: YouTubeChannel) => { if (ch && ch.id) map.set(ch.id, ch) })
        setAdditionalChannelsList(Array.from(map.values()))
      }
    } catch (e) {
      console.error('Failed to load additional channels:', e)
    }

    // Listen for storage changes (other tabs) to update channel lists live
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'additional_youtube_channels') {
        try {
          const val = e.newValue ? JSON.parse(e.newValue) : []
          setAdditionalChannelsList(val)
        } catch (err) { console.error('Failed parsing additional channels from storage event', err) }
      }
      if (e.key === 'youtube_channel') {
        try {
          const val = e.newValue ? JSON.parse(e.newValue) : null
          setYoutubeChannel(val)
        } catch (err) { console.error('Failed parsing youtube_channel from storage event', err) }
      }
    }

    window.addEventListener('storage', onStorage);
    
    // Load mock data for VidIQ-style dashboard
    const loadMockData = () => {
      // Mock channel stats
      const mockStats: VidIQChannelStats = {
        subscribers: 12543,
        totalViews: 1250000,
        totalVideos: 128,
        avgViews: 9765,
        avgWatchTime: 4.5,
        engagementRate: 4.2,
        subscriberGrowth: 12.5,
        videoGrowth: 8.2,
        revenueEstimate: 3450,
        subscriberChange: 1380,
        viewChange: 115000,
        videoChange: 10,
        ctr: 4.7
      };

      
      // Animate stats
      setTimeout(() => {
        setAnimatedStats({
          subscribers: 12543,
          totalViews: 1250000,
          totalVideos: 128,
          revenueEstimate: 3450
        });
      }, 300);
      
      // Mock videos
      const mockVideos: VidIQVideo[] = [
        {
          id: '1',
          title: 'How to Grow Your YouTube Channel Fast in 2024',
          thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
          publishedAt: '2024-01-15',
          stats: {
            views: 45230,
            likes: 2100,
            comments: 180,
            engagementRate: 5.1,
            estimatedRevenue: 120.50,
            watchTime: 8.2,
            impressions: 120000,
            ctr: 3.76
          },
          tags: ['youtube', 'growth', 'tips', '2024'],
          duration: '12:34',
          status: 'published',
          category: 'Education',
          thumbnailScore: 87,
          titleScore: 92,
          descriptionScore: 78
        },
        {
          id: '2',
          title: 'Top 10 YouTube Shorts Ideas That Will Go Viral',
          thumbnail: 'https://i.ytimg.com/vi/J---aiyznGQ/maxresdefault.jpg',
          publishedAt: '2024-01-10',
          stats: {
            views: 87650,
            likes: 4300,
            comments: 320,
            engagementRate: 5.4,
            estimatedRevenue: 210.75,
            watchTime: 6.8,
            impressions: 250000,
            ctr: 4.2
          },
          tags: ['shorts', 'viral', 'ideas', 'tiktok'],
          duration: '0:59',
          status: 'published',
          category: 'Entertainment',
          thumbnailScore: 94,
          titleScore: 89,
          descriptionScore: 85
        },
        {
          id: '3',
          title: 'Complete Guide to YouTube SEO in 2024',
          thumbnail: 'https://i.ytimg.com/vi/9bZkp7q19f0/maxresdefault.jpg',
          publishedAt: '2024-01-05',
          stats: {
            views: 32100,
            likes: 1800,
            comments: 150,
            engagementRate: 4.8,
            estimatedRevenue: 87.25,
            watchTime: 10.5,
            impressions: 89000,
            ctr: 3.6
          },
          tags: ['seo', 'optimization', 'keywords', 'strategy'],
          duration: '18:42',
          status: 'published',
          category: 'Education',
          thumbnailScore: 79,
          titleScore: 85,
          descriptionScore: 91
        }
      ];

      
      // Mock challenges
      const mockChallenges: VidIQChallenge[] = [
        {
          id: '1',
          title: '60 Days, 60 Videos Challenge',
          description: 'Upload a video every day for 60 days straight',
          startDate: '2024-01-01',
          endDate: '2024-03-01',
          goal: 60,
          progress: 75,
          status: 'active',
          videos: [],
          points: 420,
          streak: 15,
          nextDeadline: '2024-01-16'
        },
        {
          id: '2',
          title: 'YouTube Shorts Challenge',
          description: 'Upload 30 Shorts in 30 days',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          goal: 30,
          progress: 60,
          status: 'active',
          videos: [],
          points: 280,
          streak: 8,
          nextDeadline: '2024-01-16'
        }
      ];

      
      setIsLoading(false);
    };
    
    loadMockData();

    // Return cleanup
    return () => {
      window.removeEventListener('storage', onStorage)
      if (suggestionTimerRef.current) {
        window.clearTimeout(suggestionTimerRef.current)
        suggestionTimerRef.current = null
      }
    }
  }, [])

  // Load YouTube channel data from database - FAST strategy (localStorage first)
  useEffect(() => {
    const loadChannelData = async () => {
      try {
        // Strategy 1: Try localStorage first (instant, <1ms) ⚡
        let channel = getPrimaryChannelFromLocalStorage()
        
        if (channel) {
          console.log('[dashboard] ⚡ Channel from localStorage (instant):', channel.title)
          setYoutubeChannel(channel as YouTubeChannel)
          
          // Load additional channels from localStorage too
          const stored = localStorage.getItem('additional_youtube_channels')
          if (stored) {
            try {
              const additional = JSON.parse(stored)
              setAdditionalChannelsList(additional)
            } catch (e) {
              console.warn('Failed to parse additional channels from localStorage')
            }
          }
          
          // In background, refresh from DB if needed
          loadChannelDataFromDB()
          return
        }

        // Strategy 2: If not in localStorage, fetch from DB
        console.log('[dashboard] 📡 Loading channel from database...')
        await loadChannelDataFromDB()
        
      } catch (err) {
        console.error('[dashboard] Error loading channel:', err)
      }
    }

    const loadChannelDataFromDB = async () => {
      try {
        const res = await fetch('/api/channels')
        if (res.ok) {
          const data = await res.json()
          if (data?.channels && Array.isArray(data.channels)) {
            // Save all channels to localStorage for instant future access
            saveAllChannelsToLocalStorage(data.channels)
            
            const primary = data.channels.find((ch: any) => ch.is_primary)
            if (primary) {
              const main = {
                id: primary.channel_id,
                title: primary.title,
                description: primary.description,
                thumbnail: primary.thumbnail,
                subscriberCount: primary.subscriber_count?.toString() || '0',
                videoCount: primary.video_count?.toString() || '0',
                viewCount: primary.view_count?.toString() || '0',
              }
              setYoutubeChannel(main as YouTubeChannel)
              console.log('[dashboard] ✓ Primary channel loaded and cached:', main.title)
            }

            // Load additional channels
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
            console.log('[dashboard] ✓ Additional channels cached:', additional.length)
          }
        } else {
          console.warn('[dashboard] Failed to fetch channels from DB:', res.status)
        }
      } catch (err) {
        console.error('[dashboard] Error loading from DB:', err)
      }
    }

    loadChannelData()
  }, [session])

  // Fetch active challenge data
  useEffect(() => {
    const fetchChallengeData = async () => {
      try {
        setLoadingChallenge(true)
        // Use the proper challenges API with uploads included
        const res = await fetch('/api/challenges?status=active&includeUploads=true')
        if (res.ok) {
          const data = await res.json()
          // Get the first active challenge
          if (data?.challenges && data.challenges.length > 0) {
            const activeChallenge = data.challenges[0]
            setChallengeData(activeChallenge)
            // Extract progress array as video schedule (ensure it's an array)
            const progress = Array.isArray(activeChallenge.progress) ? activeChallenge.progress : []
            setChallengeVideoSchedule(progress)
            console.log('Loaded challenge data:', activeChallenge)
            
            // 🔄 IMMEDIATELY SYNC UPLOADS - Don't wait for hourly cron!
            try {
              console.log('📱 Triggering immediate upload sync...')
              const syncRes = await fetch('/api/challenges/sync-uploads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ challengeId: activeChallenge.id })
              })
              
              if (syncRes.ok) {
                const syncData = await syncRes.json()
                if (syncData.syncedCount > 0) {
                  console.log(`✅ INSTANT SYNC: Found & saved ${syncData.syncedCount} video(s)!`)
                  // Refresh challenge data to show updated uploads
                  const refreshRes = await fetch('/api/challenges?status=active&includeUploads=true')
                  if (refreshRes.ok) {
                    const refreshData = await refreshRes.json()
                    if (refreshData?.challenges?.length > 0) {
                      setChallengeData(refreshData.challenges[0])
                      console.log('✅ Challenge data refreshed with new uploads')
                    }
                  }
                } else {
                  console.log('📊 Sync complete: No new uploads found')
                }
              } else {
                console.warn('Sync request failed, but challenge data loaded')
              }
            } catch (syncError) {
              console.warn('Immediate sync failed (non-blocking):', syncError)
              // Don't block - user can manually sync if needed
            }
          } else {
            setChallengeData(null)
            setChallengeVideoSchedule([])
          }
        } else {
          console.warn('Failed to fetch challenge:', res.status)
          setChallengeData(null)
        }
      } catch (error) {
        console.error('Error fetching challenge:', error)
        setChallengeData(null)
      } finally {
        setLoadingChallenge(false)
      }
    }

    fetchChallengeData()
  }, [])

  // Auto-refresh challenge upload stats every 1 minute
  useEffect(() => {
    const refreshStats = async () => {
      if (!challengeData?.uploads || challengeData.uploads.length === 0) return

      const videoIds = challengeData.uploads
        .map((v: any) => v.video_id || v.videoId)
        .filter((id: string) => id)

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
            // Update challengeData with new stats
            setChallengeData((prev: any) => {
              if (!prev || !prev.uploads) return prev
              
              const updatedUploads = prev.uploads.map((video: any) => {
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

              return { ...prev, uploads: updatedUploads }
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
  }, [challengeData?.uploads?.length])

  // Disconnect a specific additional channel (keeps primary intact)
  const handleDisconnectAdditional = async (channelId: string) => {
    if (!confirm('Disconnect this channel?')) return
    try {
      // Delete from database
      const deleteRes = await fetch(`/api/channels?channelId=${encodeURIComponent(channelId)}`, { method: 'DELETE' })
      if (deleteRes.ok) {
        // Update local state by removing the channel
        setAdditionalChannelsList(prev => prev.filter(ch => ch.id !== channelId))
        // remove any stored tokens for this channel
        localStorage.removeItem(`youtube_access_token_${channelId}`)
        localStorage.removeItem(`youtube_refresh_token_${channelId}`)
        console.log('Successfully disconnected additional channel:', channelId)
      } else {
        console.error('Failed to delete channel from database')
      }
    } catch (dbErr) {
      console.warn('Failed to delete channel from DB:', dbErr)
    }

    // If the removed channel was currently set as youtube_channel, clear it
    try {
      const primary = localStorage.getItem('youtube_channel')
      if (primary) {
        const primaryObj = JSON.parse(primary)
        if (primaryObj?.id === channelId) {
          localStorage.removeItem('youtube_channel')
          localStorage.removeItem('youtube_access_token')
          localStorage.removeItem('youtube_refresh_token')
          setYoutubeChannel(null)
        }
      }
    } catch (err) {
      console.error('Failed to disconnect channel', err)
    }
  }

  // Disconnect primary channel (clears primary and tokens)
  const handleDisconnectPrimary = () => {
    if (!confirm('Disconnect primary channel?')) return
    try {
      localStorage.removeItem('youtube_channel')
      localStorage.removeItem('youtube_access_token')
      localStorage.removeItem('youtube_refresh_token')
      setYoutubeChannel(null)
      setShowChannelMenu(false)
    } catch (err) {
      console.error('Failed to disconnect primary channel', err)
    }
  }

  // Fetch latest and top videos when channel is loaded (only once per channel)
  useEffect(() => {
    const fetchLatestVideo = async () => {
      if (!youtubeChannel) return
      
      // Skip if we've already loaded videos for this channel
      if (analyticsLoadedRef.current.has(youtubeChannel.id)) {
        console.log('[dashboard] ✓ Videos already loaded for channel:', youtubeChannel.id)
        return
      }
      
      setLoadingVideo(true)
      try {
        // Fetch videos with missing content using new API
        const [videosResponse, tagsResponse, descResponse] = await Promise.all([
          fetch(`/api/youtube/best-videos?channelId=${youtubeChannel.id}`, {
            method: 'GET',
            headers: { 'Cache-Control': 'max-age=300' }
          }),
          fetch(`/api/youtube/videos-missing-content?channelId=${youtubeChannel.id}&type=tags&maxResults=5`, {
            method: 'GET',
            headers: { 'Cache-Control': 'max-age=300' }
          }),
          fetch(`/api/youtube/videos-missing-content?channelId=${youtubeChannel.id}&type=descriptions&maxResults=5`, {
            method: 'GET',
            headers: { 'Cache-Control': 'max-age=300' }
          })
        ])

        if (!videosResponse.ok) {
          const err = await videosResponse.json().catch(() => ({}))
          console.error('Failed to fetch videos:', err)
          setLoadingVideo(false)
          setLatestVideo(null)
          setVideosWithoutTags([])
          setVideosWithoutDescriptions([])
          return
        }

        const [videosData, tagsData, descData] = await Promise.all([
          videosResponse.json(),
          tagsResponse.json(),
          descResponse.json()
        ])
        
        console.log('Fetched videos data:', videosData)
        console.log('Fetched tags data:', tagsData)
        console.log('Fetched descriptions data:', descData)
        
        // Check if we have videos in the response
        if (videosData.videos && Array.isArray(videosData.videos) && videosData.videos.length > 0) {
          // set latest video to the first item
          const video = videosData.videos[0]
          setLatestVideo({
            id: video.id || '',
            title: video.title || 'Untitled Video',
            thumbnail: video.thumbnail || '',
            publishedAt: video.publishedAt || new Date().toISOString(),
            viewCount: video.viewCount || 0,
            titleScore: video.titleScore || 67
          })
          // Pre-generate tags locally for quick publish (hidden UI)
          try { generateTagsLocally(video.title || '') } catch {}

          // Filter videos that don't have tags yet
          const videosNoTags = tagsData.videos || []
          const videosNoDesc = descData.videos || []
                    
          // Enhance videos with AI-generated suggestions
          const enhancedVideosNoTags = await Promise.all(
            videosNoTags.map(async (video: any) => {
              try {
                const response = await fetch('/api/gemini/suggest-tags', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    title: video.title,
                    description: video.description || '',
                    videoId: video.id
                  })
                });
                
                if (response.ok) {
                  const data = await response.json();
                  return {
                    id: video.id || '',
                    title: video.title || 'Untitled Video',
                    thumbnail: video.thumbnail || '',
                    publishedAt: video.publishedAt || new Date().toISOString(),
                    viewCount: video.viewCount || 0,
                    hasTags: Array.isArray(video.tags) && video.tags.length > 0,
                    hasDescription: Boolean(video.description && video.description.trim().length > 0),
                    tags: video.tags || [],
                    description: video.description || '',
                    suggestedTags: data.tags || []
                  };
                }
              } catch (error) {
                console.error('Error fetching suggested tags:', error);
              }
              
              return {
                id: video.id || '',
                title: video.title || 'Untitled Video',
                thumbnail: video.thumbnail || '',
                publishedAt: video.publishedAt || new Date().toISOString(),
                viewCount: video.viewCount || 0,
                hasTags: Array.isArray(video.tags) && video.tags.length > 0,
                hasDescription: Boolean(video.description && video.description.trim().length > 0),
                tags: video.tags || [],
                description: video.description || '',
                suggestedTags: []
              };
            })
          );
          
          const enhancedVideosNoDesc = await Promise.all(
            videosNoDesc.map(async (video: any) => {
              try {
                const response = await fetch('/api/gemini/suggest-description', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    title: video.title,
                    tags: video.tags || [],
                    videoId: video.id
                  })
                });
                
                if (response.ok) {
                  const data = await response.json();
                  return {
                    id: video.id || '',
                    title: video.title || 'Untitled Video',
                    thumbnail: video.thumbnail || '',
                    publishedAt: video.publishedAt || new Date().toISOString(),
                    viewCount: video.viewCount || 0,
                    hasTags: Array.isArray(video.tags) && video.tags.length > 0,
                    hasDescription: Boolean(video.description && video.description.trim().length > 0),
                    tags: video.tags || [],
                    description: video.description || '',
                    suggestedDescription: data.description || ''
                  };
                }
              } catch (error) {
                console.error('Error fetching suggested description:', error);
              }
              
              return {
                id: video.id || '',
                title: video.title || 'Untitled Video',
                thumbnail: video.thumbnail || '',
                publishedAt: video.publishedAt || new Date().toISOString(),
                viewCount: video.viewCount || 0,
                hasTags: Array.isArray(video.tags) && video.tags.length > 0,
                hasDescription: Boolean(video.description && video.description.trim().length > 0),
                tags: video.tags || [],
                description: video.description || '',
                suggestedDescription: ''
              };
            })
          );

          setVideosWithoutTags(enhancedVideosNoTags)
          setVideosWithoutDescriptions(enhancedVideosNoDesc)
          setCurrentVideoIndex(0)
          
          // compute top 3 videos by viewCount
          const sorted = videosData.videos
            .slice()
            .sort((a: any, b: any) => (parseInt(b.viewCount || 0, 10) || 0) - (parseInt(a.viewCount || 0, 10) || 0))
          const top3 = sorted.slice(0, 3).map((v: any) => ({
            id: v.id || '',
            title: v.title || 'Untitled',
            thumbnail: v.thumbnail || '',
            publishedAt: v.publishedAt || new Date().toISOString(),
            viewCount: v.viewCount || 0,
            titleScore: v.titleScore || 0
          }))

          setTopVideos(top3)
        } else {
          console.log('No videos found for this channel')
          setLatestVideo(null)
          setTopVideos([])
        }
      } catch (error) {
        console.error('Error fetching latest video:', error)
        // Set null instead of keeping loading state
        setLatestVideo(null)
        setTopVideos([])
      } finally {
        setLoadingVideo(false)
        // Mark this channel as having loaded videos
        analyticsLoadedRef.current.add(youtubeChannel.id)
      }
    }

    fetchLatestVideo()
  }, [youtubeChannel?.id]) // Use channel ID instead of full object to prevent unnecessary re-renders

  // Local tag generator from video title - generates tags without API calls (saves quota)
  const generateTagsLocally = (title: string) => {
    if (!title) {
      setSuggestedTags([])
      return
    }

    // Normalize title and extract candidate tags (1-3 word phrases)
    const commonWords = new Set([
      'the','a','an','and','or','but','in','on','at','to','for','of','with','is','are','am','be','been','being',
      'have','has','had','do','does','did','will','would','could','should','can','may','might','must','this','that',
      'these','those','video','shorts','how','what','why','when','where','who'
    ])

    const cleaned = title
      .toLowerCase()
      .replace(/[#@]/g, '')
      .replace(/["'“”‘’()\[\]:;!?.,/\\]/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    const words = cleaned.split(' ').filter(Boolean)
    const candidates: string[] = []

    // Single words
    for (let i = 0; i < words.length; i++) {
      const w = words[i]
      if (w.length > 2 && !commonWords.has(w)) candidates.push(w)
    }

    // 2-word phrases
    for (let i = 0; i + 2 <= words.length; i++) {
      const seq = words.slice(i, i + 2).filter(w => !commonWords.has(w)).join(' ')
      if (seq.split(' ').length === 2) candidates.push(seq)
    }

    // 3-word phrases
    for (let i = 0; i + 3 <= words.length; i++) {
      const seq = words.slice(i, i + 3).filter(w => !commonWords.has(w)).join(' ')
      if (seq.split(' ').length >= 2) candidates.push(seq)
    }

    // Unique + score + color
    const seen = new Set<string>()
    const colors = ['emerald','orange','blue','amber','purple','rose','cyan','indigo']
    const final: any[] = []

    for (const t of candidates) {
      const tag = t.trim()
      if (!tag || seen.has(tag)) continue
      seen.add(tag)

      const wordCount = tag.split(' ').length
      const baseScore = wordCount === 1 ? 65 : wordCount === 2 ? 55 : 45
      const randomBonus = Math.floor(Math.random() * 25)

      final.push({
        tag,
        score: baseScore + randomBonus,
        color: colors[final.length % colors.length]
      })

      if (final.length >= 20) break
    }

    setSuggestedTags(final)
  }

  // Local lightweight fallback generator (kept for offline cases) — simpler than old generator
  const generateTagsFallback = (title: string) => {
    if (!title) return []
    const commonWords = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','is','are','am','be','been','being','have','has','had','do','does','did','will','would','could','should','can','may','might','must','this','that','these','those','video','shorts'])
    const cleaned = title.toLowerCase().replace(/[#@]/g, '').replace(/["'“”‘’()\[\]:;!?.,/\\]/g, '').replace(/\s+/g, ' ').trim()
    const words = cleaned.split(' ').filter(Boolean)
    const ngrams: string[] = []
    for (let i = 0; i < words.length; i++) {
      const w = words[i]
      if (w.length > 1 && !commonWords.has(w)) ngrams.push(w)
    }
    for (let n = 2; n <= 2; n++) {
      for (let i = 0; i + n <= words.length; i++) {
        const seq = words.slice(i, i + n).filter(w => !commonWords.has(w)).join(' ')
        if (seq) ngrams.push(seq)
      }
    }
    // Unique and color map
    const seen = new Set<string>()
    const final: any[] = []
    const colors = ['emerald','orange','blue','amber','purple','rose','cyan','indigo']
    for (const t of ngrams) {
      const tag = t.trim()
      if (!tag) continue
      if (seen.has(tag)) continue
      seen.add(tag)
      final.push({ tag, score: 40 + Math.floor(Math.random() * 40), color: colors[final.length % colors.length] })
      if (final.length >= 12) break
    }
    return final
  }

  // Fetch suggestions for the Add Tag input (debounced)
  const fetchInputSuggestions = async (query: string) => {
    if (!query || query.trim().length < 2) {
      setInputSuggestions([])
      setShowInputSuggestions(false)
      return
    }

    setSuggestionLoading(true)
    try {
      const res = await fetch(`/api/youtube/tag-suggest?title=${encodeURIComponent(query)}&maxResults=10&minScore=20`)
      if (!res.ok) throw new Error('Failed to fetch tag suggestions')
      const data = await res.json()
      const tags = (data.tags || []).slice(0, 10)
      // Sort to prefer single-word tags and higher viralScore
      tags.sort((a: any, b: any) => {
        const aw = (a.tag || '').split(' ').length
        const bw = (b.tag || '').split(' ').length
        if (aw !== bw) return aw - bw
        return (b.viralScore || 0) - (a.viralScore || 0)
      })
      setInputSuggestions(tags.map((t: any) => ({ tag: t.tag, score: t.score })))
      setShowInputSuggestions(true)
    } catch (err) {
      console.error('Input suggestion fetch failed:', err)
      setInputSuggestions([])
      setShowInputSuggestions(false)
    } finally {
      setSuggestionLoading(false)
    }
  }

  const handleAddSuggestedTag = (tagStr: string) => {
    const normalized = tagStr.trim().toLowerCase()
    if (!normalized) return
    // Prevent duplicates
    const exists = suggestedTags.some(t => t.tag.toLowerCase() === normalized)
    if (exists) {
      setNewTagInput('')
      setInputSuggestions([])
      setShowInputSuggestions(false)
      return
    }
    const colors = ['emerald','orange','blue','amber','purple','rose','cyan','indigo']
    const newTag = { tag: normalized, score: 50, color: colors[suggestedTags.length % colors.length] }
    setSuggestedTags(prev => [...prev, newTag])
    setNewTagInput('')
    setInputSuggestions([])
    setShowInputSuggestions(false)
  }

  useEffect(() => {
    if (!latestVideo?.title) {
      setSuggestedTags([])
      return
    }

    // Generate tags locally from video title without using search.list API (saves quota)
    console.log('🏷️ Generating tags locally from title:', latestVideo.title)
    const tags = generateTagsFallback(latestVideo.title)
    setSuggestedTags(tags)
  }, [latestVideo])

  // Close channel menu on outside clicks
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (channelMenuRef.current && !channelMenuRef.current.contains(e.target as Node)) {
        setShowChannelMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const startYouTubeAuth = () => {
    setIsConnecting(true)

    // Indicate where to return so server logic can treat this as additional channel flow
    localStorage.setItem('oauth_return_page', 'dashboard')

    // Open the correct popup URL and request a popup response
    const popup = window.open('/api/youtube/auth?popup=true', 'youtube-auth', 'width=500,height=600')

    const messageListener = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return

      if (event.data.type === 'YOUTUBE_AUTH_SUCCESS') {
        setIsConnecting(false)
        setShowConnectModal(false)
        window.removeEventListener('message', messageListener)
        if (popup) popup.close()

        const { channel, token, refreshToken } = event.data as any

        try {
          // Check if channel already connected via Supabase (will fetch on reload)
          setAdditionalChannelsList((list) => {
            // Dedupe defensively
            const exists = list.some((l) => l.id === channel.id)
            return exists ? list : [...list, channel]
          })

          // Store channel in database
          console.log('📤 Sending channel to /api/channels:', {
            channelId: channel.id,
            title: channel.title,
            description: channel.description
          })
          const storeRes = await fetch('/api/channels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              channelId: channel.id,
              title: channel.title,
              description: channel.description,
              thumbnail: channel.thumbnail,
              subscriberCount: channel.subscriberCount,
              videoCount: channel.videoCount,
              viewCount: channel.viewCount,
              isPrimary: false
            })
          })
          const storeData = await storeRes.json()
          if (!storeRes.ok) {
            console.error('❌ API Error:', storeRes.status, storeData)
            alert('Failed to save channel: ' + (storeData.error || 'Unknown error'))
          } else {
            console.log('✅ Channel stored in database:', storeData)
          }

          // Inform user and redirect to dashboard
          alert(`Successfully connected ${channel.title}`)
          router.push('/dashboard')
        } catch (err) {
          console.error('Failed to save connected channel:', err)
          router.push('/dashboard')
        }
      } else if (event.data.type === 'YOUTUBE_AUTH_ERROR') {
        setIsConnecting(false)
        window.removeEventListener('message', messageListener)
        if (popup) popup.close()
        console.error('Authentication failed:', event.data.error)
        alert('YouTube authentication failed. Please try again.')
      }
    }

    window.addEventListener('message', messageListener)

    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed)
        setIsConnecting(false)
        window.removeEventListener('message', messageListener)
      }
    }, 1000)

    setTimeout(() => {
      clearInterval(checkClosed)
      setIsConnecting(false)
      window.removeEventListener('message', messageListener)
      if (popup && !popup.closed) {
        popup.close()
      }
    }, 300000)
  }

  const handlePublishTags = async () => {
    if (!latestVideo || suggestedTags.length === 0) return

    setIsPublishing(true)
    setPublishError('')
    try {
      // Extract just the tag names
      const tagNames = suggestedTags.map(t => t.tag)

      console.log('Publishing tags:', tagNames)

      // Call API to publish tags to YouTube
      const response = await fetch('/api/tags/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: latestVideo.id,
          tags: tagNames,
          channelId: youtubeChannel?.id,
          accessToken: localStorage.getItem('youtube_access_token')
        })
      })

      console.log('Response status:', response.status)

      // Parse response as JSON
      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error('Failed to parse response:', parseError)
        setPublishError('Invalid response from server')
        setIsPublishing(false)
        return
      }

      console.log('Response data:', data)

      if (response.ok && (data.success || data.message)) {
        setPublishSuccess(true)
        setPublishError('')
        console.log('Tags published successfully')

        // Remove published video from the untagged list (if present) and pick next
        setVideosWithoutTags(prev => {
          const updated = prev.filter(v => v.id !== latestVideo.id)

          // after short delay, open the next untagged video if available
          setTimeout(() => {
            setPublishSuccess(false)
            if (updated.length > 0) {
              const next = updated[0]
              setLatestVideo(next)
              generateTagsLocally(next.title)
            }
          }, 1200)

          return updated
        })

        // Reset success message after 3 seconds
        setTimeout(() => setPublishSuccess(false), 3000)
      } else {
        const errorMsg = data.error || data.message || 'Failed to publish tags'
        setPublishError(errorMsg)
        console.error('Failed to publish tags:', errorMsg)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error publishing tags'
      setPublishError(errorMsg)
      console.error('Error publishing tags:', error)
    } finally {
      setIsPublishing(false)
    }
  }

  const handleAddTag = () => {
    const val = newTagInput.trim()
    if (!val) return

    const normalized = val.toLowerCase()
    // prevent duplicates
    if (suggestedTags.some(t => t.tag.toLowerCase() === normalized)) {
      setNewTagInput('')
      setInputSuggestions([])
      setShowInputSuggestions(false)
      return
    }

    const colors = ['emerald', 'orange', 'blue', 'amber', 'purple', 'rose', 'cyan', 'indigo']
    const newTag = {
      tag: normalized,
      score: 50,
      color: colors[suggestedTags.length % colors.length]
    }

    setSuggestedTags(prev => [...prev, newTag])
    setNewTagInput('')
    setInputSuggestions([])
    setShowInputSuggestions(false)
  }

  const handleRemoveTag = (index: number) => {
    setSuggestedTags(suggestedTags.filter((_, i) => i !== index))
  }

  const handleShowMore = () => {
    const next = !showAllTags
    setShowAllTags(next)
    setCardExpanded(next)

    // Focus the add-tag input when expanding so it's quick to add tags on mobile/desktop
    if (next) {
      setTimeout(() => addTagInputRef.current?.focus(), 120)
    }
  }

  const formatNumber = (num: string | number): string => {
    const n = typeof num === "string" ? parseInt(num) : num
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M"
    if (n >= 1000) return (n / 1000).toFixed(1) + "K"
    return n.toString()
  }

  // Enhanced reusable base classes for cards with better mobile responsiveness
  const cardBase = 'group relative bg-white rounded-2xl border border-gray-200/60 p-4 sm:p-5 md:p-6 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1 overflow-hidden backdrop-blur-sm'

  // Analytics data (fetched from server when channel is available)
  const [analyticsData, setAnalyticsData] = useState({
    views: youtubeChannel ? parseInt(youtubeChannel.viewCount) : 0,
    subscribers: youtubeChannel ? parseInt(youtubeChannel.subscriberCount) : 0,
    watchTime: 0, // in hours (computed from totalWatchMinutes)
    engagement: 0,
    revenue: 0,
    growth: {
      views: 0,
      subscribers: 0,
      watchTime: 0,
      engagement: 0,
      revenue: 0
    }
  })

  // Fetch analytics summary (total views & watch minutes) for the active channel - ONLY ONCE per channel
  useEffect(() => {
    const fetchAnalyticsSummary = async () => {
      if (!youtubeChannel) return
      
      // Skip if we've already loaded analytics for this channel in this session
      if (analyticsLoadedRef.current.has(youtubeChannel.id)) {
        console.log('[dashboard] ✓ Analytics already loaded for channel:', youtubeChannel.id)
        return
      }
      
      try {
        // First try to fetch cached analytics from database
        const cachedRes = await fetch(`/api/analytics?channelId=${youtubeChannel.id}`)
        const cachedData = await cachedRes.json()

        // Check if cache is fresh (less than 1 hour old)
        if (cachedData?.data?.last_fetched) {
          const lastFetch = new Date(cachedData.data.last_fetched).getTime()
          const now = Date.now()
          const ageHours = (now - lastFetch) / (1000 * 60 * 60)

          if (ageHours < 1) {
            // Cache is fresh, use it
            console.log('✅ Using cached analytics from database')
            setAnalyticsData((prev) => ({
              ...prev,
              views: Number(cachedData.data.total_views || youtubeChannel.viewCount || 0),
              subscribers: Number(cachedData.data.total_subscribers || youtubeChannel.subscriberCount || 0),
              watchTime: Number(cachedData.data.total_watch_time_hours || 0)
            }))
            return
          }
        }

        // Cache is stale or missing, fetch fresh analytics from server (server will resolve tokens)
        const res = await fetch(`/api/youtube/analytics/summary?channelId=${youtubeChannel.id}`)
        if (!res.ok) {
          console.warn('Analytics summary fetch failed', res.status)
          return
        }

        const data = await res.json()
        const totalWatchMinutes = Number(data?.summary?.totalWatchMinutes || 0)
        const totalViews = Number(data?.summary?.totalViews || youtubeChannel.viewCount || 0)
        const totalSubscribers = parseInt(youtubeChannel.subscriberCount || '0') || 0

        // Store fresh analytics in database
        await fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channelId: youtubeChannel.id,
            totalViews,
            totalSubscribers,
            totalWatchTimeHours: Math.round(totalWatchMinutes / 60)
          })
        })

        setAnalyticsData((prev) => ({
          ...prev,
          views: totalViews,
          subscribers: totalSubscribers,
          watchTime: Math.round(totalWatchMinutes / 60) // convert minutes to hours
        }))
      } catch (err) {
        console.error('Failed to fetch analytics summary:', err)
        // Fallback to channel stored stats
        setAnalyticsData((prev) => ({
          ...prev,
          views: parseInt(youtubeChannel?.viewCount || '0') || 0,
          subscribers: parseInt(youtubeChannel?.subscriberCount || '0') || 0,
          watchTime: 0
        }))
      } finally {
        // Mark this channel as having loaded analytics
        analyticsLoadedRef.current.add(youtubeChannel.id)
      }
    }

    fetchAnalyticsSummary()
  }, [youtubeChannel?.id]) // Use channel ID instead of full object

  // New step-by-step channel connection functions
  const handleStartChannelConnection = () => {
    setConnectionStep('select')
    setConnectionError(null)
  }

  const handleSelectChannel = (channel: YouTubeChannel) => {
    setSelectedChannelForConnection(channel)
    setConnectionStep('authorize')
  }

  const handleAuthorizeChannel = async () => {
    setIsConnectingChannel(true)
    setConnectionError(null)
    
    try {
      // Simulate authorization process
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Proceed with actual OAuth
      startYouTubeAuth()
      
    } catch (error) {
      console.error('Authorization failed:', error)
      setConnectionError('Failed to authorize channel. Please try again.')
      setIsConnectingChannel(false)
    }
  }

  const handleCancelConnection = () => {
    setConnectionStep('start')
    setSelectedChannelForConnection(null)
    setConnectionError(null)
    setIsConnectingChannel(false)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Fixed notification bell at top-right (replaces floating rank badge) */}
      <div className="fixed top-4 right-4 z-50">
        <NotificationBell />
      </div>

      <div className="flex">
        {/* Shared Sidebar */}
        <SharedSidebar 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
          activePage="dashboard"
          isCollapsed={sidebarCollapsed}
          setIsCollapsed={setSidebarCollapsed}
        />

        {/* Main Content */}
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
            {loadingVideo && (
              <div className="mb-4 px-2">
                <div className="h-1 w-full rounded-full overflow-hidden bg-gray-200/60">
                  <div className="h-1 w-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 opacity-80 animate-pulse" />
                </div>
              </div>
            )}
            {/* Redesigned Welcome Section */}
            <div className="mb-8 mt-8 md:mt-10">
              {/* Upgrade Banner */}
              {youtubeChannel && (
                <div className="flex justify-center mb-3 px-3 relative" ref={channelMenuRef}>
                  <div className="inline-flex items-center gap-2 bg-black/70 text-white px-3 py-1 rounded-full shadow-sm max-w-full truncate">
                    <img src={youtubeChannel.thumbnail} alt={youtubeChannel.title} className="w-6 h-6 rounded-full object-cover" />
                    <span className="text-sm font-medium truncate max-w-[160px]">{youtubeChannel.title}</span>

                    {/* Connected channels count */}
                    <span className="ml-2 inline-flex items-center text-xs bg-white/10 px-2 py-0.5 rounded-full">
                      <span className="font-semibold mr-1">{uniqueChannelCount}</span>
                      <span className="text-xs">{uniqueChannelCount === 1 ? 'channel' : 'channels'}</span>
                    </span>

                    <button
                      aria-haspopup="menu"
                      aria-expanded={showChannelMenu}
                      onClick={() => setShowChannelMenu((s: boolean) => !s)}
                      className="ml-2 flex items-center justify-center w-7 h-7 rounded-full bg-black/30 hover:bg-white/10 transition"
                      title="Channel actions"
                    >
                      <span className="text-sm">▼</span>
                    </button>
                  </div>

                  {/* Menu */}
                  {showChannelMenu && (
                    <div className="absolute top-full mt-3 left-1/2 transform -translate-x-1/2 bg-white rounded-3xl shadow-2xl w-[calc(100vw-2rem)] sm:w-full max-w-md text-gray-800 overflow-hidden z-40 animate-in fade-in slide-in-from-top-2 duration-300">
                      {/* Header */}
                      <div className="flex items-center gap-4 px-4 sm:px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="relative">
                            <img src={youtubeChannel?.thumbnail} alt={youtubeChannel?.title} className="w-14 h-14 rounded-full object-cover shadow-lg ring-2 ring-white" />
                            <span className="absolute -right-1 -bottom-1 bg-white rounded-full p-[2px] shadow-sm">
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
                            <span className="text-lg">✕</span>
                            <span className="hidden sm:inline">Disconnect</span>
                          </button>
                        </div>
                      </div>

                      {/* Channels List */}
                      <div className="px-3 py-3 max-h-64 sm:max-h-72 overflow-y-auto">
                        {visibleAdditionalChannels.length > 0 ? visibleAdditionalChannels.map((ch: YouTubeChannel) => (
                          <div key={ch.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition">
                            <img src={ch.thumbnail} alt={ch.title} className="w-10 h-10 rounded-full object-cover flex-shrink-0 shadow-sm" />
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

                      {/* Footer actions - Step-by-step connection flow */}
                      <div className="px-5 py-4 bg-white border-t border-gray-100">
                        <div className="space-y-3">
                          {/* Step 1: Start Connection */}
                          {connectionStep === 'start' && (
                            <button
                              onClick={handleStartChannelConnection}
                              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full py-3 px-6 flex items-center justify-center gap-3 shadow-sm font-semibold text-sm transition-all active:scale-95"
                            >
                              <Youtube className="w-5 h-5" />
                              Connect Another Channel
                            </button>
                          )}

                          {/* Step 2: Select Channel */}
                          {connectionStep === 'select' && (
                            <div className="space-y-3">
                              <div className="text-center">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold mb-2">
                                  <Sparkles className="w-3 h-3" />
                                  Step 1 of 3
                                </div>
                                <h3 className="font-semibold text-gray-900">Select Channel Type</h3>
                                <p className="text-sm text-gray-600 mt-1">Choose what type of channel you want to connect</p>
                              </div>
                              
                              <div className="grid grid-cols-1 gap-2">
                                <button
                                  onClick={() => handleSelectChannel({
                                    id: 'new-channel-' + Date.now(),
                                    title: 'New YouTube Channel',
                                    description: 'Connect a new YouTube channel',
                                    thumbnail: '/placeholder-channel.jpg',
                                    subscriberCount: '0',
                                    videoCount: '0',
                                    viewCount: '0',
                                    publishedAt: new Date().toISOString()
                                  })}
                                  className="w-full p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                      <Youtube className="w-6 h-6 text-red-600" />
                                    </div>
                                    <div>
                                      <div className="font-semibold text-gray-900">Connect New Channel</div>
                                      <div className="text-sm text-gray-600">Add a new YouTube channel to your account</div>
                                    </div>
                                  </div>
                                </button>
                                
                                <button
                                  onClick={() => handleSelectChannel({
                                    id: 'brand-channel-' + Date.now(),
                                    title: 'Brand/Agency Channel',
                                    description: 'Connect a brand or agency YouTube channel',
                                    thumbnail: '/placeholder-brand.jpg',
                                    subscriberCount: '0',
                                    videoCount: '0',
                                    viewCount: '0',
                                    publishedAt: new Date().toISOString()
                                  })}
                                  className="w-full p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                      <span className="text-2xl">🏢</span>
                                    </div>
                                    <div>
                                      <div className="font-semibold text-gray-900">Brand/Agency Channel</div>
                                      <div className="text-sm text-gray-600">Connect a business or agency YouTube channel</div>
                                    </div>
                                  </div>
                                </button>
                              </div>
                              
                              <button
                                onClick={handleCancelConnection}
                                className="w-full text-gray-600 hover:text-gray-800 text-sm font-medium py-2"
                              >
                                Cancel
                              </button>
                            </div>
                          )}

                          {/* Step 3: Authorize Channel */}
                          {connectionStep === 'authorize' && selectedChannelForConnection && (
                            <div className="space-y-4">
                              <div className="text-center">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold mb-2">
                                  <Sparkles className="w-3 h-3" />
                                  Step 2 of 3
                                </div>
                                <h3 className="font-semibold text-gray-900">Authorize Connection</h3>
                                <p className="text-sm text-gray-600 mt-1">Grant permission to access your YouTube channel</p>
                              </div>
                              
                              <div className="bg-gray-50 rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                  <img 
                                    src={selectedChannelForConnection.thumbnail} 
                                    alt={selectedChannelForConnection.title}
                                    className="w-12 h-12 rounded-full object-cover"
                                  />
                                  <div>
                                    <div className="font-semibold text-gray-900">{selectedChannelForConnection.title}</div>
                                    <div className="text-sm text-gray-600">Ready to connect</div>
                                  </div>
                                </div>
                              </div>
                              
                              {connectionError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                  <div className="text-sm text-red-700">{connectionError}</div>
                                </div>
                              )}
                              
                              <div className="flex gap-2">
                                <button
                                  onClick={handleAuthorizeChannel}
                                  disabled={isConnectingChannel}
                                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 text-white rounded-full py-3 px-4 font-semibold text-sm transition-all flex items-center justify-center gap-2"
                                >
                                  {isConnectingChannel ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      Connecting...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="w-4 h-4" />
                                      Authorize Channel
                                    </>
                                  )}
                                </button>
                                
                                <button
                                  onClick={handleCancelConnection}
                                  className="px-4 py-3 border border-gray-300 text-gray-700 rounded-full font-medium text-sm hover:bg-gray-50 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Step 4: Complete */}
                          {connectionStep === 'complete' && (
                            <div className="text-center space-y-3">
                              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                              </div>
                              <h3 className="font-semibold text-gray-900">Channel Connected!</h3>
                              <p className="text-sm text-gray-600">Your channel has been successfully connected.</p>
                              <button
                                onClick={handleCancelConnection}
                                className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full py-3 px-6 font-semibold text-sm transition-all"
                              >
                                Continue
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Show Connect Channel Card if no channel connected */}
              {!youtubeChannel && (
                <div className="flex justify-center mb-8 px-3">
                  <Link href="/connect">
                    <button className="inline-flex items-center gap-3 bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-full shadow-sm transition-all duration-200">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                      <span className="text-sm font-semibold">Connect Your YouTube Channel</span>
                    </button>
                  </Link>
                </div>
              )}

              <div className="flex justify-center mb-6 px-3">
                <div className="inline-flex items-center gap-3 rounded-full bg-white/5 border border-gray-100 px-4 py-2 text-sm text-gray-700 shadow-sm max-w-full overflow-hidden" suppressHydrationWarning>
                  <span className="text-lg">✨</span>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">Plan: Free</span>
                    <span className="text-gray-500 hidden sm:inline">• Limited features</span>
                  </div>
                  <Link href="/settings" className="ml-3 hidden sm:inline-flex items-center px-3 py-1 rounded-full bg-gray-50 text-gray-800 text-sm font-semibold">
                    <span>Manage plan</span>
                  </Link>
                </div>
              </div>

              {/* Hero / Overview */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
                <div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl leading-tight font-extrabold text-gray-900 mb-2 flex items-center gap-3">Welcome back, {firstName}! <span className="text-2xl">👋</span></h1>

                  <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="inline-flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full">
                      <span className="text-lg">✨</span>
                      <span className="text-sm sm:text-base text-gray-700">Quick snapshot — YouTube growth & earnings</span>
                    </div>

                    <div className="flex-1 hidden sm:block">
                      <span className="inline-block h-px bg-gray-200 ml-3 w-full"></span>
                    </div>

                    <div className="mt-3 sm:mt-0 flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <Link href="/challenge" prefetch={true} className="w-full sm:w-auto inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-3 rounded-full font-semibold shadow-sm text-sm text-center transition-all duration-200">Start Challenge</Link>
                      <Link href="/find-tag" prefetch={true} className="w-full sm:w-auto inline-flex items-center justify-center bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 text-white px-5 py-3 rounded-full font-semibold shadow-md text-sm text-center transition-all duration-200">Find Tag</Link>
                      <Link href="/ai-tools" prefetch={true} className="w-full sm:w-auto inline-flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-5 py-3 rounded-full font-semibold shadow-md text-sm text-center transition-all duration-200">AI Tools</Link>
                    </div>
                  </div>
                </div>
              </div>
              {/* Stats Cards - Simple & Clean (Matching Profile Page) */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-8">
                <div className="bg-gradient-to-r from-white to-sky-50 rounded-xl sm:rounded-2xl border border-sky-100 p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-700">Subscribers</p>
                      <p className="text-2xl sm:text-4xl font-bold text-gray-900 mt-2 sm:mt-3">{formatNumber(analyticsData.subscribers)}</p>
                    </div>
                    <div className="ml-3 sm:ml-4">
                      <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg bg-sky-50 flex items-center justify-center shadow-sm shrink-0">
                        <Users className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-white to-sky-50 rounded-xl sm:rounded-2xl border border-sky-100 p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-700">Total Views</p>
                      <p className="text-2xl sm:text-4xl font-bold text-gray-900 mt-2 sm:mt-3">{formatNumber(analyticsData.views)}</p>
                    </div>
                    <div className="ml-3 sm:ml-4">
                      <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg bg-sky-50 flex items-center justify-center shadow-sm shrink-0">
                        <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-white to-sky-50 rounded-xl sm:rounded-2xl border border-sky-100 p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200 col-span-2 sm:col-span-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-700">Total Videos</p>
                      <p className="text-2xl sm:text-4xl font-bold text-gray-900 mt-2 sm:mt-3">{formatNumber(youtubeChannel?.videoCount || 0)}</p>
                    </div>
                    <div className="ml-3 sm:ml-4">
                      <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg bg-sky-50 flex items-center justify-center shadow-sm shrink-0">
                        <Film className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Challenge Tracking Card */}
            <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {challengeData ? (
                (() => {
                  // Calculate days until next upload
                  const nextDeadline = challengeData.nextUploadDeadline ? new Date(challengeData.nextUploadDeadline) : new Date()
                  const now = new Date()
                  const daysLeft = Math.max(0, Math.ceil((nextDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
                  
                  // Calculate upload progress
                  const startDate = new Date(challengeData.startedAt)
                  const config = challengeData.config || {}
                  const durationDays = config.durationDays || 30
                  const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000)
                  const totalUploadsNeeded = Math.max(1, Math.ceil(durationDays / (challengeData.cadenceEveryDays || 1)))
                  const progress = (challengeData.uploads?.length || 0) > 0 ? Math.round(((challengeData.uploads.length) / totalUploadsNeeded) * 100) : 0
                  
                  return (
                    <ChallengeRoadmapCard
                      challengeTitle={challengeData.challengeTitle}
                      videosUploaded={challengeData.uploads?.length || 0}
                      totalVideosNeeded={totalUploadsNeeded}
                      currentStreak={challengeData.streakCount || 0}
                      totalPoints={challengeData.pointsEarned || 0}
                      startDate={startDate.toISOString()}
                      durationDays={durationDays}
                      cadenceEveryDays={challengeData.cadenceEveryDays || 1}
                    />
                  )
                })()
              ) : (
                <div className="text-center py-12 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl border border-slate-700/50">
                  <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-300 text-sm mb-4">No challenge active yet</p>
                  <Link href="/challenge" className="inline-block px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-amber-500/30 transition-all text-sm">
                    Start Challenge
                  </Link>
                </div>
              )}
            </div>

            {/* Add Missing Tags Card */}
            <div className="mb-8">
              <AddMissingTagsCard
                videos={videosWithoutTags.map(video => ({
                  id: video.id || '',
                  title: video.title || 'Untitled Video',
                  thumbnail: video.thumbnail || '',
                  publishedAt: video.publishedAt || new Date().toISOString(),
                  viewCount: video.viewCount || 0,
                  hasTags: Array.isArray(video.tags) && video.tags.length > 0,
                  hasDescription: Boolean(video.description && video.description.trim().length > 0),
                  tags: video.tags || [],
                  description: video.description || '',
                  suggestedTags: video.suggestedTags || [],
                  suggestedDescription: video.suggestedDescription || ''
                }))}
              />
            </div>

            {/* Add Missing Descriptions Card */}
            <div className="mb-8">
              <AddMissingDescriptionsCard
                videos={videosWithoutDescriptions.map(video => ({
                  id: video.id || '',
                  title: video.title || 'Untitled Video',
                  thumbnail: video.thumbnail || '',
                  publishedAt: video.publishedAt || new Date().toISOString(),
                  viewCount: video.viewCount || 0,
                  hasTags: Array.isArray(video.tags) && video.tags.length > 0,
                  hasDescription: Boolean(video.description && video.description.trim().length > 0),
                  tags: video.tags || [],
                  description: video.description || '',
                  suggestedTags: video.suggestedTags || [],
                  suggestedDescription: video.suggestedDescription || ''
                }))}
              />
            </div>

            {/* Connected Videos Strip - shows only videos from the connected channel inline (auto-scrolling) */}




            {/* Challenge Videos Grid */}
            {challengeData && challengeData.uploads && challengeData.uploads.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Film className="w-5 h-5" /> Challenge Uploads
                    </h3>
                    {isRefreshingStats && (
                      <div className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                        <TrendingUp className="w-3.5 h-3.5 animate-pulse" />
                        <span>Updating...</span>
                      </div>
                    )}
                    {!isRefreshingStats && lastStatsUpdate && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                        <span>Updated {Math.floor((Date.now() - lastStatsUpdate.getTime()) / 1000)}s ago</span>
                      </div>
                    )}
                  </div>
                  <Link
                    href="/challenge"
                    className="text-sm px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors inline-block"
                  >
                    View All
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {challengeData.uploads.slice(0, 6).map((video: any, idx: number) => (
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
                            <p className="text-sm font-bold text-blue-600">{formatNumber(video.video_views || video.videoViews || 0)}</p>
                          </div>
                          <div className="bg-pink-50 rounded-lg p-2 text-center border border-pink-100">
                            <p className="text-xs text-gray-600 font-medium">Likes</p>
                            <p className="text-sm font-bold text-pink-600">{formatNumber(video.video_likes || video.videoLikes || 0)}</p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-2 text-center border border-green-100">
                            <p className="text-xs text-gray-600 font-medium">Comments</p>
                            <p className="text-sm font-bold text-green-600">{formatNumber(video.video_comments || video.videoComments || 0)}</p>
                          </div>
                        </div>
                        
                        {/* Upload Date */}
                        <div className="flex items-center gap-2 text-xs text-gray-600 p-2 bg-gray-50 rounded-lg border border-gray-100">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(video.upload_date || video.uploadDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Videos Without Tags Carousel */}
            {videosWithoutTags.length > 0 && publishSuccess && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">✓ Next Videos to Tag</h3>
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  {/* Carousel Container */}
                  <div className="relative">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      {videosWithoutTags.slice(currentVideoIndex, currentVideoIndex + 3).map((video, idx) => (
                        <div key={video.id} className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl overflow-hidden shadow-md border border-slate-700/50 hover:shadow-lg transition-shadow">
                          {/* Thumbnail */}
                          <div className="relative w-full h-40 bg-gray-700 overflow-hidden">
                            {video.thumbnail ? (
                              <Image
                                src={video.thumbnail}
                                alt={video.title}
                                fill
                                className="object-cover hover:scale-105 transition-transform duration-300"
                                unoptimized
                                onError={(e: any) => { const target = e.target as HTMLImageElement; target.style.display = 'none' }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-500">
                                <span className="text-5xl">▶</span>
                              </div>
                            )}
                          </div>

                          {/* Video Info */}
                          <div className="p-4">
                            <h4 className="text-white font-semibold mb-2 line-clamp-2 text-sm">{video.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                              <span>{Number(video.viewCount).toLocaleString()} views</span>
                              <span>•</span>
                              <span>{new Date(video.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            </div>
                            <button 
                              onClick={() => {
                                // Open this video in the tag editor
                                setLatestVideo(video)
                                generateTagsLocally(video.title)
                                setPublishSuccess(false)
                              }}
                              className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors"
                            >
                              Tag This Video
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Dot Navigation */}
                    {videosWithoutTags.length > 3 && (
                      <div className="flex justify-center gap-2 mb-4">
                        {Array.from({ length: Math.ceil(videosWithoutTags.length / 3) }).map((_, dotIndex) => (
                          <button
                            key={dotIndex}
                            onClick={() => setCurrentVideoIndex(dotIndex * 3)}
                            className={`transition-all duration-300 ${
                              dotIndex === Math.floor(currentVideoIndex / 3)
                                ? 'w-8 h-2 bg-blue-600 rounded-full'
                                : 'w-2 h-2 bg-gray-400 rounded-full hover:bg-gray-300'
                            }`}
                            aria-label={`Go to video group ${dotIndex + 1}`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Navigation Arrows */}
                    {videosWithoutTags.length > 3 && (
                      <div className="flex justify-between items-center">
                        <button
                          onClick={() => setCurrentVideoIndex(Math.max(0, currentVideoIndex - 3))}
                          disabled={currentVideoIndex === 0}
                          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition-colors text-sm font-semibold"
                        >
                          ← Previous
                        </button>
                        <span className="text-gray-400 text-sm font-semibold">
                          {Math.floor(currentVideoIndex / 3) + 1} / {Math.ceil(videosWithoutTags.length / 3)}
                        </span>
                        <button
                          onClick={() => setCurrentVideoIndex(Math.min(videosWithoutTags.length - 3, currentVideoIndex + 3))}
                          disabled={currentVideoIndex >= videosWithoutTags.length - 3}
                          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition-colors text-sm font-semibold"
                        >
                          Next →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

              
          </div>
        </main>
      </div>

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Connect Additional Channel</h3>
              <p className="text-sm text-gray-600 mt-1">Add another YouTube channel to manage multiple accounts</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">▶</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">YouTube Channel</p>
                  <p className="text-sm text-gray-600">Connect via Google OAuth</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={startYouTubeAuth}
                  disabled={isConnecting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isConnecting ? 'Connecting...' : 'Connect Channel'}
                </Button>
                <Button
                  onClick={() => setShowConnectModal(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Challenge Videos Modal */}
      <ChallengeVideosModal
        isOpen={showChallengeModal}
        onClose={() => setShowChallengeModal(false)}
        videoSchedule={challengeVideoSchedule}
        totalVideos={challengeData?.config?.videosPerCadence ? 
          Math.ceil((challengeData.config.durationMonths || 6) * 30 / (challengeData.config.cadenceEveryDays || 2)) * (challengeData.config.videosPerCadence || 1)
          : 0}
        uploadedCount={Array.isArray(challengeVideoSchedule) ? challengeVideoSchedule.filter((v: any) => v.uploaded).length : 0}
        nextUploadDate={Array.isArray(challengeVideoSchedule) ? challengeVideoSchedule.find((v: any) => !v.uploaded)?.date : undefined}
        challengeStartDate={challengeData?.started_at}
        challengeEndDate={challengeData?.started_at ? 
          new Date(new Date(challengeData.started_at).getTime() + (challengeData.config?.durationMonths || 6) * 30 * 24 * 60 * 60 * 1000).toISOString()
          : undefined}
      />

      {/* Challenge Videos Detail Modal */}
      <ChallengeVideosDetailModal
        isOpen={showVideosModal}
        onClose={() => setShowVideosModal(false)}
        challenge={selectedChallengeForVideos}
        videos={challengeVideos}
      />
    </div>
  )
}
