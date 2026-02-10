"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import SidebarButton from '@/components/ui/sidebar-button'
import { Button } from "@/components/ui/button"
import {
  Home,
  Users,
  TrendingUp,
  Video,
  Zap,
  Settings,
  LogOut,
  Menu,
  X,
  BarChart3,
  Eye,
  MessageSquare,
  User,
  GitCompare,
  Upload,
  Hash,
  ThumbsUp,
  Heart,
  Play,
  Plus,
  List,
  ToggleLeft,
  ToggleRight,
  PlayCircle,
  PauseCircle,
  Info,
  Shield
} from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

interface YouTubeVideo {
  id: string
  title: string
  thumbnail: string
  viewCount: string
  likeCount: string
  commentCount: string
  publishedAt: string
}

interface EngagementLog {
  id: string
  timestamp: string
  message: string
  type: 'comment' | 'like' | 'heart' | 'info' | 'error'
}

export default function AutoEngagementPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activePage, setActivePage] = useState('auto-engagement')
  const [isEnabled, setIsEnabled] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<string>('')
  const [videos, setVideos] = useState<YouTubeVideo[]>([])
  const [logs, setLogs] = useState<EngagementLog[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [processing, setProcessing] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const navLinks = [
    { icon: Home, label: "Dashboard", href: "/dashboard", id: "dashboard" },
    { icon: GitCompare, label: "Compare", href: "/compare", id: "compare" },
    { icon: Video, label: "Videos", href: "/videos", id: "videos" },
    { icon: Upload, label: "Bulk Upload", href: "/bulk-upload", id: "bulk-upload" },
    { icon: MessageSquare, label: "Auto Engagement", href: "/auto-engagement", id: "auto-engagement" },
  ]

  // Add a log entry
  const addLog = (message: string, type: EngagementLog['type'] = 'info') => {
    const newLog: EngagementLog = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    }
    setLogs(prev => [newLog, ...prev.slice(0, 49)]) // Keep only last 50 logs
  }

  // Process comments for the selected video
  const processComments = async () => {
    if (!selectedVideo || !isEnabled) return
    
    try {
      const storedToken = localStorage.getItem("youtube_access_token")
      if (!storedToken) {
        addLog("YouTube access token not found. Please connect your channel.", 'error')
        handleStopEngagement()
        return
      }
      
      addLog(`🔍 Checking for new comments on video...`, 'info')
      
      // Call our API endpoint to process comments
      const response = await fetch('/api/youtube/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId: selectedVideo,
          accessToken: storedToken
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        if (data.totalProcessed > 0) {
          addLog(`✅ Processed ${data.totalProcessed} comments`, 'info')
          data.processed.forEach((item: any) => {
            if (item.action === 'like') {
              addLog(`👍 Liked comment ${item.commentId}`, 'like')
            } else if (item.action === 'heart') {
              addLog(`❤️ Hearted comment ${item.commentId}`, 'heart')
            } else if (item.action === 'error') {
              addLog(`⚠️ Error processing comment ${item.commentId}: ${item.result}`, 'error')
            }
          })
        } else {
          addLog("⏳ No new comments to process", 'info')
        }
      } else {
        addLog(`❌ Failed to process comments: ${data.error}`, 'error')
      }
    } catch (error) {
      console.error("Error processing comments:", error)
      addLog(`❌ Error processing comments: ${(error as Error).message}`, 'error')
    }
  }

  // Fetch user's videos
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const storedToken = localStorage.getItem("youtube_access_token")
        const storedChannel = localStorage.getItem("youtube_channel")
        
        if (!storedToken) {
          addLog("YouTube access token not found. Please connect your channel.", 'error')
          return
        }
        
        if (!storedChannel) {
          addLog("YouTube channel not found. Please connect your channel.", 'error')
          return
        }
        
        let channelId;
        try {
          const channelData = JSON.parse(storedChannel);
          channelId = channelData.id;
        } catch (e) {
          addLog("Failed to parse channel data.", 'error')
          return;
        }

        const response = await fetch(`/api/youtube/videos?channelId=${channelId}&maxResults=50&access_token=${storedToken}`)
        const data = await response.json()

        if (data.success && Array.isArray(data.videos)) {
          setVideos(data.videos)
          if (data.videos.length > 0) {
            setSelectedVideo(data.videos[0].id)
          }
        } else {
          addLog("Failed to fetch videos: " + (data.error || "Unknown error"), 'error')
        }
      } catch (error) {
        console.error("Error fetching videos:", error)
        addLog("Error fetching videos: " + (error as Error).message, 'error')
      }
    }

    fetchVideos()
  }, [])

  const handleSignOut = async () => {
    setIsLoading(true)
    await signOut({ redirect: false })
    router.push("/")
  }

  const handleStartEngagement = async () => {
    if (!selectedVideo) {
      addLog("Please select a video first", 'error')
      return
    }

    setIsEnabled(true)
    setIsRunning(true)
    setProcessing(true)
    addLog(`🚀 Auto Engagement started for video: ${videos.find(v => v.id === selectedVideo)?.title || selectedVideo}`)
    
    // Process comments immediately
    await processComments()
    
    // Set up interval for continuous processing
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    
    intervalRef.current = setInterval(async () => {
      if (isEnabled) {
        await processComments()
      }
    }, 45000) // Process every 45 seconds
    
    addLog("⏳ Auto Engagement is now running. Checking for new comments every 45 seconds...")
    setProcessing(false)
  }

  const handleStopEngagement = () => {
    setIsEnabled(false)
    setIsRunning(false)
    
    // Clear the interval if it exists
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    addLog("⏹️ Auto Engagement stopped")
  }

  const handleNavClick = (href: string, id: string) => {
    if (id === "auto-engagement") {
      setSidebarOpen(false)
      return
    }
    router.push(href)
  }

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-100 pt-2 pb-2 px-4">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2"
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg group-hover:shadow-xl transition flex-shrink-0">
                <Play className="h-4 w-4 text-white fill-white" />
              </div>
              <span className="font-bold text-gray-900 text-sm">YouTubeAI Pro</span>
            </Link>
          </div>

          <div className="flex items-center space-x-2">
            {session && (
              <div
                role="button"
                title="Profile"
                onClick={() => router.push('/dashboard?page=profile')}
                className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 shadow-md"
              >
                <span className="text-white text-sm font-bold uppercase">
                  {session.user?.email?.substring(0, 2) || "U"}
                </span>
              </div>
            )}
            <Button
              onClick={handleSignOut}
              disabled={isLoading}
              className="flex items-center gap-2 bg-gradient-to-br from-blue-600 to-purple-600 text-white px-3 py-2 rounded-md"
              title="Sign Out"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden md:block sticky top-0 z-40 border-b border-gray-200 bg-white h-16">
        <div className="flex h-16 items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg group-hover:shadow-xl transition flex-shrink-0">
              <Play className="h-5 w-5 text-white fill-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">YouTubeAI Pro</span>
          </Link>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 border-l border-gray-200 pl-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{session?.user?.name || "Creator Studio"}</p>
                <p className="text-xs text-gray-500">{session?.user?.email || "Premium Plan"}</p>
              </div>
              <div
                role="button"
                title="Profile"
                onClick={() => router.push('/dashboard?page=profile')}
                className="cursor-pointer w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-blue-200 shadow-md flex items-center justify-center flex-shrink-0"
              >
                <span className="text-white text-sm font-semibold">
                  {session?.user?.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || "U"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 md:hidden z-30 top-16" onClick={() => setSidebarOpen(false)}></div>
        )}

        {/* Mobile Sidebar */}
        <aside
          className={`fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 md:hidden z-40 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <nav className="p-4 space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = activePage === link.id
              return (
                <SidebarButton
                  key={link.id}
                  id={link.id}
                  href={link.href}
                  label={link.label}
                  Icon={Icon}
                  isActive={isActive}
                  onClick={() => handleNavClick(link.href, link.id)}
                />
              )
            })}
          </nav>

          <div className="absolute bottom-4 left-4 right-4">
            <Button
              onClick={() => { setSidebarOpen(false); handleSignOut() }}
              disabled={isLoading}
              className="w-full justify-center bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold h-12 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Signing Out...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  <span>Sign Out</span>
                </>
              )}
            </Button>
          </div>
        </aside>

        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 border-r border-gray-200 bg-white fixed left-0 top-16 bottom-0 overflow-y-auto">
          <nav className="p-4 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = activePage === link.id
              return (
                <SidebarButton
                  key={link.id}
                  id={link.id}
                  href={link.href}
                  label={link.label}
                  Icon={Icon}
                  isActive={isActive}
                  onClick={() => handleNavClick(link.href, link.id)}
                />
              )
            })}
          </nav>

          <div className="absolute bottom-4 left-4 right-4">
            <Button
              onClick={handleSignOut}
              disabled={isLoading}
              className="w-full justify-center bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed h-12"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Signing Out...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  <span>Sign Out</span>
                </>
              )}
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-64 pb-16 md:pb-0">
          <div className="p-4 md:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6 md:mb-8 rounded-xl md:rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 border border-gray-200 p-4 md:p-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Auto Engagement</h1>
              </div>
              <p className="text-sm md:text-base text-gray-700">
                Automatically like and heart new comments on your YouTube videos
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Control Panel */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-600" />
                    Engagement Settings
                  </h2>

                  <div className="space-y-6">
                    {/* Enable Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <h3 className="font-semibold text-gray-900">Enable Auto Engagement</h3>
                        <p className="text-sm text-gray-600">Turn on automatic liking and hearting of comments</p>
                      </div>
                      <Button
                        onClick={isEnabled ? handleStopEngagement : handleStartEngagement}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
                          isEnabled 
                            ? "bg-red-100 text-red-700 hover:bg-red-200" 
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        {isEnabled ? (
                          <>
                            <PauseCircle className="w-5 h-5" />
                            Stop
                          </>
                        ) : (
                          <>
                            <PlayCircle className="w-5 h-5" />
                            Start
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Video Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Select YouTube Video
                      </label>
                      <div className="relative">
                        <select
                          value={selectedVideo}
                          onChange={(e) => setSelectedVideo(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          disabled={isEnabled}
                        >
                          <option value="">Choose a video...</option>
                          {videos.map((video) => (
                            <option key={video.id} value={video.id}>
                              {video.title} ({video.commentCount} comments)
                            </option>
                          ))}
                        </select>
                      </div>
                      {selectedVideo && (
                        <div className="mt-3 flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <img
                            src={videos.find(v => v.id === selectedVideo)?.thumbnail}
                            alt="Video thumbnail"
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {videos.find(v => v.id === selectedVideo)?.title}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {videos.find(v => v.id === selectedVideo)?.commentCount} comments
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <Button
                        onClick={handleStartEngagement}
                        disabled={isEnabled || !selectedVideo || processing}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3"
                      >
                        {processing ? (
                          <>
                            <span className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            Processing...
                          </>
                        ) : (
                          <>
                            <PlayCircle className="w-5 h-5 mr-2" />
                            Start Auto Engagement
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleStopEngagement}
                        disabled={!isEnabled}
                        variant="outline"
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50 font-semibold py-3"
                      >
                        <PauseCircle className="w-5 h-5 mr-2" />
                        Stop Engagement
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Logs Panel */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    Engagement Logs
                  </h2>

                  <div className="bg-gray-50 rounded-xl p-4 h-96 overflow-y-auto">
                    {logs.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-500">
                        <MessageSquare className="w-12 h-12 mb-3" />
                        <p>No engagement logs yet</p>
                        <p className="text-sm mt-1">Start the auto engagement to see logs here</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {logs.map((log) => (
                          <div 
                            key={log.id} 
                            className={`p-3 rounded-lg border ${
                              log.type === 'comment' ? 'bg-blue-50 border-blue-200' :
                              log.type === 'like' ? 'bg-green-50 border-green-200' :
                              log.type === 'heart' ? 'bg-pink-50 border-pink-200' :
                              log.type === 'error' ? 'bg-red-50 border-red-200' :
                              'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {log.type === 'comment' && <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />}
                              {log.type === 'like' && <ThumbsUp className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />}
                              {log.type === 'heart' && <Heart className="w-5 h-5 text-pink-600 flex-shrink-0 mt-0.5" />}
                              {log.type === 'error' && <span className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5">⚠️</span>}
                              {log.type === 'info' && <span className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5">ℹ️</span>}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900">{log.message}</p>
                                <p className="text-xs text-gray-500 mt-1">{log.timestamp}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Info Panel */}
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-600" />
                    How It Works
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">1</div>
                      <p className="text-gray-700">Select a YouTube video to monitor for new comments</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">2</div>
                      <p className="text-gray-700">Enable auto engagement to start monitoring</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">3</div>
                      <p className="text-gray-700">System automatically likes and hearts new comments</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">4</div>
                      <p className="text-gray-700">View real-time logs of all engagement activities</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6">
                  <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    Important Notes
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>System checks for new comments every 30-60 seconds</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Each comment is only liked/hearted once</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Engagement history is stored locally in your browser</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Respects YouTube's rate limits to avoid account restrictions</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}