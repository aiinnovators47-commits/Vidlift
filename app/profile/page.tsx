"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import dynamic from 'next/dynamic'
import SharedSidebar from '@/components/shared-sidebar'
import {
  Play,
  Users,
  TrendingUp,
  Video,
  Eye,
  Plus,
  Youtube,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useSession } from "next-auth/react"

const NotificationBell = dynamic(() => import('@/components/notification-bell'), { ssr: false })

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

export default function ProfilePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [youtubeChannel, setYoutubeChannel] = useState<YouTubeChannel | null>(null)
  const [channelLoading, setChannelLoading] = useState(true)
  const [videos, setVideos] = useState<any[]>([])
  const [videosLoading, setVideosLoading] = useState(false)
  const [allChannels, setAllChannels] = useState<YouTubeChannel[]>([])
  const [selectedChannel, setSelectedChannel] = useState<YouTubeChannel | null>(null)
  const { data: session } = useSession()

  // Fetch YouTube channel data
  useEffect(() => {
    const fetchChannelData = async () => {
      try {
        if (typeof window === 'undefined') return
        
        setChannelLoading(true)
        const storedChannel = localStorage.getItem("youtube_channel")
        if (storedChannel) {
          setYoutubeChannel(JSON.parse(storedChannel))
        }
        
        const storedToken = localStorage.getItem("youtube_access_token")
        if (storedToken) {
          const response = await fetch(`/api/youtube/channel?access_token=${storedToken}`)
          const data = await response.json()
          
          if (data.success && data.channel) {
            setYoutubeChannel(data.channel)
          }
        }
      } catch (error) {
        console.error("Error fetching YouTube channel:", error)
      } finally {
        setChannelLoading(false)
      }
    }

    fetchChannelData()
  }, [])

  // Fetch videos when channel is loaded
  useEffect(() => {
    if (youtubeChannel) {
      setSelectedChannel(youtubeChannel)
      fetchVideos()
    }
  }, [youtubeChannel])

  // Load additional channels
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const channels: YouTubeChannel[] = []
    if (youtubeChannel) channels.push(youtubeChannel)

    const stored = localStorage.getItem('additional_youtube_channels')
    if (stored) {
      try {
        const extra = JSON.parse(stored)
        extra.forEach((ch: YouTubeChannel) => {
          if (!channels.find(c => c.id === ch.id)) channels.push(ch)
        })
      } catch (e) {
        console.error('Failed to parse additional_youtube_channels', e)
      }
    }

    setAllChannels(channels)
  }, [youtubeChannel])

  const fetchVideos = async () => {
    if (!youtubeChannel) return

    try {
      setVideosLoading(true)
      const storedToken = localStorage.getItem("youtube_access_token")
      let response
      if (storedToken) {
        response = await fetch(`/api/youtube/videos?mine=true&fetchAll=true&access_token=${storedToken}`)
      } else {
        response = await fetch(`/api/youtube/videos?channelId=${youtubeChannel.id}&fetchAll=true`)
      }
      const data = await response.json()

      if (data.success && data.videos) {
        setVideos(Array.isArray(data.videos) ? data.videos : [])
      }
    } catch (error) {
      console.error("Error fetching videos:", error)
    } finally {
      setVideosLoading(false)
    }
  }

  const formatNumber = (num: string | number | undefined): string => {
    if (!num && num !== 0) return "0"
    const n = typeof num === "string" ? parseInt(num) : num
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M"
    if (n >= 1000) return (n / 1000).toFixed(1) + "K"
    return n.toString()
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Fixed notification bell at top-right */}
      <div className="fixed top-4 right-4 z-50">
        <NotificationBell />
      </div>

      <div className="flex">
        {/* Shared Sidebar */}
        <SharedSidebar 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
          activePage="profile"
          isCollapsed={sidebarCollapsed}
          setIsCollapsed={setSidebarCollapsed}
        />

        {/* Main Content */}
        <main className={`flex-1 pt-16 md:pt-18 px-3 sm:px-4 md:px-6 pb-24 md:pb-12 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-72'}`}>
          <div className="max-w-7xl mx-auto space-y-6">
          {channelLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          ) : youtubeChannel ? (
            <>
              {/* Channel Info Card - Simple */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <img
                    src={youtubeChannel.thumbnail}
                    alt={youtubeChannel.title}
                    className="w-16 h-16 rounded-full object-cover shadow-md"
                  />
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">{youtubeChannel.title}</h1>
                    <p className="text-sm text-gray-600 mt-1">Channel ID: {youtubeChannel.id}</p>
                  </div>
                  <a
                    href={`https://youtube.com/channel/${youtubeChannel.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                  >
                    <Youtube className="w-4 h-4" />
                    View
                  </a>
                </div>
              </div>

              {/* Stats Cards - Simple & Clean (Dashboard Style) */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                <div className="bg-linear-to-br from-blue-50 to-white rounded-xl sm:rounded-2xl border border-blue-100 p-4 sm:p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-700">Subscribers</p>
                      <p className="text-2xl sm:text-4xl font-bold text-gray-900 mt-2 sm:mt-3">{formatNumber(youtubeChannel.subscriberCount)}</p>
                    </div>
                    <div className="ml-3 sm:ml-4">
                      <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg bg-blue-100 flex items-center justify-center shadow-sm shrink-0">
                        <span className="text-xl">👥</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-linear-to-br from-emerald-50 to-white rounded-xl sm:rounded-2xl border border-emerald-100 p-4 sm:p-6 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-700">Total Views</p>
                      <p className="text-2xl sm:text-4xl font-bold text-gray-900 mt-2 sm:mt-3">{formatNumber(youtubeChannel.viewCount)}</p>
                    </div>
                    <div className="ml-3 sm:ml-4">
                      <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg bg-emerald-100 flex items-center justify-center shadow-sm shrink-0">
                        <span className="text-xl">👁️</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-linear-to-br from-orange-50 to-white rounded-xl sm:rounded-2xl border border-orange-100 p-4 sm:p-6 shadow-sm hover:shadow-md hover:border-orange-200 transition-all duration-200 col-span-2 sm:col-span-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-700">Videos</p>
                      <p className="text-2xl sm:text-4xl font-bold text-gray-900 mt-2 sm:mt-3">{formatNumber(youtubeChannel.videoCount)}</p>
                    </div>
                    <div className="ml-3 sm:ml-4">
                      <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg bg-orange-100 flex items-center justify-center shadow-sm shrink-0">
                        <span className="text-xl">🎬</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connected Channels - Simplified */}
              {allChannels.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Connected Channels ({allChannels.length})</h3>
                    <button
                      onClick={() => {
                        const width = 600
                        const height = 700
                        const left = (window.screen.width - width) / 2
                        const top = (window.screen.height - height) / 2
                        window.open('/api/youtube/auth', 'YouTube OAuth', `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`)
                      }}
                      className="flex items-center gap-2 text-sm px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {allChannels.map((ch) => (
                      <div key={ch.id} className="bg-linear-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
                        <div className="flex items-center gap-3 mb-3">
                          <img src={ch.thumbnail} alt={ch.title} className="w-10 h-10 rounded-full object-cover" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900 truncate">{ch.title}</p>
                            <p className="text-xs text-gray-500">{formatNumber(ch.subscriberCount)} subs</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            try {
                              localStorage.setItem('selected_channel_id', ch.id)
                              setSelectedChannel(ch)
                            } catch (e) {
                              console.error(e)
                            }
                          }}
                          className={`text-xs w-full px-3 py-1 rounded-md border font-semibold transition-colors ${selectedChannel && selectedChannel.id === ch.id ? 'bg-green-50 text-green-600 border-green-300' : 'bg-indigo-50 text-indigo-600 border-indigo-300 hover:bg-indigo-100'}`}
                        >
                          {selectedChannel && selectedChannel.id === ch.id ? '✓ Active' : 'Use'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Videos Section - Simplified */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Latest Videos</h3>
                  {videos.length > 0 && (
                    <span className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-full">{videos.length}</span>
                  )}
                </div>

                {videosLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i}>
                        <Skeleton className="h-24 w-full rounded-lg mb-2" />
                        <Skeleton className="h-3 w-full mb-1" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                    ))}
                  </div>
                ) : videos.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {videos.slice(0, 8).map((video) => (
                      <a
                        key={video.id}
                        href={`https://youtube.com/watch?v=${video.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group"
                      >
                        <div className="bg-gray-100 border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all">
                          <div className="relative aspect-video bg-gray-200 overflow-hidden">
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                                <Play className="w-6 h-6 text-white fill-white ml-1" />
                              </div>
                            </div>
                          </div>

                          <div className="p-3">
                            <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-red-600 transition-colors mb-1">
                              {video.title}
                            </h4>
                            <p className="text-xs text-gray-600">{formatNumber(video.viewCount || 0)} views</p>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                    <Video className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No videos found</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
              <Youtube className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Channel Connected</h2>
              <p className="text-gray-600 mb-6">Connect your YouTube channel to view your profile</p>
              <Link href="/connect">
                <button className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg inline-flex items-center gap-2 transition-colors">
                  <Youtube className="w-5 h-5" />
                  Connect YouTube Channel
                </button>
              </Link>
            </div>
          )}

          </div>
        </main>
      </div>
    </div>
  )
}

