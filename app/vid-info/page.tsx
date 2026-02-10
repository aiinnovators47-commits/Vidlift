"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import SharedSidebar from "@/components/shared-sidebar"
import UpgradeCard from "@/components/upgrade-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CREDIT_COSTS } from "@/models/Credit"

const NotificationBell = dynamic(() => import('@/components/notification-bell'), { ssr: false })
import { Badge } from "@/components/ui/badge"
import {
  Video, Calendar, Eye, ThumbsUp, MessageSquare, User, Hash, Clock,
  TrendingUp, BarChart3, Award, ExternalLink, FileText, Activity,
  TrendingDown, Target, Zap, CheckCircle, AlertCircle, Users, Globe,
  PlayCircle, Settings, Star, Bookmark, PieChart, Upload, Sun, Moon, MapPin, Link2, Heart,
  File, Tag, CalendarDays, BarChart, Play, Info
} from "lucide-react"

interface VideoData {
  id: string
  title: string
  description: string
  thumbnail: string
  publishedAt: string
  viewCount: string
  likeCount: string
  commentCount: string
  favoriteCount: string
  channelTitle: string
  channelId: string
  duration: string
  tags: string[]
  categoryId: string
  contentDetails?: any
  status?: any
  snippet?: any
}

interface DetailedVideoData extends VideoData {
  engagementRate: number
  viewsPerDay: number
  category: string
  uploadHour: number
  uploadDay: string
  daysOld: number
  performance: 'excellent' | 'good' | 'average' | 'poor'
}

interface ChannelData {
  id: string
  title: string
  description: string
  thumbnail: string
  publishedAt: string
  subscriberCount: string
  viewCount: string
  videoCount: string
  country?: string
  customUrl?: string
  defaultLanguage?: string
  keywords?: string
  topVideos?: DetailedVideoData[]
  recentVideos?: DetailedVideoData[]
  uploadSchedule?: any
  averageViews?: number
  engagementRate?: number
  growthRate?: number
  bestPerformingCategories?: string[]
  uploadTimes?: { hour: number; count: number }[]
  uploadDays?: { day: number; count: number }[]
  channelAge: number
  healthScore: number
  consistencyScore: number
  trendsScore: number
  mostPopularVideo?: DetailedVideoData | null
  leastPopularVideo?: DetailedVideoData | null
  viewsPerSubscriber?: number
  avgEngagementPerVideo?: number
  totalViralScore?: number
}

export default function VideoInfoPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [inputUrl, setInputUrl] = useState("")
  const [analysisType, setAnalysisType] = useState<'video' | 'channel'>('video')
  const [videoData, setVideoData] = useState<VideoData | null>(null)
  const [channelData, setChannelData] = useState<ChannelData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (status === "unauthenticated") {
    router.push("/signup")
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null)
  const [inputError, setInputError] = useState<string | null>(null)
  const [showFullDesc, setShowFullDesc] = useState(false)
  const [showAllVideos, setShowAllVideos] = useState(false)
  const [showUpgradeCard, setShowUpgradeCard] = useState(false)

  const extractVideoId = (url: string): string | null => {
    try {
      url = url.trim()
      let match = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/)
      if (match) return match[1]
      match = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/)
      if (match) return match[1]
      match = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
      if (match) return match[1]
      match = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/)
      if (match) return match[1]
      if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url
      return null
    } catch (e) {
      return null
    }
  }

  const extractChannelId = (url: string): string | null => {
    try {
      url = url.trim()
      // Channel ID format: UCxxxxxxxxxxxxxxxxxx (24 characters)
      let match = url.match(/youtube\.com\/channel\/([a-zA-Z0-9_-]{24})/)
      if (match) return match[1]
      // Custom URL format: @username or /c/username or /user/username
      match = url.match(/youtube\.com\/@([a-zA-Z0-9_.-]+)/)
      if (match) return `@${match[1]}`
      match = url.match(/youtube\.com\/c\/([a-zA-Z0-9_.-]+)/)
      if (match) return `c/${match[1]}`
      match = url.match(/youtube\.com\/user\/([a-zA-Z0-9_.-]+)/)
      if (match) return `user/${match[1]}`
      // Direct channel ID
      if (/^UC[a-zA-Z0-9_-]{22}$/.test(url)) return url
      // @username format
      if (/^@[a-zA-Z0-9_.-]+$/.test(url)) return url
      return null
    } catch (e) {
      return null
    }
  }

  const fetchVideoData = async () => {
    try {
      setLoading(true)
      setError(null)
      const videoId = extractVideoId(inputUrl)
      if (!videoId) throw new Error("Invalid YouTube video URL. Supports videos & Shorts")

      if (typeof window === 'undefined') return
      
      const accessToken = localStorage.getItem('youtube_access_token')
      // Use API key if access token is invalid or missing
      const response = await fetch(`/api/youtube/videosByIds?ids=${videoId}${accessToken ? `&access_token=${accessToken}` : ''}`)
      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data.error || 'Failed to fetch video'
        // If 401 with access token, retry without it
        if (response.status === 401 && accessToken) {
          console.warn('Access token invalid, retrying with API key')
          const retryResponse = await fetch(`/api/youtube/videosByIds?ids=${videoId}`)
          const retryData = await retryResponse.json()
          if (!retryResponse.ok) {
            throw new Error('Failed to fetch video. Please ensure the video URL is valid.')
          }
          if (!retryData.videos || retryData.videos.length === 0) throw new Error("Video not found")
          setVideoData(retryData.videos[0])
          return
        }
        if (errorMsg.includes('invalid') || errorMsg.includes('authentication') || errorMsg.includes('credentials')) {
          throw new Error('Failed to fetch video. The video may be private or deleted.')
        }
        throw new Error(errorMsg)
      }
      if (!data.videos || data.videos.length === 0) throw new Error("Video not found")

      const videoData = data.videos[0]
      setVideoData(videoData)
      // Do not fetch channel data when analyzing a video
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch video")
    } finally {
      setLoading(false)
    }
  }

  const resolveChannelHandle = async (handle: string): Promise<string> => {
    try {
      // If it's already a channel ID format, return as is
      if (handle.match(/^UC[a-zA-Z0-9_-]{22}$/)) {
        return handle
      }

      // Try to resolve the handle to a channel ID
      const response = await fetch(`/api/youtube/resolveHandle?handle=${encodeURIComponent(handle)}`)
      const data = await response.json()

      if (data.success && data.channelId) {
        return data.channelId
      } else {
        // If resolution fails, return the handle as-is and let the main API handle it
        return handle
      }
    } catch (error) {
      // If resolution endpoint doesn't exist, return handle as-is
      console.warn('Handle resolution failed, using fallback:', handle)
      return handle
    }
  }

  const fetchChannelData = async () => {
    try {
      setLoading(true)
      setError(null)
      setVideoData(null)
      let channelId = extractChannelId(inputUrl)
      if (!channelId) throw new Error("Invalid YouTube channel URL. Supports /channel/, /@username, /c/, /user/ formats")

      if (typeof window === 'undefined') return
      
      // Use the same API as compare page - channelById endpoint
      const response = await fetch(`/api/youtube/channelById?channelId=${encodeURIComponent(channelId)}`)
      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data.error || 'Failed to fetch channel data'
        throw new Error(errorMsg)
      }
      if (!data.success || !data.channel) throw new Error("Channel not found")

      // Use the resolved channel ID from the API response (not the original input)
      const resolvedChannelId = data.channel.id
      console.log('[vid-info] Resolved channel ID:', resolvedChannelId)

      // Fetch top videos to analyze categories and engagement using the RESOLVED channel ID
      const videosResponse = await fetch(`/api/youtube/best-videos?channelId=${encodeURIComponent(resolvedChannelId)}`)
      const videosData = await videosResponse.json()
      
      if (!videosResponse.ok) {
        console.error('[vid-info] best-videos API error:', videosResponse.status, videosData)
        // Continue without top videos but still process channel data
      }
      
      let channelDataWithAnalysis = { ...data.channel }
      
      console.log('[vid-info] Channel URL - videos data check:', videosData?.videos?.length || 0, 'videos', 'Response OK:', videosResponse.ok)
      
      if (videosResponse.ok && videosData.videos && videosData.videos.length > 0) {
        // Calculate best performing categories based on video views
        const categoryViews: { [key: string]: number } = {}
        videosData.videos.forEach((video: any) => {
          if (video.categoryId) {
            categoryViews[video.categoryId] = (categoryViews[video.categoryId] || 0) + video.viewCount
          }
        })
        
        // Sort by total views and get top 5 categories
        const bestCategories = Object.entries(categoryViews)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([categoryId]) => categoryId)
        
        channelDataWithAnalysis.bestPerformingCategories = bestCategories
        channelDataWithAnalysis.topVideos = videosData.videos.slice(0, 10)
        
        // Calculate channel engagement rate (average engagement across top videos)
        const totalLikes = videosData.videos.reduce((sum: number, v: any) => sum + v.likeCount, 0)
        const totalComments = videosData.videos.reduce((sum: number, v: any) => sum + v.commentCount, 0)
        const totalViews = videosData.videos.reduce((sum: number, v: any) => sum + v.viewCount, 0)
        const engagementRate = totalViews > 0 ? ((totalLikes + totalComments) / totalViews * 100) : 0
        channelDataWithAnalysis.engagementRate = engagementRate
        
        // Calculate average views per video
        const averageViews = videosData.videos.length > 0 
          ? Math.round(totalViews / videosData.videos.length)
          : 0
        channelDataWithAnalysis.averageViews = averageViews
      }
      
      // Calculate growth rate based on channel age and subscriber count
      const publishedDate = new Date(data.channel.publishedAt)
      const monthsSinceCreation = Math.max(1, Math.floor((Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24 * 30)))
      const subscribers = parseInt(data.channel.subscriberCount || '0')
      const growthRate = monthsSinceCreation > 0 ? (subscribers / monthsSinceCreation) / 100 : 0
      channelDataWithAnalysis.growthRate = growthRate

      console.log('[vid-info] Setting channel data with topVideos:', channelDataWithAnalysis.topVideos?.length || 0, 'videos')
      setChannelData(channelDataWithAnalysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch channel data")
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyze = async () => {
    setInputError(null)
    setError(null)

    if (!inputUrl.trim()) {
      setInputError('Please enter a YouTube URL')
      return
    }

    // Check credits before analyzing
    const creditCost = analysisType === 'video' ? CREDIT_COSTS.VIDEO_INFO : CREDIT_COSTS.CHANNEL_INFO
    
    try {
      const creditsRes = await fetch('/api/credits')
      if (!creditsRes.ok) {
        setError('Failed to check credits')
        return
      }
      
      const creditsData = await creditsRes.json()
      if (creditsData.credits < creditCost) {
        setShowUpgradeCard(true)
        return
      }
    } catch (err) {
      console.error('Error checking credits:', err)
      setError('Failed to verify credits')
      return
    }

    if (analysisType === 'video') {
      if (!extractVideoId(inputUrl)) {
        setInputError('Please enter a valid YouTube video or Shorts URL')
        return
      }
      
      // Deduct credits and fetch data
      try {
        const deductRes = await fetch('/api/credits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: creditCost, feature: 'video_info' })
        })
        
        const result = await deductRes.json()
        
        if (!deductRes.ok) {
          if (result.insufficient) {
            setShowUpgradeCard(true)
            return
          }
          throw new Error('Failed to deduct credits')
        }
        
        if (result.success) {
          // Dispatch event to update credits in sidebar
          window.dispatchEvent(new CustomEvent('creditsUpdated', { detail: { credits: result.credits } }))
        }
        
        fetchVideoData()
      } catch (err) {
        console.error('Error deducting credits:', err)
        setError('Failed to process credits')
      }
    } else {
      if (!extractChannelId(inputUrl)) {
        setInputError('Please enter a valid YouTube channel URL (e.g., /channel/ or @username)')
        return
      }
      
      // Deduct credits and fetch data
      try {
        const deductRes = await fetch('/api/credits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: creditCost, feature: 'channel_info' })
        })
        
        const result = await deductRes.json()
        
        if (!deductRes.ok) {
          if (result.insufficient) {
            setShowUpgradeCard(true)
            return
          }
          throw new Error('Failed to deduct credits')
        }
        
        if (result.success) {
          // Dispatch event to update credits in sidebar
          window.dispatchEvent(new CustomEvent('creditsUpdated', { detail: { credits: result.credits } }))
        }
        
        fetchChannelData()
      } catch (err) {
        console.error('Error deducting credits:', err)
        setError('Failed to process credits')
      }
    }
  }

  const formatNumber = (num: string | number) => {
    const n = typeof num === 'string' ? parseInt(num) : num
    if (!Number.isFinite(n)) return '0'
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return n.toString()
  }

  // Reusable card base to match Dashboard style
  const cardBase = 'group relative bg-white rounded-2xl border border-gray-200/60 p-4 sm:p-5 md:p-6 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1 overflow-hidden backdrop-blur-sm'

  const formatDuration = (duration: string) => { 
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return duration
    const h = parseInt(match[1] || '0'), m = parseInt(match[2] || '0'), s = parseInt(match[3] || '0')
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const calculateEngagementRate = () => {
    if (!videoData) return 0
    const views = parseInt(videoData.viewCount)
    const likes = parseInt(videoData.likeCount)
    const comments = parseInt(videoData.commentCount)
    return views > 0 ? (((likes + comments) / views) * 100).toFixed(2) : 0
  }

  const calculateLikeRatio = () => {
    if (!videoData) return 0
    const views = parseInt(videoData.viewCount)
    const likes = parseInt(videoData.likeCount)
    return views > 0 ? ((likes / views) * 100).toFixed(2) : 0
  }

  const calculateAvgViewsPerDay = () => {
    if (!videoData) return 0
    const views = parseInt(videoData.viewCount)
    const publishedDate = new Date(videoData.publishedAt)
    const daysSincePublished = Math.floor((Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24))
    return daysSincePublished > 0 ? Math.round(views / daysSincePublished) : views
  }

  const getPerformanceInsights = () => {
    if (!videoData) return { sections: [], viralScore: 0 }

    const engagementRate = parseFloat(String(calculateEngagementRate()))
    const likeRatio = parseFloat(String(calculateLikeRatio()))
    const views = parseInt(videoData.viewCount)
    const likes = parseInt(videoData.likeCount)
    const comments = parseInt(videoData.commentCount)
    const avgViewsPerDay = calculateAvgViewsPerDay()
    const publishedDate = new Date(videoData.publishedAt)
    const daysSincePublished = Math.floor((Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24))

    // Calculate viral score (0-100)
    let viralScore = 0
    if (views > 1000000) viralScore += 30
    else if (views > 100000) viralScore += 20
    else if (views > 10000) viralScore += 10

    if (engagementRate > 5) viralScore += 25
    else if (engagementRate > 2) viralScore += 15
    else if (engagementRate > 1) viralScore += 5

    if (likeRatio > 4) viralScore += 20
    else if (likeRatio > 2) viralScore += 10

    if (avgViewsPerDay > 10000) viralScore += 15
    else if (avgViewsPerDay > 1000) viralScore += 10
    else if (avgViewsPerDay > 100) viralScore += 5

    if (comments > 1000) viralScore += 10
    else if (comments > 100) viralScore += 5

    // Calculate content quality rankings (out of 100)

    // Thumbnail Rank (based on view count and engagement)
    let thumbnailRank = 0
    if (views > 1000000) thumbnailRank += 40 // High views suggest good thumbnail
    else if (views > 100000) thumbnailRank += 30
    else if (views > 10000) thumbnailRank += 20
    else if (views > 1000) thumbnailRank += 10

    if (engagementRate > 5) thumbnailRank += 30 // High engagement = compelling thumbnail
    else if (engagementRate > 3) thumbnailRank += 20
    else if (engagementRate > 1) thumbnailRank += 10

    if (likeRatio > 4) thumbnailRank += 30 // Positive sentiment = thumbnail matched expectations
    else if (likeRatio > 2) thumbnailRank += 20
    else if (likeRatio > 1) thumbnailRank += 10

    // Title Rank (based on length, views, and engagement)
    let titleRank = 0
    if (videoData.title.length >= 40 && videoData.title.length <= 60) titleRank += 30 // Optimal length
    else if (videoData.title.length >= 30 && videoData.title.length <= 70) titleRank += 20
    else titleRank += 10

    if (views > 100000) titleRank += 35 // High views = effective title
    else if (views > 10000) titleRank += 25
    else if (views > 1000) titleRank += 15

    const hasNumbers = /\d/.test(videoData.title)
    const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(videoData.title)
    const hasCapitals = /[A-Z]/.test(videoData.title)
    if (hasNumbers) titleRank += 10 // Numbers attract clicks
    if (hasEmoji) titleRank += 10 // Emojis stand out
    if (hasCapitals) titleRank += 5 // Proper capitalization

    if (engagementRate > 3) titleRank += 10 // Title delivered on promise

    // Description Rank (based on length, keywords, and SEO)
    let descriptionRank = 0
    if (videoData.description.length > 1000) descriptionRank += 40 // Comprehensive
    else if (videoData.description.length > 500) descriptionRank += 30
    else if (videoData.description.length > 200) descriptionRank += 20
    else if (videoData.description.length > 50) descriptionRank += 10

    const hasLinks = /https?:\/\//.test(videoData.description)
    const hasHashtags = /#\w+/.test(videoData.description)
    const hasTimestamps = /\d{1,2}:\d{2}/.test(videoData.description)
    if (hasLinks) descriptionRank += 15 // Good for engagement
    if (hasHashtags) descriptionRank += 15 // Good for discovery
    if (hasTimestamps) descriptionRank += 15 // Great for user experience

    if (videoData.tags && videoData.tags.length > 10) descriptionRank += 15 // Well optimized
    else if (videoData.tags && videoData.tags.length > 5) descriptionRank += 10

    // Detect if it's a Short
    const isShort = videoData.categoryId === "42" ||
      videoData.contentDetails?.duration?.match(/PT(\d+)S/) &&
      parseInt(videoData.contentDetails.duration.match(/PT(\d+)S/)?.[1] || "0") <= 60

    // Upload time analysis
    const uploadHour = publishedDate.getHours()
    const uploadDay = publishedDate.getDay() // 0 = Sunday, 6 = Saturday
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

    // Best upload times based on research (EST timezone typical)
    const bestUploadHours = [14, 15, 16, 17, 18, 19, 20] // 2 PM - 8 PM
    const bestUploadDays = [4, 5, 6, 0] // Thursday, Friday, Saturday, Sunday

    const uploadedAtGoodTime = bestUploadHours.includes(uploadHour)
    const uploadedOnGoodDay = bestUploadDays.includes(uploadDay)

    const sections = [
      {
        title: "🎯 Viral Potential Score",
        items: [
          {
            label: "Overall Viral Score",
            value: `${viralScore}/100`,
            description: viralScore > 70 ? "Exceptional viral performance! This video has all the markers of viral content." :
              viralScore > 50 ? "Strong performance with good viral potential. Room for optimization." :
                viralScore > 30 ? "Moderate performance. Several areas need improvement for viral growth." :
                  "Low viral indicators. Significant optimization needed.",
            type: viralScore > 70 ? 'success' : viralScore > 50 ? 'info' : 'warning'
          }
        ]
      },
      {
        title: "📊 Why This Video Got Views - Deep Analysis",
        items: [
          {
            label: "View Velocity",
            value: `${formatNumber(avgViewsPerDay)} views/day`,
            description: avgViewsPerDay > 10000 ? "Exceptional view velocity! The algorithm is heavily promoting this content. This indicates strong click-through rates and watch time." :
              avgViewsPerDay > 1000 ? "Strong daily view growth. The video is being recommended consistently, suggesting good audience retention." :
                avgViewsPerDay > 100 ? "Moderate growth rate. The video is getting some algorithmic push but could benefit from better optimization." :
                  "Slow growth. The video may not be triggering YouTube's recommendation algorithm effectively. Focus on improving thumbnails, titles, and first 30 seconds.",
            type: avgViewsPerDay > 1000 ? 'success' : avgViewsPerDay > 100 ? 'info' : 'warning'
          },
          {
            label: "Engagement Quality",
            value: `${engagementRate}% engagement rate`,
            description: engagementRate > 5 ? "Outstanding engagement! Viewers are highly invested. This signals to YouTube that your content is valuable, triggering more recommendations. The audience is not just watching but actively participating." :
              engagementRate > 2 ? "Good engagement levels. Viewers are interacting with your content, which helps with algorithmic promotion. Consider adding more calls-to-action to boost this further." :
                engagementRate > 1 ? "Below average engagement. Viewers are watching but not interacting. Add clear CTAs, ask questions, create controversy (tastefully), or add interactive elements." :
                  "Very low engagement. This is a red flag for the algorithm. Your content may be passive consumption. Add hooks, questions, polls, and strong CTAs to encourage interaction.",
            type: engagementRate > 5 ? 'success' : engagementRate > 2 ? 'info' : 'warning'
          },
          {
            label: "Audience Sentiment",
            value: `${likeRatio}% like ratio`,
            description: likeRatio > 4 ? "Exceptional like ratio! Your audience loves this content. This is a strong signal to YouTube that the content is high-quality and should be promoted more widely." :
              likeRatio > 2 ? "Positive audience reception. The content resonates well, though there's room to increase emotional impact and value delivery." :
                likeRatio > 1 ? "Mixed reception. Some viewers appreciate it, but many are neutral. Consider improving content quality, pacing, or value proposition." :
                  "Low like ratio suggests content isn't resonating. Review competitor videos in your niche to understand what audiences respond to positively.",
            type: likeRatio > 4 ? 'success' : likeRatio > 2 ? 'info' : 'warning'
          },
          {
            label: "Social Proof Factor",
            value: `${formatNumber(views)} total views`,
            description: views > 1000000 ? "Massive social proof! This view count creates a snowball effect - people click because others have watched. This is viral territory." :
              views > 100000 ? "Strong social proof. The high view count attracts more clicks. You've crossed the threshold where views beget more views." :
                views > 10000 ? "Building social proof. You're approaching the tipping point where view count starts attracting organic clicks." :
                  views > 1000 ? "Limited social proof. Focus on getting initial traction through promotion, communities, and optimization." :
                    "Very low views. Need aggressive promotion and optimization to build initial momentum.",
            type: views > 100000 ? 'success' : views > 10000 ? 'info' : 'warning'
          }
        ]
      },
      {
        title: "🎬 Content Quality Indicators",
        items: [
          {
            label: "Title Optimization",
            value: `${videoData.title.length} characters`,
            description: videoData.title.length >= 40 && videoData.title.length <= 60 ? "Perfect title length! Fully visible in search results and recommendations while being descriptive enough to attract clicks." :
              videoData.title.length > 60 ? `Title is too long (${videoData.title.length} chars). It will be truncated in search results, potentially hiding key information. Aim for 40-60 characters for maximum impact.` :
                videoData.title.length < 40 ? "Title is short. While this isn't always bad, you may be missing opportunities to include compelling keywords or emotional triggers. Consider expanding slightly." :
                  "Title length needs optimization.",
            type: videoData.title.length >= 40 && videoData.title.length <= 60 ? 'success' : 'warning'
          },
          {
            label: "Description Depth",
            value: `${videoData.description.length} characters`,
            description: videoData.description.length > 500 ? "Comprehensive description! This helps with SEO and provides context for viewers and the algorithm. Rich descriptions improve discoverability." :
              videoData.description.length > 200 ? "Decent description length. Consider expanding with timestamps, links, and more keywords to improve SEO." :
                videoData.description.length > 0 ? "Minimal description. You're missing a huge SEO opportunity. Add detailed descriptions, timestamps, relevant links, and keywords." :
                  "No description! This severely limits discoverability. Always add a detailed description with keywords.",
            type: videoData.description.length > 500 ? 'success' : videoData.description.length > 200 ? 'info' : 'warning'
          },
          {
            label: "Comment Activity",
            value: `${formatNumber(comments)} comments`,
            description: comments > 1000 ? "Exceptional comment activity! High comment counts signal active community engagement and boost algorithmic promotion significantly." :
              comments > 100 ? "Good comment engagement. The audience is participating in discussions, which YouTube rewards with better visibility." :
                comments > 10 ? "Moderate comment activity. Encourage more discussion by asking questions, creating debate, or responding to every comment." :
                  "Low comment count. Pin a comment asking a question, respond to all comments, and create content that sparks discussion.",
            type: comments > 1000 ? 'success' : comments > 100 ? 'info' : 'warning'
          }
        ]
      },
      {
        title: "🚀 Growth Trajectory Analysis",
        items: [
          {
            label: "Age vs Performance",
            value: `${daysSincePublished} days old`,
            description: daysSincePublished < 7 && views > 10000 ? "Explosive early growth! The video is performing exceptionally well in its first week. This often indicates viral potential." :
              daysSincePublished < 30 && views > 50000 ? "Strong first month performance. The video has momentum and is being pushed by the algorithm." :
                daysSincePublished > 365 && avgViewsPerDay > 100 ? "Evergreen content! Still getting consistent views after a year. This is the holy grail - sustainable, long-term traffic." :
                  daysSincePublished > 90 && avgViewsPerDay < 50 ? "Older video with declining views. Consider updating the title/thumbnail or creating a follow-up video." :
                    "Standard growth pattern for this age.",
            type: (daysSincePublished < 7 && views > 10000) || (daysSincePublished > 365 && avgViewsPerDay > 100) ? 'success' : 'info'
          },
          {
            label: "Momentum Indicator",
            value: avgViewsPerDay > 1000 ? "High Momentum" : avgViewsPerDay > 100 ? "Building Momentum" : "Low Momentum",
            description: avgViewsPerDay > 10000 ? "The video is in viral acceleration mode. Views are compounding rapidly. Capitalize on this by creating similar content immediately." :
              avgViewsPerDay > 1000 ? "Strong momentum. The algorithm is actively promoting this. Create follow-up content to ride this wave." :
                avgViewsPerDay > 100 ? "Moderate momentum. The video is growing steadily. Optimize and promote to increase velocity." :
                  "Momentum has stalled. Consider refreshing the thumbnail, updating the title, or promoting through other channels.",
            type: avgViewsPerDay > 1000 ? 'success' : avgViewsPerDay > 100 ? 'info' : 'warning'
          }
        ]
      },
      {
        title: "🎯 Optimization Recommendations",
        items: [
          {
            label: "Primary Action",
            value: viralScore > 70 ? "Scale & Replicate" : viralScore > 50 ? "Optimize & Promote" : "Rebuild & Relaunch",
            description: viralScore > 70 ? "This video is performing excellently. Create more content in this style immediately. Analyze what worked and replicate the formula. Consider creating a series or follow-up videos." :
              viralScore > 50 ? "Good foundation but needs optimization. Focus on improving CTR (thumbnail/title), watch time (hook/pacing), and engagement (CTAs). Promote through communities and social media." :
                viralScore > 30 ? "Significant improvements needed. Study top performers in your niche. Rebuild your content strategy focusing on hooks, value delivery, and audience retention." :
                  "Complete strategy overhaul required. Research your target audience deeply, study viral videos in your niche, and focus on creating genuinely valuable or entertaining content.",
            type: viralScore > 70 ? 'success' : viralScore > 50 ? 'info' : 'warning'
          },
          {
            label: "Engagement Boost Strategy",
            value: engagementRate > 3 ? "Maintain & Scale" : "Needs Improvement",
            description: engagementRate < 2 ? "Critical: Add strong CTAs every 2-3 minutes. Ask questions, create polls, pin engaging comments, respond to all comments within first hour, create controversy (tastefully), use pattern interrupts." :
              engagementRate < 4 ? "Add more interactive elements: timestamps, chapters, cards, end screens. Ask viewers to comment their opinions. Create debate-worthy content." :
                "Engagement is strong. Keep doing what you're doing and test new engagement tactics to push even higher.",
            type: engagementRate > 3 ? 'success' : 'warning'
          },
          {
            label: "SEO Enhancement",
            value: videoData.tags && videoData.tags.length > 10 ? "Well Optimized" : "Needs Work",
            description: !videoData.tags || videoData.tags.length === 0 ? "Critical: Add 10-15 relevant tags immediately. Use a mix of broad and specific keywords. Include your niche, topic, and related terms." :
              videoData.tags.length < 5 ? "Add more tags. Research what top videos in your niche use. Include variations of your main keywords." :
                videoData.tags.length < 10 ? "Good start but add 5-10 more tags. Use TubeBuddy or VidIQ to find high-performing keywords in your niche." :
                  "Tag optimization is solid. Ensure they're relevant and match search intent.",
            type: videoData.tags && videoData.tags.length > 10 ? 'success' : 'warning'
          }
        ]
      },
      {
        title: "💡 Advanced Insights",
        items: [
          {
            label: "Virality Factors Present",
            value: `${[
              views > 100000 ? "High views" : null,
              engagementRate > 3 ? "Strong engagement" : null,
              likeRatio > 3 ? "Positive sentiment" : null,
              avgViewsPerDay > 1000 ? "Fast growth" : null,
              comments > 500 ? "Active community" : null
            ].filter(Boolean).length}/5 factors`,
            description: "Viral videos typically have: (1) High view count creating social proof, (2) Strong engagement signaling quality, (3) Positive like ratio showing audience love, (4) Fast daily growth indicating algorithmic push, (5) Active comments showing community. " +
              (views > 100000 && engagementRate > 3 && likeRatio > 3 ? "You have the core viral factors! Focus on maintaining momentum." :
                "Missing key viral factors. Focus on the gaps to unlock viral potential."),
            type: [views > 100000, engagementRate > 3, likeRatio > 3, avgViewsPerDay > 1000, comments > 500].filter(Boolean).length >= 3 ? 'success' : 'warning'
          },
          {
            label: "Competitive Position",
            value: getCategoryName(videoData.categoryId),
            description: views > 100000 ? `In the ${getCategoryName(videoData.categoryId)} category, you're performing in the top tier. This view count puts you ahead of most creators in this space.` :
              views > 10000 ? `For ${getCategoryName(videoData.categoryId)}, you're in the middle pack. Study the top 10 videos in your niche to understand what separates good from great.` :
                `In ${getCategoryName(videoData.categoryId)}, you're still building traction. Research what's working for top creators and adapt their successful patterns.`,
            type: views > 100000 ? 'success' : views > 10000 ? 'info' : 'warning'
          },
          {
            label: "Audience Retention Signal",
            value: engagementRate > 4 ? "Excellent" : engagementRate > 2 ? "Good" : "Needs Work",
            description: "High engagement rate typically correlates with good watch time. " +
              (engagementRate > 4 ? "Your engagement suggests viewers are watching most of the video. The algorithm loves this and will promote your content more." :
                engagementRate > 2 ? "Decent retention implied. Focus on improving your hook (first 30 seconds) and pacing to keep viewers watching longer." :
                  "Low engagement often means viewers are leaving early. Analyze your audience retention graph in YouTube Studio and fix the drop-off points."),
            type: engagementRate > 4 ? 'success' : engagementRate > 2 ? 'info' : 'warning'
          }
        ]
      },
      {
        title: "📈 Next Steps for Maximum Growth",
        items: [
          {
            label: "Immediate Actions (Next 24 hours)",
            value: "Critical optimizations",
            description: [
              engagementRate < 2 ? "• Pin an engaging question in comments to boost engagement" : null,
              !videoData.tags || videoData.tags.length < 10 ? "• Add 10-15 relevant tags for better SEO" : null,
              videoData.description.length < 200 ? "• Expand description with keywords and timestamps" : null,
              "• Share in 3-5 relevant communities or social media platforms",
              "• Respond to all comments to boost engagement signals",
              likes < views * 0.02 ? "• Ask viewers to like if they found value (add CTA)" : null
            ].filter(Boolean).join("\n"),
            type: 'info'
          },
          {
            label: "This Week (7 days)",
            value: "Growth acceleration",
            description: [
              "• Create 2-3 follow-up videos on related topics to build momentum",
              "• Analyze which parts of the video have highest retention and replicate that style",
              avgViewsPerDay > 500 ? "• Ride the momentum - publish more frequently while algorithm is pushing you" : null,
              "• Collaborate with creators in your niche for cross-promotion",
              "• Create a compelling thumbnail A/B test (if views are declining)",
              "• Add cards and end screens to increase session time"
            ].filter(Boolean).join("\n"),
            type: 'info'
          },
          {
            label: "This Month (30 days)",
            value: "Sustainable growth strategy",
            description: [
              "• Analyze top 10 videos in your niche - what patterns do they share?",
              "• Build an email list or community to reduce algorithm dependency",
              "• Create a content calendar with proven video formats",
              "• Invest in better equipment/editing if views justify it",
              "• Study your YouTube Analytics deeply - which videos drive subscriptions?",
              "• Test different video lengths, formats, and styles to find your winning formula"
            ].join("\n"),
            type: 'success'
          }
        ]
      }
    ]

    return { sections, viralScore }
  }

  const getCategoryName = (categoryId: string) => {
    const categories: Record<string, string> = {
      "1": "Film & Animation", "10": "Music", "15": "Pets & Animals", "17": "Sports",
      "19": "Travel & Events", "20": "Gaming", "22": "People & Blogs", "23": "Comedy",
      "24": "Entertainment", "25": "News & Politics", "26": "Howto & Style",
      "27": "Education", "28": "Science & Technology", "42": "Shorts"
    }
    return categories[categoryId] || "Unknown"
  }

  const getBestUploadTimes = (channelData: ChannelData) => {
    if (!channelData.uploadTimes || !channelData.uploadDays) {
      return {
        bestHours: [14, 15, 16, 17, 18, 19, 20],
        bestDays: [4, 5, 6, 0],
        timeAnalysis: "Default recommendations based on general YouTube trends"
      }
    }

    const sortedHours = [...channelData.uploadTimes].sort((a, b) => b.count - a.count)
    const sortedDays = [...channelData.uploadDays].sort((a, b) => b.count - a.count)
    
    return {
      bestHours: sortedHours.slice(0, 5).map(h => h.hour),
      bestDays: sortedDays.slice(0, 4).map(d => d.day),
      timeAnalysis: `Based on ${channelData.videoCount} videos analysis`,
      topHour: sortedHours[0],
      topDay: sortedDays[0]
    }
  }

  const formatUploadTime = (hour: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:00 ${ampm}`
  }

  const formatDayName = (day: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[day]
  }

  const calculateChannelHealthScore = (channelData: ChannelData) => {
    let score = 0
    const maxScore = 100

    // Subscriber count scoring (25 points max)
    const subs = parseInt(channelData.subscriberCount || '0')
    if (subs >= 1000000) score += 25
    else if (subs >= 100000) score += 20
    else if (subs >= 10000) score += 15
    else if (subs >= 1000) score += 10
    else if (subs >= 100) score += 5

    // Video count and consistency (20 points max)
    const videoCount = parseInt(channelData.videoCount || '0')
    const channelAgeYears = channelData.channelAge || 1
    const videosPerYear = videoCount / channelAgeYears
    if (videosPerYear >= 52) score += 20 // Weekly uploads
    else if (videosPerYear >= 24) score += 15 // Bi-weekly
    else if (videosPerYear >= 12) score += 10 // Monthly
    else if (videosPerYear >= 6) score += 5 // Bi-monthly

    // Engagement rate (20 points max)
    const engagement = channelData.engagementRate || 0
    if (engagement >= 5) score += 20
    else if (engagement >= 3) score += 15
    else if (engagement >= 2) score += 10
    else if (engagement >= 1) score += 5

    // Average views vs subscribers ratio (15 points max)
    const avgViews = channelData.averageViews || 0
    const viewsToSubsRatio = subs > 0 ? (avgViews / subs) * 100 : 0
    if (viewsToSubsRatio >= 10) score += 15 // 10%+ of subscribers watch each video
    else if (viewsToSubsRatio >= 5) score += 12
    else if (viewsToSubsRatio >= 2) score += 8
    else if (viewsToSubsRatio >= 1) score += 4

    // Channel completeness (10 points max)
    let completeness = 0
    if (channelData.description && channelData.description.length > 100) completeness += 3
    if (channelData.keywords) completeness += 2
    if (channelData.customUrl) completeness += 2
    if (channelData.country) completeness += 1
    if (channelData.thumbnail) completeness += 2
    score += completeness

    // Growth potential (10 points max)
    const totalViews = parseInt(channelData.viewCount || '0')
    const viewsPerSub = subs > 0 ? totalViews / subs : 0
    if (viewsPerSub >= 100) score += 10
    else if (viewsPerSub >= 50) score += 7
    else if (viewsPerSub >= 20) score += 5
    else if (viewsPerSub >= 10) score += 3

    return Math.min(Math.max(score, 0), maxScore)
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-600'
    if (score >= 60) return 'from-blue-500 to-cyan-600'
    if (score >= 40) return 'from-yellow-500 to-orange-500'
    return 'from-red-500 to-pink-600'
  }

  const getHealthScoreLabel = (score: number) => {
    if (score >= 80) return '🚀 Excellent'
    if (score >= 60) return '⚡ Good'
    if (score >= 40) return '📈 Growing'
    return '🎯 Developing'
  }

  const toggleVideoDetails = (videoId: string) => {
    setExpandedVideo(expandedVideo === videoId ? null : videoId)
  }

  const getVideoPerformance = (video: DetailedVideoData, avgViews: number) => {
    const viewRatio = avgViews > 0 ? parseInt(video.viewCount) / avgViews : 1
    if (viewRatio >= 2) return 'excellent'
    if (viewRatio >= 1.2) return 'good'
    if (viewRatio >= 0.8) return 'average'
    return 'poor'
  }

  const formatVideoDetails = (video: DetailedVideoData) => {
    const publishDate = new Date(video.publishedAt)
    const now = new Date()
    const daysOld = Math.floor((now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24))
    const viewsPerDay = daysOld > 0 ? parseInt(video.viewCount) / daysOld : parseInt(video.viewCount)
    const engagement = (parseInt(video.likeCount) + parseInt(video.commentCount)) / parseInt(video.viewCount) * 100
    
    return {
      daysOld,
      viewsPerDay: Math.round(viewsPerDay),
      engagementRate: engagement.toFixed(2),
      uploadHour: publishDate.getHours(),
      uploadDay: formatDayName(publishDate.getDay())
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Fixed notification bell at top-right */}
      <div className="fixed top-4 right-4 z-50">
        <NotificationBell />
      </div>

      <div className="flex">
        {/* Shared Sidebar */}
        <SharedSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activePage="vid-info"
          isCollapsed={sidebarCollapsed}
          setIsCollapsed={setSidebarCollapsed}
        />

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
            <div className="mb-8 mt-8 md:mt-10">
              {/* Simplified Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                  Video Intelligence
                </h1>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  Analyze YouTube videos and channels with AI-powered insights
                </p>
              </div>
              
              {/* Simple Toggle */}
              <div className="flex justify-center mb-8">
                <div className="inline-flex p-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                  <button
                    onClick={() => {
                      setAnalysisType('video')
                      setChannelData(null)
                      setVideoData(null)
                      setError(null)
                      setExpandedVideo(null)
                      setInputError(null)
                    }}
                    className={`px-4 py-2 rounded-md font-medium transition-all ${
                      analysisType === 'video'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Video className="w-4 h-4 inline mr-2" />
                    Video
                  </button>
                  <button
                    onClick={() => {
                      setAnalysisType('channel')
                      setChannelData(null)
                      setVideoData(null)
                      setError(null)
                      setExpandedVideo(null)
                      setInputError(null)
                    }}
                    className={`px-4 py-2 rounded-md font-medium transition-all ${
                      analysisType === 'channel'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Users className="w-4 h-4 inline mr-2" />
                    Channel
                  </button>
                </div>
              </div>
            </div>

            {/* Input Card - Modern & Clean Design */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
              <div className="p-6 sm:p-8 md:p-10">
                {/* Header */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-3">
                    {analysisType === 'video' ? (
                      <>
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <Video className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Enter YouTube Video or Shorts URL</h2>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Enter YouTube Channel URL</h2>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Paste any YouTube URL to get started with AI-powered analysis</p>
                    <Badge variant="outline" className="bg-orange-50 border-orange-300 text-orange-700 font-semibold whitespace-nowrap">
                      {analysisType === 'video' ? CREDIT_COSTS.VIDEO_INFO : CREDIT_COSTS.CHANNEL_INFO} Credits
                    </Badge>
                  </div>
                </div>

                {/* Input Section */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <Input
                        placeholder={analysisType === 'video' 
                          ? "https://www.youtube.com/watch?v=... or /shorts/..."
                          : "https://www.youtube.com/@username or /channel/UCxxxx..."
                        }
                        value={inputUrl}
                        onChange={(e) => { setInputUrl(e.target.value); setInputError(null); setError(null) }}
                        className="w-full px-5 py-3 sm:py-4 text-base border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl shadow-sm focus:border-blue-500 focus:ring-0 transition-colors"
                        onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                      />
                      {inputError && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {inputError}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={handleAnalyze}
                      disabled={loading || !inputUrl.trim()}
                      className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-semibold shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mr-2" />
                          <span className="hidden sm:inline">Analyzing...</span>
                          <span className="sm:hidden">Analyzing</span>
                        </>
                      ) : (
                        <>
                          <Activity className="w-5 h-5 mr-2" />
                          <span className="hidden sm:inline">Analyze Now</span>
                          <span className="sm:hidden">Analyze</span>
                        </>
                      )}
                    </Button>
                  </div>
                  {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{error}</span>
                      </div>
                      <Button
                        onClick={handleAnalyze}
                        disabled={loading || !inputUrl.trim()}
                        size="sm"
                        variant="outline"
                        className="ml-auto whitespace-nowrap border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40"
                      >
                        {loading ? 'Retrying...' : 'Retry'}
                      </Button>
                    </div>
                  )}

                  {/* How to Use Guide Card */}
                  <Card className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 shadow-sm mt-6">
                    <CardContent className="p-5">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">How to Use</h4>
                          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white mb-1">📺 For Top Performing Videos:</p>
                              <p className="text-xs ml-5">Use a <span className="font-semibold">Channel ID</span> or <span className="font-semibold">Channel Handle</span></p>
                              <div className="ml-5 mt-1 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                <div>✅ <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">@channelname</code></div>
                                <div>✅ <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">UCxxxxxxxxxxxxxxxxxxxxxX</code></div>
                              </div>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white mb-1">🎬 For Video Analysis:</p>
                              <p className="text-xs ml-5">Paste the full video URL</p>
                              <div className="ml-5 mt-1 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                <div>✅ <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">youtube.com/watch?v=videoID</code></div>
                                <div>✅ <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">youtube.com/shorts/videoID</code></div>
                              </div>
                            </div>
                            <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                              <p className="font-medium text-gray-900 dark:text-white mb-1">💡 Tip:</p>
                              <p className="text-xs ml-5">Find channel ID in YouTube URL: <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">youtube.com/@username</code> or <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">/channel/UCxxx</code></p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Loading State - Clean */}
            {loading && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-6 sm:p-8">
                  <div className="flex flex-col md:flex-row gap-6">
                    <Skeleton className="w-full md:w-1/3 aspect-video rounded-xl" />
                    <div className="flex-1 space-y-4">
                      <Skeleton className="h-8 w-3/4 rounded-lg" />
                      <Skeleton className="h-4 w-full rounded-lg" />
                      <Skeleton className="h-4 w-2/3 rounded-lg" />
                      <div className="pt-4 flex gap-3">
                        <Skeleton className="h-10 w-20 rounded-lg" />
                        <Skeleton className="h-10 w-20 rounded-lg" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {videoData && (
              <Tabs defaultValue="overview" className="space-y-6 mt-8">
                <TabsList className="w-full flex gap-2 overflow-x-auto snap-x snap-mandatory no-scrollbar mb-6 sm:grid sm:grid-cols-2 sm:gap-2 sm:overflow-visible p-0 bg-transparent">
                  <TabsTrigger 
                    value="overview" 
                    className="shrink-0 snap-start flex items-center justify-center h-10 min-w-32 sm:min-w-0 px-3 sm:px-4 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-150 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-500 data-[state=active]:shadow-lg"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    <span>Overview</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      <div className="w-full md:w-2/5 bg-black aspect-video md:aspect-auto">
                        <img
                          src={videoData.snippet?.thumbnails?.maxres?.url || videoData.thumbnail}
                          alt={videoData.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 p-5 sm:p-6 md:p-8 bg-white dark:bg-gray-800">
                        <div className="flex items-start justify-between mb-6 flex-col sm:flex-row gap-4">
                          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex-1 line-clamp-2">{videoData.title}</h2>
                          <a href={`https://www.youtube.com/watch?v=${videoData.id}`} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                            <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                              <ExternalLink className="w-4 h-4" />
                              <span className="hidden sm:inline">Watch</span>
                            </Button>
                          </a>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <User className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            <span className="font-medium text-gray-700 dark:text-gray-300 truncate">{videoData.channelTitle}</span>
                          </div>
                          <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                            <span className="font-medium text-gray-700 dark:text-gray-300">{new Date(videoData.publishedAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                            <span className="font-medium text-gray-700 dark:text-gray-300">{videoData.contentDetails ? formatDuration(videoData.contentDetails.duration) : videoData.duration}</span>
                          </div>
                          <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <Award className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                            <span className="font-medium text-gray-700 dark:text-gray-300 text-xs">{getCategoryName(videoData.categoryId)}</span>
                          </div>
                          {videoData.status && (
                            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                              <Badge variant={videoData.status.privacyStatus === 'public' ? 'default' : 'secondary'} className="text-xs">
                                {videoData.status.privacyStatus}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">Views</p>
                          <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mt-2">{formatNumber(videoData.viewCount)}</p>
                        </div>
                        <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">Likes</p>
                          <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mt-2">{formatNumber(videoData.likeCount)}</p>
                        </div>
                        <div className="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <ThumbsUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">Comments</p>
                          <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mt-2">{formatNumber(videoData.commentCount)}</p>
                        </div>
                        <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                          <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">Engagement</p>
                          <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mt-2">{calculateEngagementRate()}%</p>
                        </div>
                        <div className="p-2.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                          <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Analysis Metrics - Clean White Card */}
                  <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left side - Key metrics */}
                        <div className="space-y-6">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">Avg views / day</p>
                            <p className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">{formatNumber(calculateAvgViewsPerDay())} <span className="text-lg text-gray-500">/ day</span></p>
                          </div>

                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">Like Ratio</p>
                            <p className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">{calculateLikeRatio()}<span className="text-lg text-gray-500">%</span></p>
                          </div>

                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">Comment Ratio</p>
                            <p className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">{(() => {
                              const views = parseInt(videoData.viewCount)
                              const comments = parseInt(videoData.commentCount)
                              return views > 0 ? ((comments / views) * 100).toFixed(2) : 0
                            })()}<span className="text-lg text-gray-500">%</span></p>
                          </div>

                          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">Days since publish</p>
                            <p className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">{Math.floor((Date.now() - new Date(videoData.publishedAt).getTime()) / (1000*60*60*24))}</p>
                          </div>

                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">Total Views</p>
                            <p className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">{formatNumber(videoData.viewCount)}</p>
                          </div>
                        </div>

                        {/* Right side - Comparison chart */}
                        <div className="flex flex-col justify-between">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-6">Metric Comparison</p>
                            <div className="space-y-5">
                              {(() => {
                                const v = parseInt(videoData.viewCount || '0')
                                const l = parseInt(videoData.likeCount || '0')
                                const c = parseInt(videoData.commentCount || '0')
                                const engagement = (l + c) / (v || 1)
                                const max = Math.max(1, v, l, c, engagement * v)
                                const norm = (n: number) => Math.round((n / max) * 100)

                                return (
                                  <>
                                    <div>
                                      <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">Views</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatNumber(v)}</p>
                                      </div>
                                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 dark:bg-blue-600 transition-all duration-500" style={{width: `${norm(v)}%`}} />
                                      </div>
                                    </div>

                                    <div>
                                      <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">Likes</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatNumber(l)}</p>
                                      </div>
                                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 dark:bg-green-600 transition-all duration-500" style={{width: `${norm(l)}%`}} />
                                      </div>
                                    </div>

                                    <div>
                                      <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">Comments</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatNumber(c)}</p>
                                      </div>
                                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-500 dark:bg-purple-600 transition-all duration-500" style={{width: `${norm(c)}%`}} />
                                      </div>
                                    </div>

                                    <div>
                                      <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">Engagement</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{(engagement * 100).toFixed(2)}%</p>
                                      </div>
                                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-orange-500 dark:bg-orange-600 transition-all duration-500" style={{width: `${norm(engagement * v)}%`}} />
                                      </div>
                                    </div>
                                  </>
                                )
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Moved Metadata cards into Overview */}
                  <div className="mt-4 space-y-4">
                    <Card className="border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 bg-white">
                      <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-gray-900">
                          <FileText className="w-5 h-5 text-gray-600" />
                          Video Description
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                          {(() => {
                            const text = videoData.description || "No description available"

                            // Regexes
                            const combined = /(\b(?:\d{1,2}:){0,2}\d{1,2}:\d{2}\b)|(https?:\/\/[^\s]+)|(#\w+)/g

                            const parseTimestampToSeconds = (ts: string) => {
                              const parts = ts.split(':').map(p => parseInt(p, 10))
                              if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
                              if (parts.length === 2) return parts[0] * 60 + parts[1]
                              return parseInt(ts, 10) || 0
                            }

                            const renderLine = (line: string, idx: number) => {
                              const nodes: any[] = []
                              let lastIndex = 0
                              let match: RegExpExecArray | null
                              while ((match = combined.exec(line)) !== null) {
                                const matchIndex = match.index
                                if (matchIndex > lastIndex) {
                                  nodes.push(line.slice(lastIndex, matchIndex))
                                }

                                const [full] = match
                                if (/^https?:\/\//.test(full)) {
                                  nodes.push(
                                    <a key={idx + 'u' + matchIndex} href={full} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                                      {full}
                                    </a>
                                  )
                                } else if (/^#/.test(full)) {
                                  const tag = full.slice(1)
                                  nodes.push(
                                    <a key={idx + 'h' + matchIndex} href={`https://www.youtube.com/hashtag/${tag}`} target="_blank" rel="noopener noreferrer" className="inline-block bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs mr-1">
                                      {full}
                                    </a>
                                  )
                                } else if (/^\d/.test(full)) {
                                  const seconds = parseTimestampToSeconds(full)
                                  nodes.push(
                                    <a key={idx + 't' + matchIndex} href={`https://www.youtube.com/watch?v=${videoData.id}&t=${seconds}s`} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-mono text-sm underline">
                                      {full}
                                    </a>
                                  )
                                } else {
                                  nodes.push(full)
                                }

                                lastIndex = matchIndex + full.length
                              }

                              if (lastIndex < line.length) {
                                nodes.push(line.slice(lastIndex))
                              }

                              return <p key={idx} className="text-gray-800 leading-relaxed">{nodes}</p>
                            }

                            const lines = text.split('\n')
                            const MAX_LINES = 8
                            const shouldTruncate = lines.length > MAX_LINES && !showFullDesc
                            const shownLines = shouldTruncate ? lines.slice(0, MAX_LINES) : lines

                            return (
                              <div>
                                <div className="space-y-2">
                                  {shownLines.map((l, i) => renderLine(l, i))}
                                </div>

                                {shouldTruncate && (
                                  <div className="mt-2">
                                    <button onClick={() => setShowFullDesc(true)} className="text-sm text-blue-600 underline">Show more</button>
                                  </div>
                                )}

                                {!shouldTruncate && lines.length > MAX_LINES && (
                                  <div className="mt-2">
                                    <button onClick={() => setShowFullDesc(false)} className="text-sm text-blue-600 underline">Show less</button>
                                  </div>
                                )}
                              </div>
                            )
                          })()}
                        </div>
                      </CardContent>
                    </Card>

                    {videoData.tags && videoData.tags.length > 0 && (
                      <Card className="border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 bg-white">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center gap-2 text-gray-900">
                            <Tag className="w-5 h-5 text-gray-600" />
                            Tags & Keywords ({videoData.tags.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {videoData.tags.map((tag, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="px-3 py-1.5 text-sm bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  <Card className={`${cardBase} border-blue-100 mt-6`}>
                    <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-start">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white rounded-xl p-4 border border-gray-100">
                          <p className="text-sm text-gray-500">Avg views / day</p>
                          <p className="text-2xl font-bold text-gray-900">{calculateAvgViewsPerDay()} / day</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-100">
                          <p className="text-sm text-gray-500">Like Ratio</p>
                          <p className="text-2xl font-bold text-gray-900">{calculateLikeRatio()}%</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-100">
                          <p className="text-sm text-gray-500">Days since publish</p>
                          <p className="text-2xl font-bold text-gray-900">{Math.floor((Date.now() - new Date(videoData.publishedAt).getTime()) / (1000*60*60*24))}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-100">
                          <p className="text-sm text-gray-500">Views</p>
                          <p className="text-2xl font-bold text-gray-900">{formatNumber(videoData.viewCount)}</p>
                        </div>
                      </div>

                      <div className="w-full md:w-1/3 bg-white rounded-xl p-4 border border-gray-100">
                        <p className="text-sm text-gray-500 mb-2">Metric Comparison</p>
                        <div className="flex items-end gap-3 h-36">
                          {(() => {
                            const v = parseInt(videoData.viewCount || '0')
                            const l = parseInt(videoData.likeCount || '0')
                            const c = parseInt(videoData.commentCount || '0')
                            const max = Math.max(1, v, l, c)
                            const norm = (n: number) => Math.round((n / max) * 100)
                            return (
                              <>
                                <div className="flex-1 flex flex-col items-center">
                                  <div className="w-10 bg-blue-600 rounded-t-md" style={{height: `${norm(v)}%`}} />
                                  <p className="text-xs text-gray-600 mt-2">Views</p>
                                </div>
                                <div className="flex-1 flex flex-col items-center">
                                  <div className="w-10 bg-green-600 rounded-t-md" style={{height: `${norm(l)}%`}} />
                                  <p className="text-xs text-gray-600 mt-2">Likes</p>
                                </div>
                                <div className="flex-1 flex flex-col items-center">
                                  <div className="w-10 bg-purple-600 rounded-t-md" style={{height: `${norm(c)}%`}} />
                                  <p className="text-xs text-gray-600 mt-2">Comments</p>
                                </div>
                              </>
                            )
                          })()}
                        </div>

                        <div className="mt-4">
                          <p className="text-xs text-gray-500">Engagement</p>
                          <div className="w-full bg-gray-100 h-3 rounded-full mt-2 overflow-hidden">
                            <div className="h-full bg-orange-500" style={{width: `${calculateEngagementRate()}%`}} />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                </TabsContent>


                <TabsContent value="insights" className="space-y-6">
                  {(() => {
                    const insights = getPerformanceInsights()
                    const videoDetails = formatVideoDetails(videoData as DetailedVideoData)
                    return (
                      <div className="space-y-6">
                        {/* Key Performance Metrics - Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-white rounded-2xl border border-gray-200/60 p-4 sm:p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs sm:text-sm text-gray-600 font-medium">Daily Views</p>
                                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{videoDetails.viewsPerDay.toLocaleString()}</p>
                              </div>
                              <div className="p-2.5 bg-purple-100 rounded-xl">
                                <TrendingUp className="w-5 h-5 text-purple-600" />
                              </div>
                            </div>
                          </div>

                          <div className="bg-white rounded-2xl border border-gray-200/60 p-4 sm:p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs sm:text-sm text-gray-600 font-medium">Like Ratio</p>
                                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{calculateLikeRatio()}%</p>
                              </div>
                              <div className="p-2.5 bg-red-100 rounded-xl">
                                <Heart className="w-5 h-5 text-red-600" />
                              </div>
                            </div>
                          </div>

                          <div className="bg-white rounded-2xl border border-gray-200/60 p-4 sm:p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs sm:text-sm text-gray-600 font-medium">Video Age</p>
                                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{videoDetails.daysOld} d</p>
                              </div>
                              <div className="p-2.5 bg-indigo-100 rounded-xl">
                                <Calendar className="w-5 h-5 text-indigo-600" />
                              </div>
                            </div>
                          </div>

                          <div className="bg-white rounded-2xl border border-gray-200/60 p-4 sm:p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs sm:text-sm text-gray-600 font-medium">Engagement</p>
                                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{calculateEngagementRate()}%</p>
                              </div>
                              <div className="p-2.5 bg-yellow-100 rounded-xl">
                                <Zap className="w-5 h-5 text-yellow-600" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actionable Recommendations */}
                        <Card className="border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 bg-white">
                          <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-gray-900">
                              <Target className="w-5 h-5 text-purple-600" />
                              Key Recommendations
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {/* Audience Insights */}
                              <Card className="border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 bg-white">
                                <CardHeader className="pb-3">
                                  <CardTitle className="flex items-center gap-2 text-gray-900">
                                    <Users className="w-5 h-5 text-blue-600" />
                                    Audience Analysis
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <ul className="space-y-2 text-gray-700">
                                    <li className="flex items-start gap-2">
                                      <Eye className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                                      <span>This video attracts viewers interested in {videoData.categoryId ? getCategoryName(videoData.categoryId).toLowerCase() : 'similar content'}</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                      <TrendingUp className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                      <span>High engagement suggests strong viewer retention and interest</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                      <Heart className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                      <span>Audience shows emotional connection through likes and comments</span>
                                    </li>
                                  </ul>
                                </CardContent>
                              </Card>

                              {/* Content Strategy */}
                              <Card className="border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 bg-white">
                                <CardHeader className="pb-3">
                                  <CardTitle className="flex items-center gap-2 text-gray-900">
                                    <Zap className="w-5 h-5 text-green-600" />
                                    Content Strategy
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <ul className="space-y-2 text-gray-700">
                                    <li className="flex items-start gap-2">
                                      <Play className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                      <span>Create more {videoData.categoryId ? getCategoryName(videoData.categoryId).toLowerCase() : 'similar'} content to build audience loyalty</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                      <Clock className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                                      <span>Optimal posting time: {videoDetails.uploadDay} at {formatUploadTime(videoDetails.uploadHour)} for maximum reach</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                      <Hash className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                                      <span>Use relevant tags like {videoData.tags?.slice(0, 3).join(', ') || 'popular keywords'} to improve discoverability</span>
                                    </li>
                                  </ul>
                                </CardContent>
                              </Card>

                              {/* Performance Insights */}
                              <Card className="border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 bg-white">
                                <CardHeader className="pb-3">
                                  <CardTitle className="flex items-center gap-2 text-gray-900">
                                    <BarChart3 className="w-5 h-5 text-purple-600" />
                                    Performance Insights
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <ul className="space-y-2 text-gray-700">
                                    <li className="flex items-start gap-2">
                                      <Award className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                                      <span>Current performance: {calculateEngagementRate()}% engagement rate indicates {Number(calculateEngagementRate()) > 5 ? 'strong' : 'moderate'} audience interest</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                      <Calendar className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                                      <span>Video age ({videoDetails.daysOld} days) shows {videoDetails.daysOld < 30 ? 'recent momentum' : 'sustained performance'}</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                      <TrendingUp className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                      <span>Daily average of {videoDetails.viewsPerDay.toLocaleString()} views demonstrates consistent organic growth</span>
                                    </li>
                                  </ul>
                                </CardContent>
                              </Card>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )
                  })()}
                </TabsContent>
              </Tabs>
            )}

            {/* Channel Data Display - Only shown when analyzing channels, not videos */}
            {channelData && analysisType === 'channel' && (
              <Tabs defaultValue="overview" className="space-y-6 mt-8">
                <TabsList className="grid w-full grid-cols-4 gap-1 sm:gap-2 p-0 bg-transparent rounded-xl">
                  <TabsTrigger 
                    value="overview" 
                    className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-500 data-[state=active]:shadow-lg transition-all duration-200 px-1 sm:px-3 py-2 sm:py-2.5 rounded-lg font-semibold flex items-center justify-center text-center text-xs sm:text-sm"
                  >
                    <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                    <span>Overview</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="analytics" 
                    className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-500 data-[state=active]:shadow-lg transition-all duration-200 px-1 sm:px-3 py-2 sm:py-2.5 rounded-lg font-semibold flex items-center justify-center text-center text-xs sm:text-sm"
                  >
                    <PieChart className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Analytics</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="schedule" 
                    className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-500 data-[state=active]:shadow-lg transition-all duration-200 px-1 sm:px-3 py-2 sm:py-2.5 rounded-lg font-semibold flex items-center justify-center text-center text-xs sm:text-sm"
                  >
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Best Times</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="videos" 
                    className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-500 data-[state=active]:shadow-lg transition-all duration-200 px-1 sm:px-3 py-2 sm:py-2.5 rounded-lg font-semibold flex items-center justify-center text-center text-xs sm:text-sm"
                  >
                    <PlayCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Top Videos</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  {/* Channel Header Card - Simple */}
                  <Card className="border border-gray-200 rounded-2xl shadow-sm overflow-hidden bg-white">
                    <CardContent className="p-5 sm:p-6">
                      <div className="flex flex-col gap-5">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="shrink-0 flex items-center justify-center">
                            <img
                              src={channelData.thumbnail}
                              alt={channelData.title}
                              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border border-gray-200"
                            />
                          </div>

                          <div className="flex-1 min-w-0 text-center sm:text-left">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                              {channelData.title}
                            </h2>
                            <div className="mt-1 flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-sm text-gray-600">
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                Joined {new Date(channelData.publishedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                              </span>
                              {channelData.customUrl && (
                                <span className="text-gray-500">{channelData.customUrl}</span>
                              )}
                              {channelData.country && (
                                <span className="inline-flex items-center gap-1 text-gray-500">
                                  <MapPin className="w-4 h-4" />
                                  {channelData.country}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0">
                            <a
                              href={`https://www.youtube.com/channel/${channelData.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button size="sm" className="gap-2">
                                <ExternalLink className="w-4 h-4" />
                                Visit Channel
                              </Button>
                            </a>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-center">
                            <div className="text-base sm:text-lg font-bold text-gray-900">
                              {formatNumber(channelData.subscriberCount || '0')}
                            </div>
                            <div className="text-xs text-gray-600">Subscribers</div>
                          </div>
                          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-center">
                            <div className="text-base sm:text-lg font-bold text-gray-900">
                              {formatNumber(channelData.viewCount || '0')}
                            </div>
                            <div className="text-xs text-gray-600">Total Views</div>
                          </div>
                          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-center">
                            <div className="text-base sm:text-lg font-bold text-gray-900">
                              {formatNumber(channelData.videoCount || '0')}
                            </div>
                            <div className="text-xs text-gray-600">Videos</div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-700" />
                            About This Channel
                          </h3>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {channelData.description || "No channel description available."}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Enhanced Channel Overview - Comprehensive Analytics */}
                  <div className="space-y-6">
                    {/* Main Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <Card className="border border-gray-200 rounded-xl bg-white shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-gray-100 rounded-lg border border-gray-200">
                              <Users className="w-5 h-5 text-gray-700" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 font-medium">Subscribers</p>
                              <p className="text-lg font-bold text-gray-900">{formatNumber(channelData.subscriberCount || '0')}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border border-gray-200 rounded-xl bg-white shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-gray-100 rounded-lg border border-gray-200">
                              <Eye className="w-5 h-5 text-gray-700" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 font-medium">Total Views</p>
                              <p className="text-lg font-bold text-gray-900">{formatNumber(channelData.viewCount || '0')}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border border-gray-200 rounded-xl bg-white shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-gray-100 rounded-lg border border-gray-200">
                              <PlayCircle className="w-5 h-5 text-gray-700" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 font-medium">Total Videos</p>
                              <p className="text-lg font-bold text-gray-900">{formatNumber(channelData.videoCount || '0')}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border border-gray-200 rounded-xl bg-white shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-gray-100 rounded-lg border border-gray-200">
                              <BarChart3 className="w-5 h-5 text-gray-700" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 font-medium">Avg Views</p>
                              <p className="text-lg font-bold text-gray-900">
                                {(() => {
                                  const views = parseInt(channelData.viewCount || '0')
                                  const videos = parseInt(channelData.videoCount || '0')
                                  const avg = videos > 0 ? Math.floor(views / videos) : 0
                                  return formatNumber(Number.isFinite(channelData.averageViews as any) ? (channelData.averageViews as any) : avg)
                                })()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Enhanced Performance Analytics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {/* Channel Health Score Card */}
                      {(() => {
                        const healthScore = calculateChannelHealthScore(channelData)
                        const scoreColor = getHealthScoreColor(healthScore)
                        const scoreLabel = getHealthScoreLabel(healthScore)
                        return (
                          <Card className="border border-gray-200 rounded-xl bg-white shadow-sm">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="p-2 bg-gray-100 rounded-lg border border-gray-200">
                                  <TrendingUp className="w-5 h-5 text-gray-700" />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600 font-medium">Health Score</p>
                                  <p className="text-lg font-bold text-gray-900">{healthScore}/100</p>
                                </div>
                              </div>
                              <div className="mb-2">
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                  <div 
                                    className={`h-full bg-gradient-to-r ${scoreColor} rounded-full transition-all duration-1000 ease-out`}
                                    style={{ width: `${healthScore}%` }}
                                  />
                                </div>
                              </div>
                              <p className="text-xs text-gray-600">{scoreLabel}</p>
                            </CardContent>
                          </Card>
                        )
                      })()}

                      {/* Engagement Rate Card */}
                      <Card className="border border-gray-200 rounded-xl bg-white shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-gray-100 rounded-lg border border-gray-200">
                              <Heart className="w-5 h-5 text-gray-700" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 font-medium">Engagement Rate</p>
                              <p className="text-lg font-bold text-gray-900">
                                {Number.isFinite(channelData.engagementRate as any)
                                  ? `${(channelData.engagementRate as any).toFixed(2)}%`
                                  : '—'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              (Number.isFinite(channelData.engagementRate as any) ? (channelData.engagementRate as any) : 0) >= 3 ? 'bg-green-500' :
                              (Number.isFinite(channelData.engagementRate as any) ? (channelData.engagementRate as any) : 0) >= 1.5 ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                            <p className="text-xs text-gray-600">
                              {(Number.isFinite(channelData.engagementRate as any) ? (channelData.engagementRate as any) : 0) >= 3 ? 'Excellent audience connection' :
                               (Number.isFinite(channelData.engagementRate as any) ? (channelData.engagementRate as any) : 0) >= 1.5 ? 'Good community engagement' : 'Focus on audience interaction'}
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Upload Consistency Card */}
                      <Card className="border border-gray-200 rounded-xl bg-white shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-gray-100 rounded-lg border border-gray-200">
                              <Clock className="w-5 h-5 text-gray-700" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 font-medium">Upload Rate</p>
                              <p className="text-lg font-bold text-gray-900">
                                {(() => {
                                  const videos = parseInt(channelData.videoCount || '0')
                                  const months = channelData.publishedAt
                                    ? Math.max(1, Math.floor((Date.now() - new Date(channelData.publishedAt).getTime()) / (1000 * 60 * 60 * 24 * 30)))
                                    : 1
                                  const perMonth = months > 0 ? Math.round(videos / months) : 0
                                  return `${perMonth}/mo`
                                })()}
                              </p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600">
                            {(() => {
                              const videos = parseInt(channelData.videoCount || '0')
                              const months = channelData.publishedAt
                                ? Math.max(1, Math.floor((Date.now() - new Date(channelData.publishedAt).getTime()) / (1000 * 60 * 60 * 24 * 30)))
                                : 1
                              const perMonth = months > 0 ? (videos / months) : 0
                              return perMonth >= 4 ? 'Very consistent creator' : 'Room for more consistency'
                            })()}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Channel Insights Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Channel Age & Growth */}
                      <Card className="border border-gray-200 rounded-xl bg-white shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2 text-gray-900 text-base">
                            <Calendar className="w-4 h-4" />
                            Channel Journey
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="text-center">
                              <p className="text-lg font-bold text-gray-900">
                                {(() => {
                                  if (!channelData.publishedAt) return '—'
                                  const created = new Date(channelData.publishedAt).getTime()
                                  const months = Math.max(1, Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24 * 30)))
                                  const years = Math.floor(months / 12)
                                  if (years >= 1) return `${years} year${years === 1 ? '' : 's'}`
                                  return `${months} mo`
                                })()}
                              </p>
                              <p className="text-xs text-gray-600">Channel Age</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-gray-900">
                                {Number.isFinite(channelData.growthRate as any) ? `+${(channelData.growthRate as any).toFixed(1)}%` : '—'}
                              </p>
                              <p className="text-xs text-gray-600">Growth Rate</p>
                            </div>
                          </div>
                          <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                            <p className="text-xs text-gray-700">
                              {channelData.publishedAt ? 
                                `Started ${new Date(channelData.publishedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` :
                                'Channel creation date not available'
                              }
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Quick Performance Summary */}
                      <Card className="border border-gray-200 rounded-xl bg-white shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2 text-gray-900 text-base">
                            <Award className="w-4 h-4" />
                            Performance Summary
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-3">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center p-2 bg-gray-50 border border-gray-200 rounded-lg">
                              <span className="text-xs text-gray-700">Subscriber Rate</span>
                              <span className="font-bold text-gray-900 text-sm">
                                {(() => {
                                  const subs = parseInt(channelData.subscriberCount || '0')
                                  const videos = parseInt(channelData.videoCount || '0')
                                  if (videos <= 0) return '—'
                                  return `${Math.round(subs / videos)} per video`
                                })()}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-gray-50 border border-gray-200 rounded-lg">
                              <span className="text-xs text-gray-700">View-to-Sub Ratio</span>
                              <span className="font-bold text-gray-900 text-sm">
                                {(() => {
                                  const subs = parseInt(channelData.subscriberCount || '0')
                                  const views = parseInt(channelData.viewCount || '0')
                                  if (subs <= 0) return '—'
                                  return `${Math.round(views / subs)}:1`
                                })()}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-gray-50 border border-gray-200 rounded-lg">
                              <span className="text-xs text-gray-700">Content Quality</span>
                              <span className="font-bold text-gray-900 text-sm">
                                {(() => {
                                  const views = parseInt(channelData.viewCount || '0')
                                  const videos = parseInt(channelData.videoCount || '0')
                                  const avg = videos > 0 ? Math.floor(views / videos) : 0
                                  const avgViews = Number.isFinite(channelData.averageViews as any) ? (channelData.averageViews as any) : avg
                                  return avgViews >= 50000 ? 'Premium' : avgViews >= 10000 ? 'Good' : 'Growing'
                                })()}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                  {/* Enhanced Analytics Layout */}
                  <div className="space-y-8">
                    {/* Top Row - Channel Health Score (Full Width) */}
                    <Card className="border border-gray-200 rounded-2xl bg-white shadow-sm">
                      <CardHeader className="pb-3 border-b border-gray-200">
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg border border-gray-200">
                              <TrendingUp className="w-6 h-6 text-gray-700" />
                            </div>
                            <span className="text-xl font-bold text-gray-900">
                              Channel Health Analytics
                            </span>
                          </div>
                          {(() => {
                            const healthScore = calculateChannelHealthScore(channelData)
                            return (
                              <div className="flex items-center gap-2">
                                <span className="text-3xl font-black text-gray-900">{healthScore}</span>
                                <span className="text-lg text-gray-600 font-semibold">/100</span>
                              </div>
                            )
                          })()}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6">
                        {(() => {
                          const healthScore = calculateChannelHealthScore(channelData)
                          const scoreColor = getHealthScoreColor(healthScore)
                          const scoreLabel = getHealthScoreLabel(healthScore)
                          return (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                              {/* Health Score Visual */}
                              <div className="lg:col-span-2">
                                <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl">
                                  <div className="mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-lg font-semibold text-gray-900">{scoreLabel}</span>
                                      <span className="text-sm font-bold text-gray-700">{healthScore}%</span>
                                    </div>
                                    <div className="relative">
                                      <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                                        <div 
                                          className={`h-full ${scoreColor} rounded-full transition-all duration-2000 ease-out`}
                                          style={{ width: `${healthScore}%` }}
                                        />
                                      </div>
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-xs font-bold text-white drop-shadow">{healthScore}%</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white border border-gray-200 p-4 rounded-xl">
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700">Subscriber Level</span>
                                        <span className="text-lg font-bold text-gray-900">
                                          {parseInt(channelData.subscriberCount || '0') >= 1000000 ? '★★★' :
                                           parseInt(channelData.subscriberCount || '0') >= 10000 ? '★★☆' : '★☆☆'}
                                        </span>
                                      </div>
                                      <p className="text-xs text-gray-600 mt-1">
                                        {parseInt(channelData.subscriberCount || '0') >= 1000000 ? 'Elite Creator' :
                                         parseInt(channelData.subscriberCount || '0') >= 10000 ? 'Established' : 'Growing'}
                                      </p>
                                    </div>
                                    
                                    <div className="bg-white border border-gray-200 p-4 rounded-xl">
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700">Engagement</span>
                                        <span className="text-lg font-bold text-gray-900">
                                          {(Number.isFinite(channelData.engagementRate as any) ? (channelData.engagementRate as any) : 0) >= 3 ? '★★★' :
                                           (Number.isFinite(channelData.engagementRate as any) ? (channelData.engagementRate as any) : 0) >= 1.5 ? '★★☆' : '★☆☆'}
                                        </span>
                                      </div>
                                      <p className="text-xs text-gray-600 mt-1">
                                        {(Number.isFinite(channelData.engagementRate as any) ? (channelData.engagementRate as any) : 0) >= 3 ? 'Excellent' :
                                         (Number.isFinite(channelData.engagementRate as any) ? (channelData.engagementRate as any) : 0) >= 1.5 ? 'Good' : 'Needs Work'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Key Metrics */}
                              <div className="space-y-4">
                                <div className="p-3 bg-white border border-gray-200 rounded-lg">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Heart className="w-4 h-4 text-gray-700" />
                                    <h4 className="font-semibold text-sm text-gray-900">Engagement Rate</h4>
                                  </div>
                                  <p className="text-lg font-bold text-gray-900">
                                    {Number.isFinite(channelData.engagementRate as any) ? `${(channelData.engagementRate as any).toFixed(2)}%` : '—'}
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1">
                                    {(Number.isFinite(channelData.engagementRate as any) ? (channelData.engagementRate as any) : 0) > 3 ? 'Outstanding audience connection' : 
                                     (Number.isFinite(channelData.engagementRate as any) ? (channelData.engagementRate as any) : 0) > 1.5 ? 'Solid community engagement' : 'Focus on audience interaction'}
                                  </p>
                                </div>

                                <div className="p-3 bg-white border border-gray-200 rounded-lg">
                                  <div className="flex items-center gap-2 mb-1">
                                    <TrendingUp className="w-4 h-4 text-gray-700" />
                                    <h4 className="font-semibold text-sm text-gray-900">Growth Rate</h4>
                                  </div>
                                  <p className="text-lg font-bold text-gray-900">
                                    {Number.isFinite(channelData.growthRate as any) ? `+${(channelData.growthRate as any).toFixed(1)}%` : '—'}
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1">
                                    Monthly subscriber growth trend
                                  </p>
                                </div>

                                <div className="p-3 bg-white border border-gray-200 rounded-lg">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Clock className="w-4 h-4 text-gray-700" />
                                    <h4 className="font-semibold text-sm text-gray-900">Consistency</h4>
                                  </div>
                                  <p className="text-base font-bold text-gray-900">
                                    {(() => {
                                      const videos = parseInt(channelData.videoCount || '0')
                                      const months = channelData.publishedAt
                                        ? Math.max(1, Math.floor((Date.now() - new Date(channelData.publishedAt).getTime()) / (1000 * 60 * 60 * 24 * 30)))
                                        : 1
                                      const perMonth = months > 0 ? (videos / months) : 0
                                      return perMonth >= 12 ? '★★★' : perMonth >= 6 ? '★★☆' : '★☆☆'
                                    })()}
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1">
                                    {(() => {
                                      const videos = parseInt(channelData.videoCount || '0')
                                      const months = channelData.publishedAt
                                        ? Math.max(1, Math.floor((Date.now() - new Date(channelData.publishedAt).getTime()) / (1000 * 60 * 60 * 24 * 30)))
                                        : 1
                                      const perMonth = months > 0 ? (videos / months) : 0
                                      return perMonth >= 12 ? 'Highly consistent' : perMonth >= 6 ? 'Moderately regular' : 'Irregular uploads'
                                    })()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        })()}
                      </CardContent>
                    </Card>

                    {/* Second Row - Keywords & Categories */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Channel Keywords */}
                      <Card className="border border-gray-200 rounded-lg bg-white shadow-sm">
                        <CardHeader className="pb-2 border-b border-gray-200">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <div className="p-1 bg-gray-100 rounded border border-gray-200">
                              <Hash className="w-4 h-4 text-gray-700" />
                            </div>
                            <span className="font-semibold text-gray-900">Channel Keywords</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          {channelData.keywords ? (
                            <div className="space-y-3">
                              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
                                  {channelData.keywords.split(',').slice(0, 15).map((keyword, index) => (
                                    <Badge
                                      key={index}
                                      variant="secondary"
                                      className="px-2 py-1 text-xs bg-gray-100 text-gray-900 border border-gray-300 hover:bg-gray-200 transition-colors"
                                    >
                                      {keyword.trim()}
                                    </Badge>
                                  ))}
                                </div>
                                {channelData.keywords.split(',').length > 15 && (
                                  <p className="text-xs text-gray-600 mt-1 text-center">
                                    +{channelData.keywords.split(',').length - 15} more keywords
                                  </p>
                                )}
                              </div>
                              <div className="bg-gray-50 border border-gray-200 p-2 rounded-lg">
                                <p className="text-xs text-gray-700">
                                  <strong>Total:</strong> {channelData.keywords.split(',').length} keywords
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <Hash className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                              <p className="text-gray-600 text-sm">No keywords found</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Additional Metrics - Views Per Sub & Engagement */}
                      <Card className="border border-gray-200 rounded-lg bg-white shadow-sm">
                        <CardHeader className="pb-2 border-b border-gray-200">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <div className="p-1 bg-gray-100 rounded border border-gray-200">
                              <TrendingUp className="w-4 h-4 text-gray-700" />
                            </div>
                            <span className="font-semibold text-gray-900">Performance Metrics</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-3">
                          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-600 font-medium">Views per Subscriber</span>
                              <Globe className="w-4 h-4 text-gray-600" />
                            </div>
                            <p className="text-xl font-bold text-gray-900">
                              {Number.isFinite(channelData.viewsPerSubscriber as any) 
                                ? `${(channelData.viewsPerSubscriber as any).toFixed(1)}x`
                                : '—'}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {Number.isFinite(channelData.viewsPerSubscriber as any)
                                ? (channelData.viewsPerSubscriber as any) > 10 ? 'Excellent reach ratio' : 'Growing audience reach'
                                : 'Unable to calculate'}
                            </p>
                          </div>

                          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-600 font-medium">Avg Engagement per Video</span>
                              <Heart className="w-4 h-4 text-gray-600" />
                            </div>
                            <p className="text-xl font-bold text-gray-900">
                              {Number.isFinite(channelData.avgEngagementPerVideo as any)
                                ? formatNumber(channelData.avgEngagementPerVideo as any)
                                : '—'}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {Number.isFinite(channelData.avgEngagementPerVideo as any)
                                ? (channelData.avgEngagementPerVideo as any) > 1000 ? 'Strong community interaction' : 'Building engagement'
                                : 'Calculating...'}
                            </p>
                          </div>

                          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-600 font-medium">Overall Viral Score</span>
                              <Zap className="w-4 h-4 text-gray-600" />
                            </div>
                            <p className="text-xl font-bold text-gray-900">
                              {Number.isFinite(channelData.totalViralScore as any)
                                ? `${Math.round(channelData.totalViralScore as any)}/100`
                                : '—'}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {Number.isFinite(channelData.totalViralScore as any)
                                ? (channelData.totalViralScore as any) > 75 ? 'Highly viral potential' : (channelData.totalViralScore as any) > 50 ? 'Good viral potential' : 'Building momentum'
                                : 'Analyzing...'}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Third Row - Most and Least Popular Videos */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Most Popular Video */}
                      <Card className="border border-gray-200 rounded-lg bg-white shadow-sm">
                        <CardHeader className="pb-2 border-b border-gray-200">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <PlayCircle className="w-4 h-4 text-gray-700" />
                            <span className="font-semibold text-gray-900">Most Popular Video</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          {channelData.mostPopularVideo ? (
                            <div className="space-y-3">
                              <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden border border-gray-300">
                                <img
                                  src={channelData.mostPopularVideo.thumbnail}
                                  alt={channelData.mostPopularVideo.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-2">
                                  {channelData.mostPopularVideo.title}
                                </h4>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-xs text-gray-600">Views</p>
                                    <p className="text-sm font-bold text-gray-900">{formatNumber(channelData.mostPopularVideo.viewCount)}</p>
                                  </div>
                                  <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-xs text-gray-600">Engagement</p>
                                    <p className="text-sm font-bold text-gray-900">
                                      {((parseInt(channelData.mostPopularVideo.likeCount) + parseInt(channelData.mostPopularVideo.commentCount)) / parseInt(channelData.mostPopularVideo.viewCount) * 100).toFixed(1)}%
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-6">
                              <PlayCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                              <p className="text-gray-600 text-sm">No video data available</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Least Popular Video */}
                      <Card className="border border-gray-200 rounded-lg bg-white shadow-sm">
                        <CardHeader className="pb-2 border-b border-gray-200">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <PlayCircle className="w-4 h-4 text-gray-700" />
                            <span className="font-semibold text-gray-900">Least Popular Video</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          {channelData.leastPopularVideo ? (
                            <div className="space-y-3">
                              <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden border border-gray-300">
                                <img
                                  src={channelData.leastPopularVideo.thumbnail}
                                  alt={channelData.leastPopularVideo.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-2">
                                  {channelData.leastPopularVideo.title}
                                </h4>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-xs text-gray-600">Views</p>
                                    <p className="text-sm font-bold text-gray-900">{formatNumber(channelData.leastPopularVideo.viewCount)}</p>
                                  </div>
                                  <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-xs text-gray-600">Engagement</p>
                                    <p className="text-sm font-bold text-gray-900">
                                      {((parseInt(channelData.leastPopularVideo.likeCount) + parseInt(channelData.leastPopularVideo.commentCount)) / parseInt(channelData.leastPopularVideo.viewCount) * 100).toFixed(1)}%
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-6">
                              <PlayCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                              <p className="text-gray-600 text-sm">No video data available</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="schedule" className="space-y-6">
                  {(() => {
                    const uploadAnalysis = getBestUploadTimes(channelData)
                    return (
                      <div className="space-y-6">
                        {/* Hero Best Time Section - Prominent Display */}
                        <Card className="border-2 border-blue-300 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg">
                          <CardContent className="pt-8 pb-8">
                            <div className="text-center space-y-4">
                              <div className="inline-block">
                                <div className="p-4 bg-white rounded-2xl shadow-sm border border-blue-200">
                                  <Clock className="w-8 h-8 text-blue-600 mx-auto" />
                                </div>
                              </div>
                              <div>
                                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Best Time to Upload</h2>
                                <p className="text-gray-700 text-sm">Upload when your audience is most active for maximum engagement</p>
                              </div>
                              <div className="bg-white rounded-2xl p-6 border-2 border-blue-300 shadow-sm mt-4">
                                <p className="text-sm text-gray-600 mb-1">⏰ Optimal Upload Time</p>
                                <p className="text-4xl font-bold text-blue-600 mb-2">
                                  {uploadAnalysis.topHour ? formatUploadTime(uploadAnalysis.topHour.hour) : '6:00 PM'}
                                </p>
                                <p className="text-gray-700 font-semibold mb-3">
                                  {uploadAnalysis.topDay ? formatDayName(uploadAnalysis.topDay.day) : 'Friday'}
                                </p>
                                <div className="border-t border-gray-200 pt-3">
                                  <p className="text-xs text-gray-600">
                                    {uploadAnalysis.topHour 
                                      ? `${uploadAnalysis.topHour.count} videos uploaded at this time - ${uploadAnalysis.topDay ? uploadAnalysis.topDay.count : 'many'} on this day`
                                      : 'Based on your channel history and YouTube trends'
                                    }
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Two Column Layout for detailed breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Best Upload Times */}
                          <Card className="border border-gray-200 rounded-lg bg-white shadow-sm">
                            <CardHeader className="pb-2 border-b border-gray-200">
                              <CardTitle className="flex items-center gap-2 text-base">
                                <Sun className="w-4 h-4 text-gray-700" />
                                Top 5 Upload Times
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                              <div className="space-y-3">
                                {uploadAnalysis.bestHours.slice(0, 5).map((hour, index) => (
                                  <div key={hour} className={`flex items-center justify-between p-3 rounded-lg border ${index === 0 ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300' : 'bg-gray-50 border-gray-200'}`}>
                                    <div className="flex items-center gap-2">
                                      <Badge className={`${index === 0 ? 'bg-blue-600 text-white' : 'bg-gray-900 text-white'} text-xs font-bold`}>
                                        {index === 0 ? '🏆 #1' : `#${index + 1}`}
                                      </Badge>
                                      <span className="font-semibold text-gray-900">{formatUploadTime(hour)}</span>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xs text-gray-600">Recommended</p>
                                      <p className="text-sm font-bold text-gray-900">Best Result</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mt-4">
                                <p className="text-xs text-blue-700">
                                  <strong>💡 Tip:</strong> {uploadAnalysis.timeAnalysis}
                                </p>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Best Upload Days */}
                          <Card className="border border-gray-200 rounded-lg bg-white shadow-sm">
                            <CardHeader className="pb-2 border-b border-gray-200">
                              <CardTitle className="flex items-center gap-2 text-base">
                                <Calendar className="w-4 h-4 text-gray-700" />
                                Top Days to Upload
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                              <div className="space-y-3">
                                {uploadAnalysis.bestDays.slice(0, 4).map((day, index) => (
                                  <div key={day} className={`flex items-center justify-between p-3 rounded-lg border ${index === 0 ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-300' : 'bg-gray-50 border-gray-200'}`}>
                                    <div className="flex items-center gap-2">
                                      <Badge className={`${index === 0 ? 'bg-green-600 text-white' : 'bg-gray-900 text-white'} text-xs font-bold`}>
                                        {index === 0 ? '⭐ #1' : `#${index + 1}`}
                                      </Badge>
                                      <span className="font-semibold text-gray-900">{formatDayName(day)}</span>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xs text-gray-600">Best Day</p>
                                      <p className="text-sm font-bold text-gray-900">
                                        {uploadAnalysis.topDay?.day === day ? `${uploadAnalysis.topDay.count} videos` : 'Popular'}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="p-3 bg-green-50 border border-green-200 rounded-lg mt-4">
                                <h4 className="font-semibold text-sm text-green-900 mb-2">Upload Frequency</h4>
                                <p className="text-base font-bold text-green-600">
                                  {(() => {
                                    const videos = parseInt(channelData.videoCount || '0')
                                    const months = channelData.publishedAt
                                      ? Math.max(1, Math.floor((Date.now() - new Date(channelData.publishedAt).getTime()) / (1000 * 60 * 60 * 24 * 30)))
                                      : 1
                                    return months > 0 ? Math.round(videos / months) : 0
                                  })()} videos/month
                                </p>
                                <p className="text-xs text-green-700 mt-1">💡 Current upload schedule</p>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    )
                  })()}
                </TabsContent>

                <TabsContent value="videos" className="space-y-6">
                  {channelData.topVideos && channelData.topVideos.length > 0 ? (
                    <div className="space-y-4">
                      {/* Summary Stats */}
                      <Card className="border border-gray-200 rounded-2xl bg-white shadow-sm">
                        <CardHeader className="pb-3 border-b border-gray-200">
                          <CardTitle className="flex items-center gap-2">
                            <Award className="w-5 h-5 text-gray-700" />
                            Video Performance Overview
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-200">
                              <h4 className="text-2xl font-bold text-gray-900">
                                {channelData.topVideos.filter(v => getVideoPerformance(v as DetailedVideoData, channelData.averageViews || 0) === 'excellent').length}
                              </h4>
                              <p className="text-sm text-gray-600 font-medium">Viral Videos</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-200">
                              <h4 className="text-2xl font-bold text-gray-900">
                                {Math.round(channelData.topVideos.reduce((acc, v) => acc + parseInt(v.viewCount), 0) / channelData.topVideos.length / 1000)}K
                              </h4>
                              <p className="text-sm text-gray-600 font-medium">Avg Views</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-200">
                              <h4 className="text-2xl font-bold text-gray-900">
                                {Math.round(channelData.topVideos.reduce((acc, v) => {
                                  const engagement = (parseInt(v.likeCount) + parseInt(v.commentCount)) / parseInt(v.viewCount) * 100
                                  return acc + engagement
                                }, 0) / channelData.topVideos.length * 10) / 10}%
                              </h4>
                              <p className="text-sm text-gray-600 font-medium">Avg Engagement</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-200">
                              <h4 className="text-2xl font-bold text-gray-900">
                                {Math.round((channelData.topVideos.reduce((acc, v) => acc + parseInt(v.likeCount), 0) / 
                                  channelData.topVideos.reduce((acc, v) => acc + parseInt(v.viewCount), 0)) * 100 * 10) / 10}%
                              </h4>
                              <p className="text-sm text-gray-600 font-medium">Like Rate</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Hero Section - Top 10 Most Viewed */}
                      <Card className="border-2 border-amber-300 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 shadow-lg">
                        <CardContent className="pt-6 pb-6">
                          <div className="text-center space-y-3">
                            <div className="inline-block">
                              <div className="p-3 bg-white rounded-xl shadow-sm border border-amber-200">
                                <PlayCircle className="w-6 h-6 text-amber-600 mx-auto" />
                              </div>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Top 10 Most Viewed Videos</h2>
                            <p className="text-gray-700 text-sm">Ranked by total views - Learn what makes these videos successful</p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Top Videos with Expandable Details - Show 10 by default */}
                      <Card className="border border-gray-200 rounded-lg bg-white shadow-sm">
                        <CardHeader className="pb-2 border-b border-gray-200">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <PlayCircle className="w-4 h-4 text-gray-700" />
                            10 Most Viewed Videos (Sorted by Views)
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="space-y-3">
                            {channelData.topVideos.slice(0, 10).map((video, index) => {
                              const videoDetails = formatVideoDetails(video as DetailedVideoData)
                              const performance = getVideoPerformance(video as DetailedVideoData, channelData.averageViews || 0)
                              const isExpanded = expandedVideo === video.id
                              const isTopPerformer = index === 0
                              
                              return (
                                <div key={video.id} className={`border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all bg-white ${
                                  isTopPerformer ? 'border-amber-400 bg-gradient-to-r from-amber-50 to-white ring-2 ring-amber-200' : 'border-gray-200'
                                }`}>
                                  {/* Main Video Row */}
                                  <div 
                                    className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => toggleVideoDetails(video.id)}
                                  >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      <div className="flex-shrink-0">
                                        <Badge 
                                          variant="secondary" 
                                          className={`font-bold text-xs ${
                                            isTopPerformer 
                                              ? 'bg-amber-200 text-amber-900' 
                                              : 'bg-gray-100 text-gray-900'
                                          }`}
                                        >
                                          {isTopPerformer ? '🏆 #1' : `#${index + 1}`}
                                        </Badge>
                                      </div>
                                      <img 
                                        src={video.thumbnail} 
                                        alt={video.title}
                                        className="w-16 sm:w-20 h-10 sm:h-12 object-cover rounded-lg shadow-sm"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-gray-900 line-clamp-2 text-xs sm:text-sm">
                                          {video.title}
                                        </h4>
                                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-600">
                                          <div className="flex items-center gap-1">
                                            <Eye className="w-3 h-3" />
                                            <span className="font-medium">{formatNumber(video.viewCount)}</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <ThumbsUp className="w-3 h-3" />
                                            <span>{formatNumber(video.likeCount)}</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <MessageSquare className="w-3 h-3" />
                                            <span>{formatNumber(video.commentCount)}</span>
                                          </div>
                                          <Badge 
                                            variant="outline" 
                                            className="text-xs border-gray-300 text-gray-700 bg-gray-50"
                                          >
                                            {performance === 'excellent' ? '🔥 Viral' :
                                             performance === 'good' ? '⚡ Strong' :
                                             performance === 'average' ? '📈 Average' : '🎯 Slow'}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <a 
                                        href={`https://www.youtube.com/watch?v=${video.id}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                      {isTopPerformer ? (
                                        <Button 
                                          onClick={() => toggleVideoDetails(video.id)}
                                          className="text-xs bg-amber-500 text-white hover:bg-amber-600 font-semibold"
                                          size="sm"
                                        >
                                          {isExpanded ? 'Hide Details' : 'View Top Performance'}
                                        </Button>
                                      ) : (
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="text-xs"
                                        >
                                          {isExpanded ? 'Hide' : 'Details'}
                                        </Button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Expanded Details */}
                                  {isExpanded && (
                                    <div className="border-t border-gray-200 bg-gray-50 p-3 space-y-3">
                                      {/* Performance Metrics */}
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        <div className="bg-white p-2 rounded-lg text-center border border-gray-200">
                                          <p className="text-xs text-gray-600 mb-0.5">Views/Day</p>
                                          <p className="font-bold text-sm text-gray-900">{formatNumber(videoDetails.viewsPerDay)}</p>
                                        </div>
                                        <div className="bg-white p-2 rounded-lg text-center border border-gray-200">
                                          <p className="text-xs text-gray-600 mb-0.5">Engagement</p>
                                          <p className="font-bold text-sm text-gray-900">{videoDetails.engagementRate}%</p>
                                        </div>
                                        <div className="bg-white p-2 rounded-lg text-center border border-gray-200">
                                          <p className="text-xs text-gray-600 mb-0.5">Upload Time</p>
                                          <p className="font-bold text-sm text-gray-900">{formatUploadTime(videoDetails.uploadHour)}</p>
                                        </div>
                                        <div className="bg-white p-2 rounded-lg text-center border border-gray-200">
                                          <p className="text-xs text-gray-600 mb-0.5">Upload Day</p>
                                          <p className="font-bold text-sm text-gray-900">{videoDetails.uploadDay}</p>
                                        </div>
                                      </div>

                                      {/* Additional Details */}
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                                          <h5 className="font-semibold text-sm text-gray-900 mb-1 flex items-center gap-2">
                                            <Calendar className="w-3 h-3" />
                                            Timeline
                                          </h5>
                                          <div className="space-y-1 text-xs">
                                            <div className="flex justify-between">
                                              <span className="text-gray-600">Published:</span>
                                              <span className="font-medium">{new Date(video.publishedAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-gray-600">Days Old:</span>
                                              <span className="font-medium">{videoDetails.daysOld} days</span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-gray-600">Category:</span>
                                              <span className="font-medium">{getCategoryName(video.categoryId)}</span>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                                          <h5 className="font-semibold text-sm text-gray-900 mb-1 flex items-center gap-2">
                                            <BarChart3 className="w-3 h-3" />
                                            Performance
                                          </h5>
                                          <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                              <span className="text-gray-600">Like Ratio:</span>
                                              <span className="font-medium">
                                                {((parseInt(video.likeCount) / parseInt(video.viewCount)) * 100).toFixed(2)}%
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-gray-600">Comments/Views:</span>
                                              <span className="font-medium">
                                                {((parseInt(video.commentCount) / parseInt(video.viewCount)) * 100).toFixed(3)}%
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-gray-600">vs Avg Views:</span>
                                              <span className={`font-medium ${
                                                parseInt(video.viewCount) > (channelData.averageViews || 0) ? 'text-green-600' : 'text-orange-600'
                                              }`}>
                                                {channelData.averageViews ? 
                                                  `${((parseInt(video.viewCount) / channelData.averageViews) * 100).toFixed(0)}%` : 
                                                  'N/A'
                                                }
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Tags */}
                                      {video.tags && video.tags.length > 0 && (
                                        <div className="bg-white p-4 rounded-lg">
                                          <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            <Hash className="w-4 h-4" />
                                            Tags ({video.tags.length})
                                          </h5>
                                          <div className="flex flex-wrap gap-2">
                                            {video.tags.slice(0, 10).map((tag, idx) => (
                                              <Badge key={idx} variant="outline" className="text-xs bg-gray-50">
                                                {tag}
                                              </Badge>
                                            ))}
                                            {video.tags.length > 10 && (
                                              <Badge variant="outline" className="text-xs bg-gray-100">
                                                +{video.tags.length - 10} more
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                                  </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <Card className="border border-gray-200 rounded-2xl bg-white shadow-sm">
                      <CardContent className="p-12 text-center">
                        <PlayCircle className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Video Data Available</h3>
                        <p className="text-gray-600">Top videos will be displayed when data is available.</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            )}

            {/* Ready to Analyze Card - Simple and Clean */}
            {!videoData && !channelData && !loading && (
              <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
                <CardContent className="p-8 text-center">
                  <div className="mb-4">
                    {analysisType === 'video' ? (
                      <Video className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto" />
                    ) : (
                      <Users className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto" />
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Ready to Analyze {analysisType === 'video' ? 'Video' : 'Channel'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                    {analysisType === 'video' 
                      ? 'Enter a YouTube video URL or Shorts link above to see performance insights.'
                      : 'Enter a YouTube channel URL above to see comprehensive analytics.'
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
      
      {/* Upgrade Card Modal */}
      {showUpgradeCard && (
        <UpgradeCard 
          requiredCredits={analysisType === 'video' ? CREDIT_COSTS.VIDEO_INFO : CREDIT_COSTS.CHANNEL_INFO}
          feature={analysisType === 'video' ? 'Video Analysis' : 'Channel Analysis'}
        />
      )}
    </div>
  )
}
