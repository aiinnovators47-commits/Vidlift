"use client"

import Link from "next/link"
import Image from "next/image"
import SidebarButton from '@/components/ui/sidebar-button'
import { Button } from '@/components/ui/button'
import { Home, User, GitCompare, Video, Upload, Play, LogOut, Menu, X, TrendingUp, Users, Eye, Clock, BarChart3, Sparkles, Calendar, CheckCircle, AlertCircle, Zap, Target, Award, ArrowUpRight, Bell, Search, Settings, ChevronDown, Youtube, Activity, FileText, Layers, TrendingDown, DollarSign, Heart, MessageSquare, Share2, MoreHorizontal, Lightbulb, Image as ImageIcon } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { useState, useEffect } from "react"
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
      
      // Auto-close modal if it was open and channels are loaded
      if (showConnectModal && (stored || additionalStored)) {
        setShowConnectModal(false)
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
    // Redirect to connect page or show success message
    window.location.href = '/connect'
  }

  const connectMoreChannels = () => {
    setShowChannelDropdown(false)
    if (youtubeChannel) {
      // Open modal for additional channel connection
      setShowConnectModal(true)
    } else {
      // First channel connection - go to connect page
      window.location.href = '/connect'
    }
  }

  const startYouTubeAuth = () => {
    setIsConnecting(true)
    // Set return page to indicate this is for additional channels
    localStorage.setItem('oauth_return_page', 'dashboard')
    // Create a popup window for YouTube authentication
    const popup = window.open(
      '/api/youtube/auth?popup=true',
      'youtube-auth',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    )

    // Listen for messages from the popup
    const messageListener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      
      if (event.data.type === 'YOUTUBE_AUTH_SUCCESS') {
        const { channel, token } = event.data
        
        // Check if this channel is already connected (primary or additional)
        const existingChannels = JSON.parse(localStorage.getItem('additional_youtube_channels') || '[]')
        const isPrimaryChannel = youtubeChannel && youtubeChannel.id === channel.id
        const isAlreadyAdditional = existingChannels.some((ch: any) => ch.id === channel.id)
        
        if (isPrimaryChannel || isAlreadyAdditional) {
          alert(`Channel "${channel.title}" is already connected!`)
          setIsConnecting(false)
          popup?.close()
          return
        }
        
        // Save additional channel (don't replace primary)
        const updatedChannels = [...existingChannels, channel]
        localStorage.setItem('additional_youtube_channels', JSON.stringify(updatedChannels))
        localStorage.setItem(`youtube_token_${channel.id}`, token)
        
        // Clear the oauth return page to prevent connect page processing
        localStorage.removeItem('oauth_return_page')
        
        // Update state
        setAdditionalChannels(updatedChannels)
        setIsConnecting(false)
        setShowConnectModal(false)
        popup?.close()
        
        // Show success message
        alert(`Successfully connected ${channel.title} as additional channel!`)
        console.log('Additional channels updated:', updatedChannels)
      } else if (event.data.type === 'YOUTUBE_AUTH_ERROR') {
        setIsConnecting(false)
        alert('Failed to connect channel. Please try again.')
        popup?.close()
      }
    }

    window.addEventListener('message', messageListener)
    
    // Check if popup is closed manually
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed)
        setIsConnecting(false)
        window.removeEventListener('message', messageListener)
      }
    }, 1000)

    // Cleanup after 5 minutes
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

  // Mock analytics data
  const analyticsData = {
    views: youtubeChannel ? parseInt(youtubeChannel.viewCount) : 127500,
    subscribers: youtubeChannel ? parseInt(youtubeChannel.subscriberCount) : 45200,
    watchTime: 8200,
    engagement: 12.5,
    revenue: 2450,
    growth: {
      views: 23,
      subscribers: 18,
      watchTime: 31,
      engagement: 15,
      revenue: 28
    }
  }

  const recentVideos = [
    { id: 1, title: "How to Grow Your YouTube Channel Fast", views: "12.5K", likes: "1.2K", comments: "234", status: "published", thumbnail: "🎥" },
    { id: 2, title: "AI Tools for Content Creators 2024", views: "8.3K", likes: "890", comments: "156", status: "published", thumbnail: "🤖" },
    { id: 3, title: "YouTube Algorithm Explained Simply", views: "15.7K", likes: "1.5K", comments: "312", status: "published", thumbnail: "📊" },
    { id: 4, title: "Best Video Editing Software Review", views: "6.2K", likes: "645", comments: "89", status: "draft", thumbnail: "✂️" },
  ]

  const notifications = [
    { id: 1, type: 'success', message: 'Video published successfully', time: '5m ago' },
    { id: 2, type: 'info', message: 'New subscriber milestone: 45K', time: '1h ago' },
    { id: 3, type: 'warning', message: 'Scheduled video in 2 hours', time: '2h ago' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex">
        {/* Shared Sidebar */}
        <SharedSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activePage="dashboard" />

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
                  <Button variant="outline" className="border-gray-300">
                    <Calendar className="w-4 h-4 mr-2" />
                    Last 30 days
                  </Button>
                </div>
              </div>
            </div>

            {/* Channel Summary */}
            <div className="mb-6">
              <ChannelSummary channel={youtubeChannel} />
            </div>

            {/* Analytics Overview - Enhanced Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {/* Total Views */}
              <div className={`${cardBase} hover:border-blue-300/50 hover:shadow-blue-500/20`}>
                <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-500/15 to-cyan-500/15 rounded-full blur-2xl"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="flex items-center gap-1 text-xs sm:text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                      <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{analyticsData.growth.views}%</span>
                    </div>
                  </div>
                  <div className="mb-3 sm:mb-4">
                    <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">Total Views</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-black text-gray-900">{formatNumber(analyticsData.views)}</p>
                  </div>
                  {/* AI Tools removed */}
                </div>
              </div>

              {/* Subscribers */}
              <div className={`${cardBase} hover:border-purple-300/50 hover:shadow-purple-500/20`}>
                <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-purple-500/15 to-pink-500/15 rounded-full blur-2xl"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="flex items-center gap-1 text-xs sm:text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                      <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{analyticsData.growth.subscribers}%</span>
                    </div>
                  </div>
                  <div className="mb-3 sm:mb-4">
                    <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">Subscribers</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-black text-gray-900">{formatNumber(analyticsData.subscribers)}</p>
                  </div>
                  <Button
                    onClick={() => router.push('/bulk-upload')}
                    aria-label="Smart Bulk Upload"
                    title="Smart Bulk Upload"
                    className="w-full bg-white border border-gray-200 text-gray-900 font-semibold px-4 py-2 rounded-lg shadow-sm"
                  >
                    <Upload className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                    <span className="truncate">Smart Upload</span>
                  </Button>
                </div>
              </div>

              {/* Watch Time */}
              <div className={`${cardBase} hover:border-green-300/50 hover:shadow-green-500/20`}>
                <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-green-500/15 to-emerald-500/15 rounded-full blur-2xl"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="flex items-center gap-1 text-xs sm:text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                      <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{analyticsData.growth.watchTime}%</span>
                    </div>
                  </div>
                  <div className="mb-3 sm:mb-4">
                    <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">Watch Time</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-black text-gray-900">{formatNumber(analyticsData.watchTime)}h</p>
                  </div>
                  {/* AI Tools removed */}
                </div>
              </div>

              {/* Engagement */}
              <div className={`${cardBase} hover:border-orange-300/50 hover:shadow-orange-500/20`}>
                <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-orange-500/15 to-red-500/15 rounded-full blur-2xl"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="flex items-center gap-1 text-xs sm:text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                      <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{analyticsData.growth.engagement}%</span>
                    </div>
                  </div>
                  <div className="mb-3 sm:mb-4">
                    <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">Engagement</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-black text-gray-900">{analyticsData.engagement}%</p>
                  </div>
                  {/* AI Tools removed */}
                </div>
              </div>

              {/* Est. Revenue card removed per design request */}
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Chart & Videos */}
              <div className="lg:col-span-2 space-y-8">
                {/* Growth Chart */}
                <div className={`${cardBase} shadow-sm`}>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-black text-gray-900">Channel Growth</h3>
                      <p className="text-sm text-gray-600 mt-1">Your performance over the last 30 days</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setChartSeries('views')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${chartSeries === 'views' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'}`}>
                        Views
                      </button>
                      <button
                        onClick={() => setChartSeries('subs')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${chartSeries === 'subs' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                        Subs
                      </button>
                    </div>
                  </div>
                  <div className="h-36 sm:h-44 md:h-72 flex items-end justify-between gap-1.5">
                    {[30, 45, 35, 60, 50, 75, 65, 85, 70, 90, 80, 95, 88, 100, 92, 98, 85, 94, 89, 96].map((height, i) => (
                      <div key={i} className="flex-1 group/bar cursor-pointer relative">
                        <div
                          className={`w-full rounded-t-lg transition-all duration-300 group-hover/bar:shadow-lg ${chartSeries === 'views' ? 'bg-gradient-to-t from-blue-600 via-purple-600 to-pink-600 group-hover/bar:from-blue-700 group-hover/bar:via-purple-700 group-hover/bar:to-pink-700' : 'bg-gradient-to-t from-purple-600 via-pink-600 to-indigo-600 group-hover/bar:from-purple-700 group-hover/bar:via-pink-700 group-hover/bar:to-indigo-700'}`}
                          style={{ height: `${height}%` }}
                        />
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap">
                          {chartSeries === 'views' ? `${Math.round(height * 100)} views` : `${Math.round(height * 10)} subs`}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Chart axis labels */}
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                    <span>Day 1</span>
                    <span>Day 5</span>
                    <span>Day 10</span>
                    <span>Day 15</span>
                    <span>Day 20</span>
                  </div>
                </div>

                {/* Recent Videos */}
                <div className={`${cardBase} shadow-sm`}>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-black text-gray-900">Recent Videos</h3>
                      <p className="text-sm text-gray-600 mt-1">Your latest content performance</p>
                    </div>
                    <Link href="/content">
                      <Button variant="outline" size="sm">
                        View All
                      </Button>
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {recentVideos.map((video) => (
                      <div key={video.id} className={`${smallCardBase} hover:shadow-xl hover:-translate-y-1 transition-all duration-200 border border-gray-200/60 hover:border-gray-300`}>
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-16 h-12 sm:w-20 sm:h-14 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                            <div className="w-full h-full flex items-center justify-center text-xl sm:text-2xl">{video.thumbnail}</div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 text-sm sm:text-base line-clamp-2 mb-2 leading-tight">{video.title}</h4>
                            <div className="flex items-center gap-3 text-xs text-gray-600">
                              <div className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                <span className="font-medium">{video.views}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                <span className="font-medium">{video.likes}</span>
                              </div>
                              <div className="hidden sm:flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                <span className="font-medium">{video.comments}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="More options">
                              <MoreHorizontal className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg ${video.status === 'published' 
                            ? 'bg-green-50 border border-green-200 text-green-700' 
                            : 'bg-yellow-50 border border-yellow-200 text-yellow-700'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${video.status === 'published' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                            <span className="text-xs font-bold capitalize">{video.status}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-xs h-7 px-2 hover:bg-gray-100"
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-xs h-7 px-2 bg-gray-50 hover:bg-gray-100"
                            >
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Actions & Insights */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <div className={`${cardBase} shadow-sm`}>
                  <h3 className="text-lg font-black text-gray-900 mb-6">Quick Actions</h3>
                  <div className="space-y-3">
                    <Link href="/upload" className="block">
                      <Button 
                        variant="dashboard-blue" 
                        size="dashboard"
                        className="w-full justify-start"
                      >
                        <Upload className="w-4 h-4 shrink-0" />
                        <span>Upload Video</span>
                      </Button>
                    </Link>
                    <Link href="/content" className="block">
                      <Button 
                        variant="outline" 
                        size="dashboard"
                        className="w-full justify-start hover:bg-gray-50 border-gray-200"
                      >
                        <Video className="w-4 h-4 shrink-0 text-gray-600" />
                        <span className="text-gray-900">Manage Content</span>
                      </Button>
                    </Link>
                    <Link href="/analytics" className="block">
                      <Button 
                        variant="outline" 
                        size="dashboard"
                        className="w-full justify-start hover:bg-gray-50 border-gray-200"
                      >
                        <BarChart3 className="w-4 h-4 shrink-0 text-gray-600" />
                        <span className="text-gray-900">View Analytics</span>
                      </Button>
                    </Link>
                    <Link href="/upload/shorts" className="block">
                      <Button 
                        variant="dashboard-green" 
                        size="dashboard"
                        className="w-full justify-start"
                      >
                        <Video className="w-4 h-4 shrink-0" />
                        <span>Create Short</span>
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* AI Insights - Only show when channel is connected */}
                <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-black">AI Insights</h3>
                  </div>
                  {youtubeChannel ? (
                    <div className="space-y-4">
                      {(() => {
                        const subscribers = parseInt(youtubeChannel.subscriberCount)
                        const views = parseInt(youtubeChannel.viewCount)
                        const videos = parseInt(youtubeChannel.videoCount)
                        const avgViewsPerVideo = videos > 0 ? Math.round(views / videos) : 0
                        const engagementRate = subscribers > 0 ? ((avgViewsPerVideo / subscribers) * 100) : 0
                        
                        const insights = []
                        
                        // Real engagement analysis
                        if (engagementRate > 5) {
                          insights.push({
                            icon: Zap,
                            text: `Strong engagement rate: <strong>${engagementRate.toFixed(1)}%</strong> of subscribers watch your videos`
                          })
                        } else if (engagementRate > 2) {
                          insights.push({
                            icon: Zap,
                            text: `Good engagement: <strong>${engagementRate.toFixed(1)}%</strong> rate - Focus on more engaging content`
                          })
                        } else if (subscribers > 0) {
                          insights.push({
                            icon: Target,
                            text: `Low engagement: <strong>${engagementRate.toFixed(1)}%</strong> - Try more interactive content`
                          })
                        }
                        
                        // Content frequency analysis
                        if (videos > 0) {
                          insights.push({
                            icon: Award,
                            text: `You've published <strong>${videos} videos</strong> with an average of <strong>${formatNumber(avgViewsPerVideo)}</strong> views each`
                          })
                        }
                        
                        // Growth potential
                        if (subscribers < 1000) {
                          insights.push({
                            icon: Target,
                            text: `<strong>${1000 - subscribers} subscribers</strong> away from YouTube monetization!`
                          })
                        } else if (subscribers < 10000) {
                          insights.push({
                            icon: Award,
                            text: `Great progress! <strong>${formatNumber(subscribers)}</strong> subscribers - Keep growing!`
                          })
                        }
                        
                        return insights.slice(0, 3).map((insight, index) => {
                          const IconComponent = insight.icon
                          return (
                            <div key={index} className="flex items-start gap-3 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                              <IconComponent className="w-5 h-5 shrink-0 mt-0.5" />
                              <p className="text-sm" dangerouslySetInnerHTML={{ __html: insight.text }} />
                            </div>
                          )
                        })
                      })()}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Target className="w-12 h-12 mx-auto mb-3 text-white/60" />
                      <p className="text-sm text-white/80 mb-3">Connect your YouTube channel to see personalized AI insights</p>
                      <Link href="/connect">
                        <Button className="bg-white/20 hover:bg-white/30 text-white border border-white/30">
                          Connect Channel
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Top Performing - Only show when real data available */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-black text-gray-900 mb-4">Performance Summary</h3>
                  {youtubeChannel ? (
                    <div className="space-y-4">
                      {/* Channel Overview */}
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-100">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                            <Youtube className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm truncate">{youtubeChannel.title}</p>
                            <p className="text-xs text-gray-600">{formatNumber(youtubeChannel.subscriberCount)} subscribers</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Key Metrics */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-green-50 p-3 rounded-lg text-center">
                          <p className="text-lg font-black text-green-900">{formatNumber(youtubeChannel.viewCount)}</p>
                          <p className="text-xs text-green-700">Total Views</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg text-center">
                          <p className="text-lg font-black text-blue-900">{youtubeChannel.videoCount}</p>
                          <p className="text-xs text-blue-700">Videos</p>
                        </div>
                      </div>
                      
                      {/* Quick Action */}
                      <Link href="/vid-info" className="block">
                        <Button variant="outline" size="sm" className="w-full">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          View Detailed Analytics
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-600 mb-4">Connect your channel to see performance insights</p>
                      <Link href="/connect">
                        <Button variant="outline" size="sm">
                          Get Started
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Connect Additional Channel Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Connect Additional Channel</h2>
                  <p className="text-sm text-gray-600 mt-1">Add another YouTube channel to your account</p>
                </div>
                <button
                  onClick={() => setShowConnectModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={isConnecting}
                >
                  <span className="text-gray-500 text-xl">&times;</span>
                </button>
              </div>

              {/* Channel Switching Status */}
              <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-sm font-medium text-gray-700">
                    Currently using: <span className="text-green-600 font-semibold">
                      {activeChannelId === youtubeChannel?.id 
                        ? youtubeChannel?.title 
                        : additionalChannels.find(ch => ch.id === activeChannelId)?.title || youtubeChannel?.title
                      }
                    </span>
                  </p>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  All actions will be performed on the active channel
                </p>
              </div>

              {/* Current Channels */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Connected Channels ({(youtubeChannel ? 1 : 0) + additionalChannels.length})</h3>
                <div className="space-y-2">
                  {/* Primary Channel */}
                  <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
                    activeChannelId === youtubeChannel?.id 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                  }`}>
                    <img
                      src={youtubeChannel?.thumbnail}
                      alt={youtubeChannel?.title}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{youtubeChannel?.title}</p>
                      <p className={`text-xs ${
                        activeChannelId === youtubeChannel?.id ? 'text-green-600 font-medium' : 'text-blue-600'
                      }`}>
                        {activeChannelId === youtubeChannel?.id ? 'Active Primary Channel' : 'Primary Channel'}
                      </p>
                    </div>
                    {activeChannelId !== youtubeChannel?.id && (
                      <button
                        onClick={() => {
                          if (youtubeChannel) {
                            setActiveChannelId(youtubeChannel.id)
                            localStorage.setItem('active_youtube_channel_id', youtubeChannel.id)
                            // Dispatch real-time event
                            window.dispatchEvent(new CustomEvent('channelSwitched', {
                              detail: { channelId: youtubeChannel.id, timestamp: Date.now() }
                            }))
                          }
                        }}
                        className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-600 text-xs rounded font-medium transition-colors"
                        title="Switch to primary channel"
                      >
                        Switch
                      </button>
                    )}
                  </div>
                  
                  {/* Additional Channels */}
                  {additionalChannels.map((channel, index) => (
                    <div key={channel.id} className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                      activeChannelId === channel.id ? 'bg-green-50 border border-green-200' : 'bg-gray-50 hover:bg-gray-100'
                    }`}>
                      <img
                        src={channel.thumbnail}
                        alt={channel.title}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{channel.title}</p>
                        <p className={`text-xs ${
                          activeChannelId === channel.id ? 'text-green-600 font-medium' : 'text-gray-600'
                        }`}>
                          {activeChannelId === channel.id ? 'Active Channel' : 'Additional Channel'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {activeChannelId !== channel.id && (
                          <button
                            onClick={() => {
                              setActiveChannelId(channel.id)
                              localStorage.setItem('active_youtube_channel_id', channel.id)
                              // Dispatch real-time event
                                window.dispatchEvent(new CustomEvent('channelSwitched', {
                                detail: { channelId: channel.id, timestamp: Date.now() }
                                }))
                              }}
                              className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-600 text-xs rounded font-medium transition-colors"
                              title="Switch to this channel"
                              >
                              Switch
                              </button>
                            )}
                        <button
                          onClick={() => {
                            const updated = additionalChannels.filter(ch => ch.id !== channel.id)
                            setAdditionalChannels(updated)
                            localStorage.setItem('additional_youtube_channels', JSON.stringify(updated))
                            localStorage.removeItem(`youtube_token_${channel.id}`)
                            // If removing active channel, switch to primary
                            if (activeChannelId === channel.id && youtubeChannel) {
                              setActiveChannelId(youtubeChannel.id)
                              localStorage.setItem('active_youtube_channel_id', youtubeChannel.id)
                            }
                          }}
                          className="p-1 hover:bg-red-100 rounded text-red-500 text-xs transition-colors"
                          title="Remove channel"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="mb-4 grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg">
                  <p className="text-xs text-blue-600 font-medium">Total Channels</p>
                  <p className="text-lg font-bold text-blue-700">{(youtubeChannel ? 1 : 0) + additionalChannels.length}</p>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg">
                  <p className="text-xs text-green-600 font-medium">Active Channel</p>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-sm font-bold text-green-700 truncate">
                      {activeChannelId === youtubeChannel?.id 
                        ? 'Primary'
                        : additionalChannels.find(ch => ch.id === activeChannelId)?.title?.split(' ')[0] || 'None'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="mb-4 grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg">
                  <p className="text-xs text-blue-600 font-medium">Total Channels</p>
                  <p className="text-lg font-bold text-blue-700">{(youtubeChannel ? 1 : 0) + additionalChannels.length}</p>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg">
                  <p className="text-xs text-green-600 font-medium">Active Channel</p>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-sm font-bold text-green-700 truncate">
                      {activeChannelId === youtubeChannel?.id 
                        ? 'Primary'
                        : additionalChannels.find(ch => ch.id === activeChannelId)?.title?.split(' ')[0] || 'None'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Connect Button */}
              <div className="space-y-4">
                <button
                  onClick={startYouTubeAuth}
                  disabled={isConnecting}
                  className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                    isConnecting 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 hover:shadow-lg transform hover:scale-[1.02]'
                  } text-white`}
                >
                  {isConnecting ? (
                    <>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span>Connecting to YouTube...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a2.999 2.999 0 0 0-2.109-2.109C19.647 3.5 12 3.5 12 3.5s-7.647 0-9.389.577A2.999 2.999 0 0 0 .502 6.186C.002 7.929.002 12.002.002 12.002s0 4.073.5 5.816a2.999 2.999 0 0 0 2.109 2.109C4.353 20.5 12 20.5 12 20.5s7.647 0 9.389-.573a2.999 2.999 0 0 0 2.109-2.109c.5-1.743.5-5.816.5-5.816s0-4.073-.5-5.816z"/>
                        <path fill="white" d="M9.748 15.348L15.5 12l-5.752-3.348v6.696z"/>
                      </svg>
                      <span>Connect Another YouTube Channel</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setShowConnectModal(false)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
                  disabled={isConnecting}
                >
                  Cancel
                </button>
              </div>

              {/* Info */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex gap-2">
                  <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-xs text-blue-800">
                    <p className="font-medium mb-1">Multiple Channel Benefits:</p>
                    <ul className="space-y-1 text-blue-700">
                      <li>• Manage multiple channels from one dashboard</li>
                      <li>• Switch between channels easily</li>
                      <li>• Centralized analytics and insights</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
