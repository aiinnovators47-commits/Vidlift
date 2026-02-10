"use client"

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import SharedSidebar from '@/components/shared-sidebar'

import TitleSearchScoreComponent from '@/components/title-search-score'
import VideoCard from '@/components/video-card'
import { Sparkles, ChevronDown, Youtube, Loader2, AlertCircle, RefreshCw, Play, TrendingUp, Calendar } from 'lucide-react'
import { savePrimaryChannelToLocalStorage, getPrimaryChannelFromLocalStorage, getChannelWithCache } from '@/lib/channelStorage' 

interface YouTubeChannel {
  id: string
  title: string
  thumbnail: string
  subscriberCount: string
  videoCount: string
  viewCount: string
}

interface Video {
  id: string
  title: string
  description: string
  thumbnail: string
  publishedAt: string
  views: string
  likes: string
  comments: string
  duration: string
  privacyStatus?: 'public' | 'unlisted' | 'private'
}

export default function TitleSearchPage() {
  const { data: session } = useSession()
  const firstName = session?.user?.name ? session.user.name.split(' ')[0] : 'Creator'
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [youtubeChannel, setYoutubeChannel] = useState<YouTubeChannel | null>(null)
  const [showChannelMenu, setShowChannelMenu] = useState(false)
  const [additionalChannelsList, setAdditionalChannelsList] = useState<YouTubeChannel[]>([])
  const channelMenuRef = useRef<HTMLDivElement | null>(null)
  const [showInitialLoader, setShowInitialLoader] = useState(false) // Disabled - no loading modal needed
  const [titleLoaderDuration, setTitleLoaderDuration] = useState(0)

  // Initial loader disabled - navigation is now instant from localStorage
  useEffect(() => {
    // No loading needed - channel loads instantly from localStorage
    setShowInitialLoader(false)
  }, [])

  // Channel Video Analyzer States
  const [channelId, setChannelId] = useState("")
  const [videos, setVideos] = useState<Video[]>([])
  const [isLoadingVideos, setIsLoadingVideos] = useState(false)
  const [videosError, setVideosError] = useState("")
  const [nextPageToken, setNextPageToken] = useState<string | null>(null)
  const [showAnalyzer, setShowAnalyzer] = useState(false)
  const [activeTab, setActiveTab] = useState<'videos' | 'shorts'>('videos')
  
  // Featured videos -- removed (no longer used)
  // const [latestVideo, setLatestVideo] = useState<Video | null>(null)
  // const [topVideo, setTopVideo] = useState<Video | null>(null)
  // Access token availability state
  const [accessTokenAvailable, setAccessTokenAvailable] = useState(false)

  const visibleAdditionalChannels = additionalChannelsList.filter(ch => ch && ch.id && ch.id !== youtubeChannel?.id)
  const uniqueChannelCount = React.useMemo(() => {
    const map: Record<string, boolean> = {}
    if (youtubeChannel?.id) map[youtubeChannel.id] = true
    for (const ch of (additionalChannelsList || [])) {
      if (ch && ch.id) map[String(ch.id)] = true
    }
    return Object.keys(map).length
  }, [youtubeChannel, additionalChannelsList])

  // Filter videos based on duration (shorts < 3 minutes, videos >= 3 minutes)
  const isShortDuration = (duration: string): boolean => {
    if (!duration) return false
    try {
      // Handle ISO 8601 duration format: PT1H2M30S, PT1M30S, PT45S, etc.
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
      if (!match) return false
      
      const h = parseInt(match[1] || '0')
      const m = parseInt(match[2] || '0')
      const s = parseInt(match[3] || '0')
      const totalSeconds = h * 3600 + m * 60 + s
      
      // Shorts are videos under 3 minutes (180 seconds)
      return totalSeconds < 180
    } catch (e) {
      console.error('Duration parsing error:', e, 'for duration:', duration)
      return false
    }
  }

  const filteredVideos = activeTab === 'shorts' 
    ? videos.filter(v => isShortDuration(v.duration))
    : videos.filter(v => !isShortDuration(v.duration))

  // Load YouTube channel data from database - FAST (localStorage first)
  useEffect(() => {
    const loadChannelData = async () => {
      try {
        // Strategy 1: Try localStorage first (instant, <1ms) ⚡
        let channel = getPrimaryChannelFromLocalStorage()
        
        if (channel) {
          console.log('[title-search] ⚡ Channel from localStorage (instant):', channel.title)
          setYoutubeChannel(channel as YouTubeChannel)
          
          // Load additional channels from localStorage too
          const stored = localStorage.getItem('additional_youtube_channels')
          if (stored) {
            try {
              const additional = JSON.parse(stored)
              setAdditionalChannelsList(additional)
            } catch (e) {
              console.warn('[title-search] Failed to parse additional channels')
            }
          }
          
          // In background, refresh from DB if needed
          loadChannelDataFromDB()
          return
        }

        // Strategy 2: If not in localStorage, fetch from DB
        console.log('[title-search] 📡 Loading channel from database...')
        await loadChannelDataFromDB()
        
      } catch (err) {
        console.error('[title-search] Error loading channel:', err)
      }
    }

    const loadChannelDataFromDB = async () => {
      try {
        const res = await fetch('/api/channels')
        if (res.ok) {
          const data = await res.json()
          if (data?.channels && Array.isArray(data.channels)) {
            // Save all channels to localStorage for instant future access
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
              console.log('[title-search] ✓ Primary channel loaded and cached:', main.title)
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
            console.log('[title-search] ✓ Additional channels cached:', additional.length)
          }
        } else {
          console.error('[title-search] Failed to fetch channels:', res.status)
        }
      } catch (error) {
        console.error('[title-search] Failed to load from DB:', error)
      }
    }

    loadChannelData()
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (channelMenuRef.current && !channelMenuRef.current.contains(e.target as Node)) {
        setShowChannelMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Initial loader disabled - navigation is now instant from localStorage
  useEffect(() => {
    // No loading needed - channel loads instantly from localStorage
    setShowInitialLoader(false)
  }, [])

  const formatNumber = (num: number | string | undefined): string => {
    if (num === undefined || num === null) return '0'
    const n = typeof num === 'string' ? parseInt(num, 10) : num
    if (isNaN(n)) return '0'
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return n.toString()
  }

  // Utility: resolve access token (channel-scoped fallback + server fallback)
  const getResolvedAccessToken = async (): Promise<string | null> => {
    if (typeof window === 'undefined') return null
    try {
      // Try localStorage first (channel-specific or global)
      const byId = youtubeChannel?.id ? (localStorage.getItem(`youtube_access_token_${youtubeChannel.id}`) || localStorage.getItem(`youtube_token_${youtubeChannel.id}`)) : null
      const global = localStorage.getItem('youtube_access_token')
      let token = byId || global

      // If no token in localStorage, try server (Supabase)
      if (!token && youtubeChannel?.id) {
        try {
          const tokenRes = await fetch(`/api/tokens?channelId=${youtubeChannel.id}`)
          if (tokenRes.ok) {
            const tokenData = await tokenRes.json()
            token = tokenData?.data?.access_token || null
            // Persist for client convenience
            if (token) {
              localStorage.setItem(`youtube_access_token_${youtubeChannel.id}`, token)
              localStorage.setItem('youtube_access_token', token)
            }
          }
        } catch (err) {
          console.warn('Failed to fetch token from server:', err)
        }
      }

      // Persist channel-scoped token to the global key for compatibility
      if (token && byId && !global) {
        localStorage.setItem('youtube_access_token', byId)
      }
      return token
    } catch (err) {
      console.error('Error resolving access token:', err)
      return null
    }
  }

  // Helper: try to refresh access token using stored refresh token and return new token or null
  const attemptRefreshToken = async (): Promise<string | null> => {
    try {
      if (typeof window === 'undefined') return null
      const refreshToken = youtubeChannel?.id ? (localStorage.getItem(`youtube_refresh_token_${youtubeChannel.id}`) || localStorage.getItem('youtube_refresh_token')) : (localStorage.getItem('youtube_refresh_token') || null)
      if (!refreshToken) return null

      const res = await fetch('/api/youtube/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        console.warn('Refresh failed', errData)
        return null
      }

      const data = await res.json()
      if (data?.access_token) {
        // Persist new token
        if (youtubeChannel?.id) {
          localStorage.setItem(`youtube_access_token_${youtubeChannel.id}`, data.access_token)
        }
        localStorage.setItem('youtube_access_token', data.access_token)
        return data.access_token
      }
      return null
    } catch (err) {
      console.error('Error attempting refresh:', err)
      return null
    }
  }

  // Fetch a single page of videos from channel
  const fetchVideos = async (pageToken?: string) => {
    setIsLoadingVideos(true)
    setVideosError("")

    try {
      if (typeof window === 'undefined') return
      
      // Fetch videos server-side; server will use stored tokens or API-key fallback
      if (!youtubeChannel?.id) {
        setVideosError("Please connect your YouTube channel first. Go to Settings > Connect YouTube to authorize access.")
        setIsLoadingVideos(false)
        return
      }

      const url = `/api/youtube/videos?channelId=${encodeURIComponent(youtubeChannel.id)}&fetchAll=false&maxResults=20${pageToken ? `&pageToken=${pageToken}` : ''}`
      const response = await fetch(url)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (response.status === 401) {
          setVideosError('Authentication failed when fetching your channel. Please re-authorize the channel via Settings > Connect YouTube.')
        } else if (response.status === 404) {
          setVideosError(errorData.error || 'No uploads playlist found for this channel')
        } else {
          setVideosError(errorData.error || 'Failed to fetch videos')
        }
        throw new Error(errorData.error || 'Failed to fetch videos')
      }

      const data = await response.json()

      if (pageToken) {
        setVideos(prev => [...prev, ...data.videos])
      } else {
        setVideos(data.videos)
      }

      setNextPageToken(data.nextPageToken)
      setShowAnalyzer(true)
    } catch (err: any) {
      setVideosError(err.message || 'Failed to fetch videos')
      console.error('Error fetching videos:', err)
    } finally {
      setIsLoadingVideos(false)
    }
  }

  // Fetch all videos by iterating through playlist pages (same as content page - all videos: private, unlisted, public)
  const fetchAllVideos = async () => {
    setIsLoadingVideos(true)
    setVideosError("")

    try {
      if (typeof window === 'undefined') return
      
      if (!youtubeChannel?.id) {
        setVideosError("Please connect your YouTube channel first. Go to Settings > Connect YouTube to authorize access.")
        setIsLoadingVideos(false)
        return
      }

      // Ask server to fetch all videos for this channel (server handles pagination and auth)
      const url = `/api/youtube/videos?channelId=${encodeURIComponent(youtubeChannel.id)}&fetchAll=true&maxResults=50`
      const response = await fetch(url)

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        if (response.status === 401) {
          setVideosError('Authentication failed when fetching your channel. Please re-authorize the channel via Settings > Connect YouTube.')
        } else {
          setVideosError(err.error || 'Failed to fetch videos')
        }
        setIsLoadingVideos(false)
        return
      }

      const data = await response.json()
      setVideos(data.videos || [])
      setNextPageToken(null)
      setShowAnalyzer(true)
    } catch (err: any) {
      setVideosError(err.message || 'Failed to fetch all channel videos')
      console.error('Error fetching all videos:', err)
    } finally {
      setIsLoadingVideos(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setVideos([])
    setNextPageToken(null)
    // Always fetch all videos for authenticated user (same as content page)
    fetchAllVideos()
  }

  const loadMore = () => {
    if (nextPageToken) {
      fetchVideos(nextPageToken)
    }
  }

  // Keep token availability in sync when channel or additional channels change
  useEffect(() => {
    const checkToken = async () => {
      if (typeof window === 'undefined') return
      const token = await getResolvedAccessToken()
      setAccessTokenAvailable(!!token)
    }
    checkToken()
  }, [youtubeChannel, additionalChannelsList])

  // Featured video logic removed — we no longer compute or display latest/top videos here
  // useEffect(() => {
  //   if (videos.length > 0) {
  //     const latest = [...videos].sort((a, b) => 
  //       new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  //     )[0]
  //     setLatestVideo(latest)

  //     const top = [...videos].sort((a, b) => {
  //       const aViews = parseInt(a.views) || 0
  //       const bViews = parseInt(b.views) || 0
  //       return bViews - aViews
  //     })[0]
  //     setTopVideo(top)
  //   }
  // }, [videos, youtubeChannel])

  // Auto-load connected channel videos on mount or when token becomes available
  useEffect(() => {
    if (youtubeChannel?.id && videos.length === 0 && accessTokenAvailable) {
      // auto-fetch all videos for connected channel
      setVideosError("")
      fetchAllVideos()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [youtubeChannel, accessTokenAvailable])

  // Auto-redirect to shorts tab if no regular videos found
  useEffect(() => {
    if (videos.length > 0 && activeTab === 'videos') {
      const regularVideos = videos.filter(v => !isShortDuration(v.duration))
      if (regularVideos.length === 0) {
        // Automatically switch to shorts tab if no regular videos
        setActiveTab('shorts')
      }
    }
  }, [videos, activeTab])

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        {/* Shared Sidebar */}
        <SharedSidebar 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
          activePage="title-search"
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
            {/* Channel Selector & Upgrade Banner Section */}
            <div className="mb-8 mt-8 md:mt-10">
              {/* Channel Selector */}
              {youtubeChannel && (
                <div className="flex justify-center mb-3 px-3 relative" ref={channelMenuRef}>
                  <div className="inline-flex items-center gap-2 bg-black/70 text-white px-3 py-1 rounded-full shadow-sm max-w-full truncate">
                    <img 
                      src={youtubeChannel.thumbnail} 
                      alt={youtubeChannel.title} 
                      className="w-6 h-6 rounded-full object-cover" 
                    />
                    <span className="text-sm font-medium truncate max-w-40">{youtubeChannel.title}</span>
                    <span className="ml-2 inline-flex items-center text-xs bg-white/10 px-2 py-0.5 rounded-full">
                      <span className="font-semibold mr-1">{uniqueChannelCount}</span>
                      <span className="text-xs">{uniqueChannelCount === 1 ? 'channel' : 'channels'}</span>
                    </span>
                    <button
                      onClick={() => setShowChannelMenu((s: boolean) => !s)}
                      className="ml-2 flex items-center justify-center w-7 h-7 rounded-full bg-black/30 hover:bg-white/10 transition"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Channel Menu Dropdown */}
                  {showChannelMenu && (
                    <div className="absolute top-full mt-3 left-1/2 transform -translate-x-1/2 bg-white rounded-3xl shadow-2xl w-[calc(100vw-2rem)] sm:w-full max-w-md text-gray-800 overflow-hidden z-40 animate-in fade-in slide-in-from-top-2 duration-300">
                      {/* Header */}
                      <div className="flex items-center gap-4 px-4 sm:px-6 py-4 bg-gradient-to-r from-indigo-50 to-pink-50 border-b border-gray-100">
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
                            </div>
                          </div>
                        )) : (
                          <div className="flex items-center justify-center px-6 py-10 text-sm text-gray-500 font-medium bg-gray-50 rounded-xl">No other channels connected</div>
                        )}
                      </div>

                      {/* Footer actions */}
                      <div className="px-5 py-4 bg-white border-t border-gray-100">
                        <div className="space-y-3">
                          <button
                            onClick={() => {
                              localStorage.setItem('oauth_return_page', 'sidebar')
                              setShowChannelMenu(false)
                            }}
                            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full py-3 px-6 flex items-center justify-center gap-3 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 font-semibold text-sm transition-all active:scale-95"
                          >
                            <Play className="w-4 h-4" />
                            Connect Another Channel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Upgrade Banner */}
              <div className="flex justify-center mb-3 px-3">
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

            {/* Channel Video Analyzer Section (moved up) */}
            <div className="w-full mb-8">
              {/* Section Header with Tabs */}
              <div className="flex flex-col gap-4 mb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg bg-white/5">
                    <img src="/icons/youtube-play.svg" alt="YouTube" className="w-8 h-8" />
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-1">
                        Channel Video Analyzer
                      </h2>
                      <p className="text-gray-600 text-sm sm:text-base max-w-full sm:max-w-xl leading-snug wrap-break-word">Optimize your video titles using real YouTube search queries and suggestions</p>
                    </div>
                    {youtubeChannel && (
                      <span className="ml-0 sm:ml-2 mt-2 sm:mt-0 inline-flex items-center px-3 py-1 rounded-full bg-white border border-gray-100 text-xs font-semibold text-gray-700 shadow-sm">
                        Using: <span className="ml-2 font-medium">{youtubeChannel.title}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab('videos')}
                    className={`flex items-center gap-2 px-4 py-3 font-semibold text-base transition-all ${activeTab === 'videos' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/>
                    </svg>
                    Videos
                  </button>
                  <button
                    onClick={() => setActiveTab('shorts')}
                    className={`flex items-center gap-2 px-4 py-3 font-semibold text-base transition-all ${activeTab === 'shorts' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M10 16.5l6-4.5-6-4.5v9z"/>
                    </svg>
                    Shorts
                  </button>
                </div>
              </div>

              {/* Videos Grid / Loading / Empty states */}



              {/* If a channel is connected and videos are still loading, show a focused loading card */}
              {youtubeChannel && isLoadingVideos && videos.length === 0 && (
                <div className="p-8 rounded-xl bg-white shadow-sm border border-blue-100 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                    <p className="text-lg font-semibold text-gray-900">Loading videos from your channel</p>
                    <p className="text-sm text-gray-600">This may take a few moments — we're fetching your uploads. <span className="animate-pulse">...</span></p>
                    <div className="mt-4">
                      <button onClick={() => fetchAllVideos()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">Refresh</button>
                    </div>
                  </div>
                </div>
              )}

              {/* If we have videos, show grid */}
              {videos.length > 0 && (
                <div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                    <h3 className="text-2xl font-extrabold text-gray-900 flex items-center gap-3">
                      {activeTab === 'videos' ? 'Videos' : 'Shorts'}
                      <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-blue-50 text-sm font-semibold text-blue-700 border border-blue-100">{filteredVideos.length} items</span>
                    </h3>
                  </div>

                  {filteredVideos.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredVideos.map((video) => (
                          <VideoCard key={video.id} video={video} />
                        ))}
                      </div>

                      {/* Load More Button */}
                      {nextPageToken && (
                        <div className="mt-6 flex justify-center">
                          <button
                            onClick={loadMore}
                            disabled={isLoadingVideos}
                            className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
                          >
                            {isLoadingVideos ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin text-blue-300" />
                                <span>Loading...</span>
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-5 h-5" />
                                <span>Load More {activeTab === 'videos' ? 'Videos' : 'Shorts'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-8 rounded-xl bg-white shadow-sm border border-gray-100 text-center">
                      <p className="text-lg font-semibold text-gray-900">No {activeTab === 'videos' ? 'videos' : 'shorts'} found</p>
                      <p className="text-sm text-gray-600 mt-2">Your channel doesn't have any {activeTab === 'videos' ? 'long-form videos' : 'short videos'} yet.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Error state */}
              {videosError && (
                <div className="p-8 rounded-xl bg-white shadow-sm border border-red-100 text-center mt-6">
                  <p className="text-sm text-red-700 font-semibold">{videosError}</p>
                  <div className="mt-4">
                    <button onClick={() => fetchAllVideos()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg mr-2 transition-colors">Retry</button>
                    <button onClick={() => setChannelId('')} className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Change Channel</button>
                  </div>
                </div>
              )}

              {/* Empty state (no videos found) */}
              {!isLoadingVideos && videos.length === 0 && !videosError && showAnalyzer && (
                <div className="p-8 rounded-xl bg-white shadow-sm border border-gray-100 text-center">
                  <p className="text-lg font-semibold text-gray-900">No videos found for this channel</p>
                  <p className="text-sm text-gray-600 mt-2">Try refreshing, checking your connection, or connecting a different channel.</p>
                </div>
              )}

              {/* Feature Info */}
              <div className="mt-8 bg-blue-50 rounded-2xl p-8 border border-blue-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  What you'll get:
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-bold text-sm">1</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Title Performance Analysis</p>
                      <p className="text-sm text-gray-600">Analyze your existing video titles with real engagement data including views, likes, and comments</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-bold text-sm">2</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Keyword Research</p>
                      <p className="text-sm text-gray-600">Discover high-performing keywords from your successful videos and trending searches</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-bold text-sm">3</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Content Optimization Insights</p>
                      <p className="text-sm text-gray-600">Get data-driven recommendations to improve your video titles and boost discoverability</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-bold text-sm">4</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Performance Tracking</p>
                      <p className="text-sm text-gray-600">Monitor your video performance metrics and identify patterns in your most successful content</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Title Search Component */}
            <div className="w-full mb-12">
              <TitleSearchScoreComponent />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
