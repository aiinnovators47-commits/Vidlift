"use client"

import Link from "next/link"
import Image from "next/image"
import SidebarButton from '@/components/ui/sidebar-button'
import { Button } from '@/components/ui/button'
import { Home, User, GitCompare, Video, Upload, Play, LogOut, Menu, X, TrendingUp, Users, Eye, Clock, BarChart3, Sparkles, Calendar, CheckCircle, AlertCircle, Zap, Target, Award, ArrowUpRight, Bell, Search, Handshake, Settings, ChevronDown, Youtube, Activity, FileText, Layers, TrendingDown, DollarSign, Heart, MessageSquare, Share2, MoreHorizontal, Lightbulb, Image as ImageIcon } from "lucide-react"
import { ViewsIcon, SubscribersIcon, WatchTimeIcon, EngagementIcon, UploadedIcon } from '@/components/icons/dashboard-icons'
import { useRouter, useSearchParams } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { useState, useEffect } from "react"
import dynamic from 'next/dynamic'
const NotificationBell = dynamic(() => import('@/components/notification-bell'), { ssr: false })
import ChannelSummary from '@/components/channel-summary'
import SharedSidebar from "@/components/shared-sidebar"

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

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chartSeries, setChartSeries] = useState<'views' | 'subs'>('views')
  const [activePage, setActivePage] = useState('dashboard')
  const [youtubeChannel, setYoutubeChannel] = useState<YouTubeChannel | null>(null)
  const [additionalChannels, setAdditionalChannels] = useState<YouTubeChannel[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showChannelDropdown, setShowChannelDropdown] = useState(false)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null)
  const [channelStatsLoaded, setChannelStatsLoaded] = useState(false)

  // Load YouTube channel data
  useEffect(() => {
    try {
      const stored = localStorage.getItem('youtube_channel')
      if (stored) {
        setYoutubeChannel(JSON.parse(stored))
      }

      const additionalStored = localStorage.getItem('additional_youtube_channels')
      if (additionalStored) {
        setAdditionalChannels(JSON.parse(additionalStored))
      }

      const activeId = localStorage.getItem('active_youtube_channel_id')
      if (activeId) {
        setActiveChannelId(activeId)
      } else if (stored) {
        const channel = JSON.parse(stored)
        setActiveChannelId(channel.id)
        localStorage.setItem('active_youtube_channel_id', channel.id)
      }
    } catch (error) {
      console.error('Failed to load channel data:', error)
    }
  }, [])

  const disconnectChannel = () => {
    localStorage.removeItem('youtube_channel')
    localStorage.removeItem('youtube_access_token')
    localStorage.removeItem('youtube_refresh_token')
    setYoutubeChannel(null)
    setShowChannelDropdown(false)
    window.location.href = '/connect'
  }

  const connectMoreChannels = () => {
    setShowChannelDropdown(false)
    if (youtubeChannel) {
      setShowConnectModal(true)
    } else {
      window.location.href = '/connect'
    }
  }

  const startYouTubeAuth = () => {
    setIsConnecting(true)
    
    const popup = window.open('/api/auth/youtube', 'youtube-auth', 'width=500,height=600')
    
    const messageListener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      
      if (event.data.type === 'YOUTUBE_AUTH_SUCCESS') {
        setIsConnecting(false)
        setShowConnectModal(false)
        window.removeEventListener('message', messageListener)
        if (popup) popup.close()
        
        // Reload the page to fetch new channel data
        window.location.reload()
      } else if (event.data.type === 'YOUTUBE_AUTH_ERROR') {
        setIsConnecting(false)
        window.removeEventListener('message', messageListener)
        if (popup) popup.close()
        console.error('Authentication failed:', event.data.error)
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

  const navLinks = [
    { icon: Home, label: 'Dashboard', href: '/dashboard', id: 'dashboard', badge: null },
    { icon: FileText, label: 'Vid-Info', href: '/vid-info', id: 'vid-info', badge: null },
    { icon: Video, label: 'Videos', href: '/videos', id: 'videos', badge: '12' },
    { icon: Upload, label: 'Bulk Upload', href: '/bulk-upload', id: 'bulk-upload', badge: null },
    { icon: GitCompare, label: 'Compare', href: '/compare', id: 'compare', badge: null },
  ]

  const handleSignOut = async () => {
    setIsLoading(true)
    await signOut({ redirect: false })
    router.push('/')
  }

  const formatNumber = (num: string | number): string => {
    const n = typeof num === "string" ? parseInt(num) : num
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M"
    if (n >= 1000) return (n / 1000).toFixed(1) + "K"
    return n.toString()
  }

  // Enhanced reusable base classes for cards with better mobile responsiveness
  const cardBase = 'group relative bg-white rounded-2xl border border-gray-200/60 p-4 sm:p-5 md:p-6 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1 overflow-hidden backdrop-blur-sm'
  const smallCardBase = 'bg-white/70 hover:bg-white rounded-xl p-4 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 border border-gray-100 hover:border-gray-200 flex flex-col gap-3'

  // Live analytics data (defaults to 0 until fetched)
  const [analyticsData, setAnalyticsData] = useState({
    videos: youtubeChannel ? parseInt(youtubeChannel.videoCount) : 0,
    views: youtubeChannel ? parseInt(youtubeChannel.viewCount) : 0,
    subscribers: youtubeChannel ? parseInt(youtubeChannel.subscriberCount) : 0,
    watchTime: 0,
    engagement: 0,
    revenue: 0,
    growth: {
      views: 0,
      subscribers: 0,
      watchTime: 0,
      engagement: 0,
      revenue: 0,
    },
  })

  const [statsLoading, setStatsLoading] = useState(true)

  // Fetch real channel stats from backend when we have a channel or token
  useEffect(() => {
    const fetchChannelStats = async () => {
      setStatsLoading(true)
      try {
        const token = localStorage.getItem('youtube_access_token')
        let url = '/api/youtube/channel'
        if (token) {
          url += `?access_token=${encodeURIComponent(token)}`
          console.log('[Dashboard] Fetching channel with token')
        } else if (youtubeChannel?.id) {
          url += `?channel_id=${encodeURIComponent(youtubeChannel.id)}`
          console.log('[Dashboard] Fetching channel with ID:', youtubeChannel.id)
        } else {
          console.log('[Dashboard] No token or channel ID available yet')
          setStatsLoading(false)
          return
        }

        const res = await fetch(url, {
          method: 'GET',
          headers: { 'Cache-Control': 'max-age=300' }
        })
        const data = await res.json()
        console.log('[Dashboard] Channel API response:', { status: res.status, success: data?.success })
        
        if (res.ok && data?.success && data.channel) {
          const ch = data.channel
          setYoutubeChannel(ch)
          setChannelStatsLoaded(true)
          try {
            localStorage.setItem('youtube_channel', JSON.stringify(ch))
          } catch (e) {
            /* ignore storage errors */
          }

          setAnalyticsData(prev => ({
            ...prev,
            videos: parseInt(ch.videoCount || '0'),
            views: parseInt(ch.viewCount || '0'),
            subscribers: parseInt(ch.subscriberCount || '0'),
          }))
        }
        setStatsLoading(false)
      } catch (err) {
        console.error('[Dashboard] Failed to fetch channel stats:', err)
        setStatsLoading(false)
      }
    }

    fetchChannelStats()
  }, [])

  // Helper: parse ISO 8601 duration (e.g. PT1H2M10S) to seconds
  const parseISODuration = (iso?: string | null) => {
    if (!iso) return 0
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return 0
    const hours = parseInt(match[1] || '0', 10)
    const minutes = parseInt(match[2] || '0', 10)
    const seconds = parseInt(match[3] || '0', 10)
    return hours * 3600 + minutes * 60 + seconds
  }

  // Fetch recent videos and compute watch time + engagement estimates
  useEffect(() => {
    const fetchVideosAndCompute = async () => {
      try {
        const token = localStorage.getItem('youtube_access_token')
        const channelId = youtubeChannel?.id
        
        console.log('[Dashboard Videos] Attempting to fetch:', { hasToken: !!token, channelId })
        
        if (!channelId && !token) {
          console.log('[Dashboard Videos] Skipping: no channelId or token')
          return
        }

        let url = `/api/youtube/videos?channelId=${encodeURIComponent(channelId || '')}&maxResults=50&fetchAll=true&pageCap=5`
        if (token) url += `&access_token=${encodeURIComponent(token)}`

        console.log('[Dashboard Videos] Fetching from:', url.split('&access')[0])

        const res = await fetch(url)
        const data = await res.json()
        
        console.log('[Dashboard Videos] Response:', { status: res.status, videoCount: data?.videos?.length })
        
        if (!res.ok || !data?.videos) {
          console.error('[Dashboard Videos] Error or no videos:', res.status, data?.error)
          return
        }

        const videos = Array.isArray(data.videos) ? data.videos : []
        let totalViews = 0
        let totalLikesComments = 0
        let totalWatchSeconds = 0

        for (const v of videos) {
          const viewCount = parseInt(String(v.viewCount || 0), 10) || 0
          const likeCount = parseInt(String(v.likeCount || 0), 10) || 0
          const commentCount = parseInt(String(v.commentCount || 0), 10) || 0
          const duration = parseISODuration(v.duration || v.contentDetails?.duration || null)

          totalViews += viewCount
          totalLikesComments += (likeCount + commentCount)
          totalWatchSeconds += viewCount * duration
        }

        const watchTimeHours = totalWatchSeconds / 3600
        const engagementPercent = totalViews > 0 ? (totalLikesComments / totalViews) * 100 : 0

        console.log('\u2705 [Dashboard] COMPUTED METRICS:', { videoCount: videos.length, totalViews, watchTimeHours: watchTimeHours.toFixed(2), engagementPercent: engagementPercent.toFixed(2) })

        setAnalyticsData(prev => ({
          ...prev,
          watchTime: Math.round(watchTimeHours * 10) / 10,
          engagement: Math.round(engagementPercent * 10) / 10,
        }))
      } catch (err) {
        console.error('[Dashboard Videos] Failed:', err)
      }
    }

    if (channelStatsLoaded || youtubeChannel?.id) {
      fetchVideosAndCompute()
    }
  }, [channelStatsLoaded, youtubeChannel?.id])

  // display helper for watch time hours
  const formatHoursForDisplay = (h: number) => {
    if (!h) return '—'
    if (h >= 1000) return formatNumber(h)
    return h % 1 === 0 ? String(h) : h.toFixed(1)
  }

  // Mock notifications data 
  const notifications = [
    { id: 1, type: 'success', message: 'Video published successfully', time: '5m ago' },
    { id: 2, type: 'info', message: 'New subscriber milestone: 45K', time: '1h ago' },
    { id: 3, type: 'warning', message: 'Scheduled video in 2 hours', time: '2h ago' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Fixed notification bell at top-right (replaces floating rank badge) */}
      <div className="fixed top-4 right-4 z-50">
        <NotificationBell />
      </div>

      <div className="flex">
        {/* Shared Sidebar */}
        <SharedSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activePage="dashboard" />

        {/* Main Content */}
        <main className="flex-1 pt-20 md:pt-20 md:ml-72 p-4 md:p-8 pb-20 md:pb-8">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-8 mt-8 md:mt-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">
                    Welcome back, {session?.user?.name?.split(' ')[0] || 'Creator'}! 👋
                  </h1>
                  <p className="text-gray-600 text-lg">Here's your channel performance overview</p>
                </div>
                <div className="flex items-center gap-3">
                  {!youtubeChannel && (
                    <Link href="/connect">
                      <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
                        <Youtube className="w-4 h-4 mr-2" />
                        Connect Channel
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              {/* Enhanced Stats Cards Grid - Mobile First Design */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
                {/* Uploaded */}
                <div className={`${cardBase} hover:border-indigo-300/50 hover:shadow-indigo-500/20`}>
                  <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-indigo-500/15 to-violet-500/15 rounded-full blur-2xl"></div>
                  <div className="relative">
                    <div className="mb-3 sm:mb-4 flex items-center gap-4">
                      <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center text-indigo-600 shadow-sm flex-shrink-0">
                        <UploadedIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">Uploaded</p>
                        <p className="text-lg sm:text-xl md:text-2xl font-black text-gray-900">{formatNumber(analyticsData.videos)}</p>
                        <p className="text-sm text-gray-500 mt-1">Full file</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => router.push('/upload')}
                      aria-label="Uploaded Videos"
                      title="Uploaded Videos"
                      className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 font-semibold px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all"
                    >
                      <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      <span className="truncate">Uploaded</span>
                    </Button>
                  </div>
                </div>

                {/* Views / Subscribers / Watch Time — grouped for mobile single-row display */}
                <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 sm:gap-4">
                  {/* Views */}
                  <div className={`${cardBase} hover:border-blue-300/50 hover:shadow-blue-500/20 min-w-[220px] flex-shrink-0 snap-start transition-all duration-500 ${statsLoading ? 'opacity-75' : 'opacity-100 animate-in fade-in slide-in-from-bottom-4 duration-700'}`}>
                    <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-500/15 to-cyan-500/15 rounded-full blur-2xl"></div>
                    <div className="relative">
                      <div className="mb-3 sm:mb-4 flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center text-blue-600 shadow-sm">
                          {statsLoading ? (
                            <div className="w-5 h-5 bg-blue-200 rounded-full animate-pulse"></div>
                          ) : (
                            <ViewsIcon className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">Total Views</p>
                          {statsLoading ? (
                            <div className="space-y-2">
                              <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                              <div className="h-3 bg-gray-100 rounded w-24 animate-pulse"></div>
                            </div>
                          ) : (
                            <>
                              <p className="text-lg sm:text-xl md:text-2xl font-black text-gray-900">{formatNumber(analyticsData.views)}</p>
                              <p className="text-sm text-gray-500 mt-1">Across all channels</p>
                            </>
                          )}
                        </div>
                      </div>
                      {!statsLoading && (
                        <Button
                          onClick={() => router.push('/vid-info')}
                          aria-label="Analyze Videos"
                          title="Analyze Videos"
                          className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 font-semibold px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all"
                        >
                          <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                          <span className="truncate">Analyze</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Subscribers */}
                  <div className={`${cardBase} hover:border-purple-300/50 hover:shadow-purple-500/20 min-w-[220px] flex-shrink-0 snap-start transition-all duration-500 ${statsLoading ? 'opacity-75' : 'opacity-100 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100'}`}>
                    <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-purple-500/15 to-pink-500/15 rounded-full blur-2xl"></div>
                    <div className="relative">
                      <div className="mb-3 sm:mb-4 flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center text-purple-600 shadow-sm">
                          {statsLoading ? (
                            <div className="w-5 h-5 bg-purple-200 rounded-full animate-pulse"></div>
                          ) : (
                            <SubscribersIcon className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">Subscribers</p>
                          {statsLoading ? (
                            <div className="space-y-2">
                              <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                              <div className="h-3 bg-gray-100 rounded w-24 animate-pulse"></div>
                            </div>
                          ) : (
                            <>
                              <p className="text-lg sm:text-xl md:text-2xl font-black text-gray-900">{formatNumber(analyticsData.subscribers)}</p>
                              <p className="text-sm text-gray-500 mt-1">Loyal community</p>
                            </>
                          )}
                        </div>
                      </div>
                      {!statsLoading && (
                        <Button
                          onClick={() => router.push('/bulk-upload')}
                          aria-label="Smart Bulk Upload"
                          title="Smart Bulk Upload"
                          className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 font-semibold px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all"
                        >
                          <Upload className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                          <span className="truncate">Smart Upload</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Watch Time */}
                  <div className={`${cardBase} hover:border-green-300/50 hover:shadow-green-500/20 min-w-[220px] flex-shrink-0 snap-start transition-all duration-500 ${statsLoading ? 'opacity-75' : 'opacity-100 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200'}`}>
                    <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-green-500/15 to-emerald-500/15 rounded-full blur-2xl"></div>
                    <div className="relative">
                      <div className="mb-3 sm:mb-4 flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center text-green-600 shadow-sm">
                          {statsLoading ? (
                            <div className="w-5 h-5 bg-green-200 rounded-full animate-pulse"></div>
                          ) : (
                            <WatchTimeIcon className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">Watch Time</p>
                          {statsLoading ? (
                            <div className="space-y-2">
                              <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                              <div className="h-3 bg-gray-100 rounded w-24 animate-pulse"></div>
                            </div>
                          ) : (
                            <>
                              <p className="text-lg sm:text-xl md:text-2xl font-black text-gray-900">{formatHoursForDisplay(analyticsData.watchTime) === '—' ? '—' : formatHoursForDisplay(analyticsData.watchTime) + 'h'}</p>
                              <p className="text-sm text-gray-500 mt-1">Hours watched</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Engagement */}
                <div className={`${cardBase} hover:border-orange-300/50 hover:shadow-orange-500/20`}>
                  <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-orange-500/15 to-red-500/15 rounded-full blur-2xl"></div>
                  <div className="relative">
                    <div className="mb-3 sm:mb-4 flex items-center gap-4">
                      <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center text-orange-600 shadow-sm flex-shrink-0">
                        <EngagementIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">Engagement</p>
                        <p className="text-lg sm:text-xl md:text-2xl font-black text-gray-900">{analyticsData.engagement}%</p>
                        <p className="text-sm text-gray-500 mt-1">Full file</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => router.push('/compare')}
                      aria-label="Compare Performance"
                      title="Compare Performance"
                      className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 font-semibold px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all"
                    >
                      <GitCompare className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                      <span className="truncate">Compare</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid lg:grid-cols-3 gap-6 sm:gap-8 mb-8">
              {/* Performance Chart */}
              <div className="lg:col-span-2">
                <div className={`${cardBase}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-lg font-black text-gray-900 mb-1">Performance Overview</h3>
                      <p className="text-sm text-gray-600">Track your channel's growth over time</p>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setChartSeries('views')}
                        className={`px-3 py-1.5 text-sm font-semibold rounded transition-colors ${
                          chartSeries === 'views' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Views
                      </button>
                      <button
                        onClick={() => setChartSeries('subs')}
                        className={`px-3 py-1.5 text-sm font-semibold rounded transition-colors ${
                          chartSeries === 'subs' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Subscribers
                      </button>
                    </div>
                  </div>

                  {/* Simple Chart Visualization */}
                  <div className="space-y-3">
                    {[...Array(7)].map((_, i) => {
                      const value = Math.floor(Math.random() * 80) + 20
                      const day = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs font-medium text-gray-600 w-8">{day}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 group-hover/bar:shadow-lg ${
                                chartSeries === 'views' 
                                  ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 group-hover/bar:from-blue-700 group-hover/bar:to-pink-700' 
                                  : 'bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 group-hover/bar:from-purple-700 group-hover/bar:to-rose-700'
                              }`}
                              style={{ width: `${value}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold text-gray-900 w-8 text-right">{value}%</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-4">
                <h3 className="text-lg font-black text-gray-900">Quick Actions</h3>
                
                <div className={`${smallCardBase}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Upload className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">Upload Video</p>
                      <p className="text-xs text-gray-600">Create new content</p>
                    </div>
                  </div>
                </div>

                <div className={`${smallCardBase}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">Analytics</p>
                      <p className="text-xs text-gray-600">View detailed stats</p>
                    </div>
                  </div>
                </div>

                <div className={`${smallCardBase}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <Lightbulb className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">AI Ideas</p>
                      <p className="text-xs text-gray-600">Get content suggestions</p>
                    </div>
                  </div>
                </div>

                <div className={`${smallCardBase}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Target className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">Optimize</p>
                      <p className="text-xs text-gray-600">Improve performance</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity & Tips */}
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
              {/* Recent Activity */}
              <div className={`${cardBase}`}>
                <h3 className="text-lg font-black text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Video uploaded successfully</p>
                      <p className="text-xs text-gray-600">5 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">New subscriber milestone reached</p>
                      <p className="text-xs text-gray-600">1 hour ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Engagement rate improved</p>
                      <p className="text-xs text-gray-600">2 hours ago</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Growth Tips */}
              <div className={`${cardBase}`}>
                <h3 className="text-lg font-black text-gray-900 mb-4">Growth Tips</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Lightbulb className="w-3 h-3 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Optimize your thumbnails</p>
                      <p className="text-xs text-gray-600">Use bright colors and clear text to increase CTR</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Target className="w-3 h-3 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Post consistently</p>
                      <p className="text-xs text-gray-600">Regular uploads help maintain audience engagement</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Users className="w-3 h-3 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Engage with comments</p>
                      <p className="text-xs text-gray-600">Respond to viewers to build community</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
                  <Youtube className="w-6 h-6 text-blue-600" />
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
    </div>
  )
}