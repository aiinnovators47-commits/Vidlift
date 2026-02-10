"use client"

export const dynamic = 'force-dynamic'

import React, { useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import SharedSidebar from "@/components/shared-sidebar"
import UpgradeCard from "@/components/upgrade-card"
import { Input } from "@/components/ui/input"
import dynamicImport from 'next/dynamic'
import { CREDIT_COSTS } from "@/models/Credit"
import {
  Play,
  Users,
  Eye,
  Video,
  TrendingUp,
  Send,
  BarChart3,
  Upload,
  Clock,
  Trophy,
  Lightbulb,
  AlertCircle,
  ArrowLeft,
  ListVideo,
  Calendar,
  ThumbsUp,
  MessageCircle,
  Menu,
  X,
  LogOut,
  Home,
  GitCompare,
  Search
} from 'lucide-react'

const NotificationBell = dynamicImport(() => import('@/components/notification-bell'), { ssr: false })

interface YouTubeChannel {
  id: string
  title: string
  customUrl?: string
  thumbnail: string
  subscriberCount: string
  videoCount: string
  viewCount: string
  publishedAt: string
  defaultLanguage?: string | null
  localized?: any
  country?: string | null
  channelKeywords?: string | null
}

interface YouTubeVideo {
  id: string
  title: string
  thumbnail: string
  viewCount: number
  likeCount: number
  commentCount: number
  publishedAt: string
  tags?: string[]
  description?: string
  duration?: string | null
  localizations?: any
  privacyStatus?: string
}

function ChannelCard({ channel, rank, isWinner, videos }: { channel: YouTubeChannel; rank: string; isWinner: boolean; videos?: YouTubeVideo[] }) {
  const formatNumber = (num: string | number): string => {
    const n = typeof num === "string" ? parseInt(num) : num
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M"
    if (n >= 1000) return (n / 1000).toFixed(1) + "K"
    return n.toString()
  }

  // Calculate engagement rate
  const calculateEngagementRate = () => {
    const vids = Array.isArray(videos) ? videos : []
    const totalViews = vids.reduce((sum, v) => sum + (typeof v.viewCount === 'number' ? v.viewCount : 0), 0)
    const totalEngagement = vids.reduce((sum, v) => sum + (typeof v.likeCount === 'number' ? v.likeCount : 0) + (typeof v.commentCount === 'number' ? v.commentCount : 0), 0)
    if (totalViews > 0) return ((totalEngagement / totalViews) * 100).toFixed(2)
    return "0.00"
  }

  const parseChannelKeywords = (raw: string) => {
    const cleaned = raw.trim()
    const matches = Array.from(cleaned.matchAll(/"([^"]+)"/g)).map(m => m[1]).filter(Boolean)
    if (matches.length) return matches
    return cleaned.split(',').map(s => s.trim()).filter(Boolean)
  }

  // Calculate avg views per video
  const calculateAvgViews = () => {
    const views = parseInt(channel.viewCount)
    const videos = parseInt(channel.videoCount)
    if (videos === 0) return 0
    return Math.floor(views / videos)
  }

  return (
    <div className="bg-white border border-gray-300 rounded-2xl p-4 md:p-6 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <img
            src={channel.thumbnail}
            alt={channel.title}
            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
          />
          <div>
            <h3 className="font-bold text-gray-900 line-clamp-1 text-base md:text-lg">{channel.title}</h3>
            <p className="text-xs text-gray-500">{channel.customUrl || channel.id}</p>
          </div>
        </div>
        {isWinner && (
          <div className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 animate-pulse">
            <Trophy className="w-3 h-3" />
            Winner
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-600 mb-1">Subscribers</p>
          <p className="font-bold text-gray-900 text-lg">{formatNumber(channel.subscriberCount)}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-600 mb-1">Views</p>
          <p className="font-bold text-gray-900 text-lg">{formatNumber(channel.viewCount)}</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-600 mb-1">Videos</p>
          <p className="font-bold text-gray-900 text-lg">{formatNumber(channel.videoCount)}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-600 mb-1">Engagement</p>
          <p className="font-bold text-gray-900 text-lg">{calculateEngagementRate()}%</p>
        </div>
      </div>

      <div className="space-y-2 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-gray-700">Rank: {rank}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Video className="w-4 h-4" />
            <span>Avg: {formatNumber(calculateAvgViews())}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>Created: {new Date(channel.publishedAt).toLocaleDateString()}</span>
        </div>
        {channel.country && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10v6a2 2 0 0 1-2 2H7" /><path d="M3 6h18" /></svg>
            <span>Country: {channel.country}</span>
          </div>
        )}
        {channel.defaultLanguage && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="font-medium">Default language:</span>
            <span>{channel.defaultLanguage}</span>
          </div>
        )}
        {channel.channelKeywords && (
          <div className="text-sm text-gray-500">
            <div className="font-medium">Channel Keywords:</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {parseChannelKeywords(channel.channelKeywords).map((kw, idx) => (
                <span key={idx} className="px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-xs wrap-break-word">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function InsightCard({ channel, isWinner, comparisonData }: {
  channel: YouTubeChannel;
  isWinner: boolean;
  comparisonData: {
    channel1Subscribers: number;
    channel2Subscribers: number;
    channel1Views: number;
    channel2Views: number;
  }
}) {
  const getInsights = () => {
    const insights = []
    const subscribers = parseInt(channel.subscriberCount)
    const views = parseInt(channel.viewCount)
    const videos = parseInt(channel.videoCount)

    // Calculate engagement rate
    const engagementRate = subscribers > 0 ? (views / subscribers) * 100 : 0

    // Determine which channel has better metrics
    const hasMoreSubscribers = isWinner || subscribers > (channel.id === comparisonData.channel1Subscribers.toString() ? comparisonData.channel2Subscribers : comparisonData.channel1Subscribers)
    const hasMoreViews = isWinner || views > (channel.id === comparisonData.channel1Views.toString() ? comparisonData.channel2Views : comparisonData.channel1Views)

    if (hasMoreSubscribers) {
      insights.push("Stronger subscriber base creates a loyal audience")
    } else {
      insights.push("Needs to focus on subscriber growth strategies")
    }

    if (hasMoreViews) {
      insights.push("Higher engagement indicates compelling content")
    } else {
      insights.push("Could improve content to increase viewer engagement")
    }

    if (videos > 100) {
      insights.push("Consistent content creation builds audience retention")
    } else {
      insights.push("Increase posting frequency to build momentum")
    }

    if (engagementRate > 50) {
      insights.push("High engagement rate shows strong audience connection")
    } else if (engagementRate > 20) {
      insights.push("Moderate engagement rate - room for improvement")
    } else {
      insights.push("Low engagement rate - focus on audience interaction")
    }

    return insights
  }

  return (
    <div className="bg-white border border-gray-300 rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md transition">
      <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-gray-700" />
        Why {channel.title} {isWinner ? "Performs Better" : "Needs Improvement"}
      </h3>

      <ul className="space-y-2">
        {getInsights().map((insight, index) => (
          <li key={index} className="flex items-start gap-2">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isWinner ? "bg-green-100" : "bg-yellow-100"}`}>
              <div className={`w-2 h-2 rounded-full ${isWinner ? "bg-green-500" : "bg-yellow-500"}`}></div>
            </div>
            <p className="text-sm text-gray-700">{insight}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ViralTipsCard({ channel, tips }: { channel: YouTubeChannel; tips: string[] }) {
  return (
    <div className="bg-white border border-gray-300 rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md transition">
      <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-gray-700" />
        Tips for {channel.title}
      </h3>

      <ul className="space-y-3">
        {tips.map((tip, index) => (
          <li key={index} className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-gray-500"></div>
            </div>
            <p className="text-sm text-gray-700">{tip}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

function EnhancedAnalyticsCard({
  channel,
  videos,
  isWinner
}: {
  channel: YouTubeChannel;
  videos: YouTubeVideo[];
  isWinner: boolean;
}) {
  // Enhanced formatNumber function with better formatting
  const formatNumber = (num: string | number): string => {
    const n = typeof num === "string" ? parseInt(num) : num
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M"
    if (n >= 1000) return (n / 1000).toFixed(1) + "K"
    return n.toString()
  }



  // Define keyword type
  interface KeywordData {
    word: string;
    count: number;
    percentage: string;
    viralPotential: string;
  }

  // Extract keywords from video titles with frequency and percentage
  const extractKeywords = (vids: YouTubeVideo[]): KeywordData[] => {
    const allTitles = vids.map(video => video.title).join(' ')
    const words = allTitles.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/)
    const wordCount: { [key: string]: number } = {}
    const totalWords = words.length

    words.forEach(word => {
      if (word.length > 3) { // Only consider words longer than 3 characters
        wordCount[word] = (wordCount[word] || 0) + 1
      }
    })

    return Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({
        word,
        count,
        percentage: ((count / totalWords) * 100).toFixed(1),
        viralPotential: calculateViralPotential(word, vids)
      }))
  }

  // Calculate viral potential of a keyword based on video performance
  const calculateViralPotential = (keyword: string, vids: YouTubeVideo[]): string => {
    const matchingVideos = vids.filter(video =>
      video.title.toLowerCase().includes(keyword.toLowerCase())
    )

    if (matchingVideos.length === 0) return "0.00"

    // Calculate average engagement rate for videos with this keyword
    const totalEngagement = matchingVideos.reduce((sum, video) => {
      return sum + (video.likeCount + video.commentCount)
    }, 0)

    const totalViews = matchingVideos.reduce((sum, video) => {
      return sum + video.viewCount
    }, 0)

    if (totalViews === 0) return "0.00"

    return ((totalEngagement / totalViews) * 100).toFixed(2)
  }

  // Get best posting times
  const getBestPostingTimes = (vids: YouTubeVideo[]) => {
    const hours: { [key: number]: number } = {}
    const days: { [key: string]: number } = {}

    vids.forEach((video: YouTubeVideo) => {
      const date = new Date(video.publishedAt)
      const hour = date.getHours()
      const day = date.toLocaleDateString('en-US', { weekday: 'long' })

      hours[hour] = (hours[hour] || 0) + 1
      days[day] = (days[day] || 0) + 1
    })

    // Find most popular hour
    const bestHourEntries = Object.entries(hours)
      .sort((a, b) => b[1] - a[1])
    const bestHour = bestHourEntries[0]

    // Find most popular day
    const bestDayEntries = Object.entries(days)
      .sort((a, b) => b[1] - a[1])
    const bestDay = bestDayEntries[0]

    return {
      bestHour: bestHour ? `${bestHour[0]}:00` : 'N/A',
      bestDay: bestDay ? bestDay[0] : 'N/A'
    }
  }

  // Get top performing videos
  const getTopPerformingVideos = (vids: YouTubeVideo[], metric: 'views' | 'likes' | 'comments' = 'views') => {
    return [...vids]
      .sort((a, b) => {
        if (metric === 'views') return b.viewCount - a.viewCount
        if (metric === 'likes') return b.likeCount - a.likeCount
        return b.commentCount - a.commentCount
      })
      .slice(0, 3)
  }

  // Calculate engagement rate for individual videos
  const calculateVideoEngagementRate = (video: YouTubeVideo) => {
    if (video.viewCount === 0) return "0.00"
    return ((video.likeCount + video.commentCount) / video.viewCount * 100).toFixed(2)
  }

  // Use the helper functions
  const keywords = extractKeywords(videos)
  const postingTimes = getBestPostingTimes(videos)
  const topVideos = getTopPerformingVideos(videos, 'views')

  return (
    <div className="bg-white border border-gray-200 rounded-xl md:rounded-2xl p-4 md:p-6 backdrop-blur-sm shadow-sm">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-blue-500" />
        Enhanced Analytics for {channel.title}
      </h3>

      <div className="grid grid-cols-1 gap-6">
        {/* Keywords Analysis - Mobile Friendly */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-500" />
            Popular Keywords
          </h4>
          <div className="space-y-3">
            {keywords.map((keyword: KeywordData, index: number) => (
              <div key={index} className="flex flex-col p-3 bg-white rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-600">#{index + 1}</span>
                    </div>
                    <span className="font-medium text-gray-900">{keyword.word}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-center text-xs">
                    <div className="font-medium">{keyword.count}</div>
                    <div className="text-blue-600">uses</div>
                  </div>
                  <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-center text-xs">
                    <div className="font-medium">{keyword.percentage}%</div>
                    <div className="text-green-600">reach</div>
                  </div>
                  <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-center text-xs">
                    <div className="font-medium">{keyword.viralPotential}%</div>
                    <div className="text-purple-600">viral</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Best Posting Times - Mobile Friendly */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-green-500" />
            Best Posting Times
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
              <span className="text-sm text-gray-600">Best Day</span>
              <span className="font-medium">{postingTimes.bestDay}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
              <span className="text-sm text-gray-600">Best Hour</span>
              <span className="font-medium">{postingTimes.bestHour}</span>
            </div>
            <div className="pt-2 mt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Posting at these times increases your content's visibility by up to 40%
              </p>
            </div>
          </div>
        </div>

        {/* Top Performing Videos - Mobile Friendly */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-500" />
            Top Performing Videos
          </h4>
          <div className="space-y-3">
            {topVideos.map((video: YouTubeVideo, index: number) => (
              <div key={video.id} className="flex flex-col p-3 bg-white rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-600">#{index + 1}</span>
                  </div>
                  <div className="shrink-0">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-16 h-10 object-cover rounded"
                    />
                  </div>
                  <h5 className="text-sm font-medium text-gray-900 line-clamp-2 flex-1">{video.title}</h5>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-center text-xs">
                    <div className="font-medium">{formatNumber(video.viewCount)}</div>
                    <div className="text-blue-600">views</div>
                  </div>
                  <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-center text-xs">
                    <div className="font-medium">{formatNumber(video.likeCount)}</div>
                    <div className="text-green-600">likes</div>
                  </div>
                  <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-center text-xs">
                    <div className="font-medium">{calculateVideoEngagementRate(video)}%</div>
                    <div className="text-purple-600">engagement</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-yellow-500" />
          Recommendations
        </h4>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isWinner ? "bg-green-100" : "bg-yellow-100"}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isWinner ? "bg-green-500" : "bg-yellow-500"}`}></div>
            </div>
            <p className="text-sm text-gray-700">
              {isWinner
                ? "Continue using your successful keywords and posting schedule"
                : "Consider adopting similar keywords and posting times as your competitor"}
            </p>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
            </div>
            <p className="text-sm text-gray-700">
              Focus on creating content similar to your top performing videos
            </p>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-4 h-4 rounded-full bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
            </div>
            <p className="text-sm text-gray-700">
              Keywords with high viral potential (above 5%) should be prioritized in future content
            </p>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default function ComparePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [channel1Id, setChannel1Id] = useState("")
  const [channel2Id, setChannel2Id] = useState("")
  const [channel1, setChannel1] = useState<YouTubeChannel | null>(null)
  const [channel2, setChannel2] = useState<YouTubeChannel | null>(null)
  const [channel1Videos, setChannel1Videos] = useState<YouTubeVideo[]>([])
  const [channel2Videos, setChannel2Videos] = useState<YouTubeVideo[]>([])
  const [channel1Countries, setChannel1Countries] = useState<{ country: string, views: number }[]>([])
  const [channel2Countries, setChannel2Countries] = useState<{ country: string, views: number }[]>([])
  const [channel1Analytics, setChannel1Analytics] = useState<any>(null)
  const [channel2Analytics, setChannel2Analytics] = useState<any>(null)
  const [channel1TopVideosResolved, setChannel1TopVideosResolved] = useState<any[]>([])
  const [channel2TopVideosResolved, setChannel2TopVideosResolved] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showVideos, setShowVideos] = useState<"channel1" | "channel2" | "comparison" | null>(null)
  const [videosLoading, setVideosLoading] = useState(false)
  const [channel1Loading, setChannel1Loading] = useState(false)
  const [channel2Loading, setChannel2Loading] = useState(false)
  const [showUpgradeCard, setShowUpgradeCard] = useState(false)

  // Helper function to extract channel ID from YouTube URL or return ID as is
  const extractChannelId = (input: string): string => {
    if (!input) return ""
    
    // Remove any query parameters (everything after ?)
    let cleanInput = input.split('?')[0].trim()
    
    // Remove trailing slashes
    cleanInput = cleanInput.replace(/\/$/, '')
    
    // If it's already a channel ID (starts with UC and is 24 chars)
    if (cleanInput.match(/^UC[a-zA-Z0-9_-]{22}$/)) {
      return cleanInput
    }
    
    // Extract @username from youtube.com/@username
    const customUrlMatch = cleanInput.match(/youtube\.com\/@([a-zA-Z0-9_.]+)$/)
    if (customUrlMatch) {
      return customUrlMatch[1]
    }
    
    // Extract username from youtube.com/c/username
    const cUrlMatch = cleanInput.match(/youtube\.com\/c\/([a-zA-Z0-9_-]+)$/)
    if (cUrlMatch) {
      return cUrlMatch[1]
    }
    
    // Extract from youtube.com/channel/ID
    const channelIdMatch = cleanInput.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})$/)
    if (channelIdMatch) {
      return channelIdMatch[1]
    }
    
    // If it starts with @, return as is (it's a handle)
    if (cleanInput.startsWith('@')) {
      return cleanInput.substring(1)
    }
    
    // If it looks like just a handle/username, return as is
    if (cleanInput.match(/^[a-zA-Z0-9_.]+$/) && !cleanInput.includes('youtube')) {
      return cleanInput
    }
    
    // If nothing matched but it looks like a URL, try to extract @username part
    if (cleanInput.includes('youtube.com/@')) {
      const parts = cleanInput.split('youtube.com/@')
      if (parts[1]) {
        return parts[1]
      }
    }
    
    return cleanInput
  }

  const navLinks = [
    { icon: Home, label: "Dashboard", href: "/dashboard", id: "dashboard" },
    { icon: GitCompare, label: "Compare", href: "/compare", id: "compare" },
    { icon: Video, label: "Videos", href: "/videos", id: "videos" },
    { icon: Upload, label: "Bulk Upload", href: "/bulk-upload", id: "bulk-upload" },
  ]

  const handleNavClick = (href: string, id: string) => {
    if (id === "compare") {
      setSidebarOpen(false)
      return
    }
    router.push(href)
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push("/")
  }

  // Enhanced formatNumber function with better formatting
  const formatNumber = (num: string | number): string => {
    const n = typeof num === "string" ? parseInt(num) : num
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M"
    if (n >= 1000) return (n / 1000).toFixed(1) + "K"
    return n.toString()
  }

  // Calculate engagement rate for a channel
  const calculateEngagementRate = (_channel: YouTubeChannel, videos?: YouTubeVideo[]) => {
    const vids = Array.isArray(videos) ? videos : []
    const totalViews = vids.reduce((sum, v) => sum + (typeof v.viewCount === 'number' ? v.viewCount : 0), 0)
    const totalEngagement = vids.reduce((sum, v) => sum + (typeof v.likeCount === 'number' ? v.likeCount : 0) + (typeof v.commentCount === 'number' ? v.commentCount : 0), 0)
    if (totalViews === 0) return "0.00"
    return ((totalEngagement / totalViews) * 100).toFixed(2)
  }

  // Calculate avg views per video
  const calculateAvgViews = (channel: YouTubeChannel) => {
    const views = parseInt(channel.viewCount)
    const videos = parseInt(channel.videoCount)
    if (videos === 0) return 0
    return Math.floor(views / videos)
  }

  // Calculate avg likes per video
  const calculateAvgLikes = (channel: YouTubeChannel) => {
    // This is a simplified calculation - in a real app, we'd need actual like data per video
    const views = parseInt(channel.viewCount)
    const videos = parseInt(channel.videoCount)
    if (videos === 0) return 0
    // Assuming 5% likes per view as a rough estimate
    return Math.floor((views * 0.05) / videos)
  }

  // Compute high-level difference summary
  const computeDiffSummary = (c1: YouTubeChannel, c2: YouTubeChannel) => {
    try {
      const s1 = parseInt(c1.subscriberCount)
      const s2 = parseInt(c2.subscriberCount)
      const v1 = parseInt(c1.viewCount)
      const v2 = parseInt(c2.viewCount)
      const e1 = parseFloat(calculateEngagementRate(c1, channel1Videos))
      const e2 = parseFloat(calculateEngagementRate(c2, channel2Videos))

      return {
        subscribersDiff: Math.abs(s1 - s2),
        viewsDiff: Math.abs(v1 - v2),
        engagementDiff: Math.abs(e1 - e2).toFixed(1),
        winnerIsChannel1: parseInt(getChannelRank(c1)) < parseInt(getChannelRank(c2))
      }
    } catch (e) {
      return { subscribersDiff: 0, viewsDiff: 0, engagementDiff: '0.0', winnerIsChannel1: true }
    }
  }

  // Extract keywords from video titles
  const extractKeywords = (videos: YouTubeVideo[]) => {
    const allTitles = videos.map(video => video.title).join(' ')
    const words = allTitles.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/)
    const wordCount: { [key: string]: number } = {}

    words.forEach(word => {
      if (word.length > 3) { // Only consider words longer than 3 characters
        wordCount[word] = (wordCount[word] || 0) + 1
      }
    })

    return Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }))
  }

  // Get best posting times
  const getBestPostingTimes = (videos: YouTubeVideo[]) => {
    const hours: { [key: number]: number } = {}
    const days: { [key: string]: number } = {}

    videos.forEach(video => {
      const date = new Date(video.publishedAt)
      const hour = date.getHours()
      const day = date.toLocaleDateString('en-US', { weekday: 'long' })

      hours[hour] = (hours[hour] || 0) + 1
      days[day] = (days[day] || 0) + 1
    })

    // Find most popular hour
    const bestHour = Object.entries(hours)
      .sort((a, b) => b[1] - a[1])[0]

    // Find most popular day
    const bestDay = Object.entries(days)
      .sort((a, b) => b[1] - a[1])[0]

    return {
      bestHour: bestHour ? `${bestHour[0]}:00` : 'N/A',
      bestDay: bestDay ? bestDay[0] : 'N/A'
    }
  }

  // Get top performing videos
  const getTopPerformingVideos = (videos: YouTubeVideo[], metric: 'views' | 'likes' | 'comments' = 'views') => {
    return [...videos]
      .sort((a, b) => {
        if (metric === 'views') return b.viewCount - a.viewCount
        if (metric === 'likes') return b.likeCount - a.likeCount
        return b.commentCount - a.commentCount
      })
      .slice(0, 3)
  }

  // Calculate engagement rate for individual videos
  const calculateVideoEngagementRate = (video: YouTubeVideo) => {
    if (video.viewCount === 0) return "0.00"
    return ((video.likeCount + video.commentCount) / video.viewCount * 100).toFixed(2)
  }

  // Resolve channel handle (@username or /c/username) to channel ID
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

  const fetchChannelData = async (channelId: string) => {
    try {
      const response = await fetch(`/api/youtube/channelById?channelId=${encodeURIComponent(channelId)}`)
      const data = await response.json()

      if (data.success && data.channel) {
        return data.channel
      } else {
        throw new Error(data.error || "Failed to fetch channel data")
      }
    } catch (error: any) {
      throw new Error(error.message || "Error fetching channel data")
    }
  }

  const fetchChannelVideos = async (channelId: string) => {
    try {
      const response = await fetch(`/api/youtube/videos?channelId=${encodeURIComponent(channelId)}&maxResults=10`)
      const data = await response.json()

      if (data.success && data.videos) {
        return data.videos
      } else {
        throw new Error(data.error || "Failed to fetch channel videos")
      }
    } catch (error: any) {
      throw new Error(error.message || "Error fetching channel videos")
    }
  }

  const fetchTopCountries = async (channelId: string, setter: (c: { country: string, views: number }[]) => void) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('youtube_access_token') : null
      if (!token) return setter([])
      const res = await fetch(`/api/youtube/analytics/topCountries?channelId=${encodeURIComponent(channelId)}&access_token=${encodeURIComponent(token)}`)
      const data = await res.json()
      if (data?.success && Array.isArray(data.countries)) {
        setter(data.countries)
      } else {
        console.warn('topCountries: no data', data)
        setter([])
      }
    } catch (e) {
      console.error('fetchTopCountries error', e)
      setter([])
    }
  }

  const fetchChannelAnalytics = async (channelId: string, setter: (a: any) => void) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('youtube_access_token') : null
      if (!token) return setter(null)
      const res = await fetch(`/api/youtube/analytics/summary?channelId=${encodeURIComponent(channelId)}&access_token=${encodeURIComponent(token)}`)
      const data = await res.json()
      if (data?.success) {
        setter(data)
      } else {
        console.warn('fetchChannelAnalytics: no data', data)
        setter(null)
      }
    } catch (e) {
      console.error('fetchChannelAnalytics error', e)
      setter(null)
    }
  }

  const fetchVideoDetails = async (ids: string[]) => {
    if (!ids || !ids.length) return []
    try {
      const res = await fetch(`/api/youtube/videosByIds?ids=${encodeURIComponent(ids.join(','))}`)
      const data = await res.json()
      if (data?.success) return data.videos
    } catch (e) {
      console.error('fetchVideoDetails error', e)
    }
    return []
  }

  const handleCompareVideos = async () => {
    if (!channel1 || !channel2) {
      setError("Please compare channels first")
      return
    }

    try {
      setLoading(true)
      setError(null)

      const [channel1Videos, channel2Videos] = await Promise.all([
        fetchChannelVideos(channel1.id),
        fetchChannelVideos(channel2.id)
      ])

      setChannel1Videos(channel1Videos)
      setChannel2Videos(channel2Videos)

      // Show a comparison view by setting a specific state
      // We'll create a new state to indicate we're in video comparison mode
      setShowVideos("comparison")
    } catch (err: any) {
      setError(err.message || "Error comparing videos")
    } finally {
      setLoading(false)
    }
  }

  const handleCompare = async () => {
    if (!channel1Id.trim() || !channel2Id.trim()) {
      setError("Please enter both channel URLs or IDs")
      return
    }

    // Check credits before comparing
    try {
      const creditsRes = await fetch('/api/credits')
      if (!creditsRes.ok) {
        setError('Failed to check credits')
        return
      }
      
      const creditsData = await creditsRes.json()
      if (creditsData.credits < CREDIT_COSTS.COMPARE) {
        setShowUpgradeCard(true)
        return
      }
    } catch (err) {
      console.error('Error checking credits:', err)
      setError('Failed to verify credits')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const [resolved1, resolved2] = await Promise.all([
        resolveChannelHandle(extractChannelId(channel1Id.trim())),
        resolveChannelHandle(extractChannelId(channel2Id.trim())),
      ])

      const [channel1Data, channel2Data] = await Promise.all([
        fetchChannelData(resolved1),
        fetchChannelData(resolved2)
      ])

      // Deduct credits after successful API calls
      try {
        const deductRes = await fetch('/api/credits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: CREDIT_COSTS.COMPARE, feature: 'channel_compare' })
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
      } catch (err) {
        console.error('Error deducting credits:', err)
        // Continue even if credit deduction fails
      }

      // also fetch a small set of recent videos for each channel to populate keywords/analytics
      setVideosLoading(true)
      const [c1Videos, c2Videos] = await Promise.all([
        fetchChannelVideos(resolved1),
        fetchChannelVideos(resolved2)
      ])

      setChannel1(channel1Data)
      setChannel2(channel2Data)
      setChannel1Videos(c1Videos || [])
      setChannel2Videos(c2Videos || [])
      // attempt to fetch top countries if owner token available
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('youtube_access_token')
        if (token) {
          fetchTopCountries(resolved1, setChannel1Countries)
          fetchTopCountries(resolved2, setChannel2Countries)
          fetchChannelAnalytics(resolved1, setChannel1Analytics)
          fetchChannelAnalytics(resolved2, setChannel2Analytics)
            // resolve top video IDs to titles+thumbnails for better UX
            ; (async () => {
              try {
                const c1vids = (c1Videos || []).slice(0, 5).map((v: any) => v.id)
                const c2vids = (c2Videos || []).slice(0, 5).map((v: any) => v.id)
                const [r1, r2] = await Promise.all([fetchVideoDetails(c1vids), fetchVideoDetails(c2vids)])
                setChannel1TopVideosResolved(r1)
                setChannel2TopVideosResolved(r2)
              } catch (e) {
                console.warn('resolve top videos failed', e)
              }
            })()
        }
      }
      setShowVideos(null)
    } catch (err: any) {
      setError(err.message || "Channel not found. Please check the URL or ID and try again.")
    } finally {
      setLoading(false)
      setVideosLoading(false)
    }
  }

  const handleShowVideos = async (channelId: string, channelNumber: "channel1" | "channel2") => {
    try {
      setVideosLoading(true)
      setShowVideos(channelNumber)

      const videos = await fetchChannelVideos(channelId)

      if (channelNumber === "channel1") {
        setChannel1Videos(videos)
      } else {
        setChannel2Videos(videos)
      }
    } catch (err: any) {
      setError(err.message || "Error fetching videos")
    } finally {
      setVideosLoading(false)
    }
  }

  const getChannelRank = (channel: YouTubeChannel) => {
    // Simple ranking based on subscribers, views, and video count
    const subscribers = parseInt(channel.subscriberCount)
    const views = parseInt(channel.viewCount)
    const videos = parseInt(channel.videoCount)

    // Normalize values (these are example weights)
    const subscriberScore = subscribers / 10000
    const viewScore = views / 100000
    const videoScore = videos / 10

    const totalScore = subscriberScore + viewScore + videoScore

    // Simple ranking - lower score = higher rank
    return totalScore > 100 ? "100+" : Math.max(1, Math.floor(totalScore)).toString()
  }

  const getViralTips = (channel: YouTubeChannel) => {
    const subscribers = parseInt(channel.subscriberCount)
    const views = parseInt(channel.viewCount)
    const videos = parseInt(channel.videoCount)

    const tips = []

    if (subscribers < 1000) {
      tips.push("Focus on consistent content creation to build your subscriber base")
    }

    if (views / videos < 1000) {
      tips.push("Improve your thumbnails and titles to increase click-through rates")
    }

    tips.push("Post consistently and engage with your audience in comments")
    tips.push("Use relevant keywords in your titles and descriptions")
    tips.push("Collaborate with other creators in your niche")

    return tips
  }

  // Top keywords derived from recent videos
  const channel1TopKeywords = React.useMemo(() => computeTopKeywords(channel1Videos), [channel1Videos])
  const channel2TopKeywords = React.useMemo(() => computeTopKeywords(channel2Videos), [channel2Videos])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Notification bell (replaces full header) */}
      <div className="fixed top-4 right-4 z-50">
        <NotificationBell />
      </div>

      <div className="flex flex-1">
        {/* Shared Sidebar */}
        <SharedSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activePage="compare" isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
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
            {/* Header Title - Centered */}
            <div className="flex items-center justify-center mb-8 mt-8 md:mt-10">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Channel Comparison</h1>
            </div>

            {/* Mobile Title */}
            <div className="md:hidden text-center mb-6 mt-6">
              <p className="text-sm text-gray-600">Compare two YouTube channels side by side</p>
            </div>

            {/* Info Banner */}
            <div className="mb-8 rounded-xl bg-white border border-gray-200 p-4 sm:p-6 shadow-sm hover:shadow-md transition-all">
              <p className="text-sm sm:text-base text-gray-700 flex items-start gap-2">
                <Lightbulb className="w-5 h-5 text-gray-900 shrink-0 mt-0.5" />
                <span>Compare two YouTube channels to see which one performs better and get tips to improve your content</span>
              </p>
            </div>

            {/* Channel ID Input Section - White Premium Design */}
            <div className="mb-8 bg-white border border-gray-300 rounded-2xl p-6 sm:p-8 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Enter Channel IDs or URLs to Compare</h2>
                <div className="bg-orange-50 border border-orange-300 px-3 py-1.5 rounded-lg">
                  <span className="text-sm font-semibold text-orange-700">{CREDIT_COSTS.COMPARE} Credits</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-8">Paste Channel ID, URL, or @username</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8">
                {/* Channel 1 Input */}
                <div className="space-y-3">
                  <div className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-600" />
                    <span>Channel 1</span>
                  </div>
                  <div className="flex gap-3 h-12">
                    <Input
                      type="text"
                      value={channel1Id}
                      onChange={(e) => setChannel1Id(e.target.value)}
                      placeholder="UC_x5XG1OV2P6uZZ5FSM9Ttw or youtube.com/channel/ID"
                      className="flex-1 border border-gray-300 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 rounded-xl bg-white px-4 text-gray-900 placeholder-gray-500"
                    />
                  </div>
                </div>

                {/* Channel 2 Input */}
                <div className="space-y-3">
                  <div className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-600" />
                    <span>Channel 2</span>
                  </div>
                  <div className="flex gap-3 h-12">
                    <Input
                      type="text"
                      value={channel2Id}
                      onChange={(e) => setChannel2Id(e.target.value)}
                      placeholder="UC3XTzVzaHQEd30rQbuvCtTQ or youtube.com/channel/ID"
                      className="flex-1 border border-gray-300 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 rounded-xl bg-white px-4 text-gray-900 placeholder-gray-500"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-8 p-4 sm:p-5 bg-white border-2 border-gray-300 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-gray-600 shrink-0 mt-0.5" />
                  <p className="text-gray-700 text-sm font-medium">{error}</p>
                </div>
              )}

              <Button
                onClick={handleCompare}
                disabled={loading || !channel1Id.trim() || !channel2Id.trim()}
                className="w-full bg-black hover:bg-gray-900 text-white font-bold py-3 px-6 rounded-xl transition-all h-12 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-900 rounded-full animate-spin"></div>
                    <span>Comparing...</span>
                  </>
                ) : (
                  <>
                    <GitCompare className="w-5 h-5" />
                    <span>Compare Channels</span>
                  </>
                )}
              </Button>
            </div>

            {/* How to Use Guide Card */}
            <div className="mb-8 border border-blue-200 bg-blue-50 rounded-xl shadow-sm p-5">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm">How to Use</h4>
                  <div className="space-y-3 text-sm text-gray-700">
                    <div>
                      <p className="font-medium text-gray-900 mb-1">📺 Channel ID Formats:</p>
                      <p className="text-xs ml-5">You can use any of these formats for each channel</p>
                      <div className="ml-5 mt-1 space-y-1 text-xs text-gray-600">
                        <div>✅ <code className="bg-white px-2 py-1 rounded">@channelname</code> (Channel handle)</div>
                        <div>✅ <code className="bg-white px-2 py-1 rounded">UCxxxxxxxxxxxxxxxxxxxxxX</code> (Channel ID)</div>
                        <div>✅ <code className="bg-white px-2 py-1 rounded">youtube.com/channel/UCxxx</code> (Full URL)</div>
                        <div>✅ <code className="bg-white px-2 py-1 rounded">youtube.com/@username</code> (Handle URL)</div>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 mb-1">🔍 What You'll Get:</p>
                      <div className="ml-5 space-y-1 text-xs text-gray-600">
                        <div>• <strong>Side-by-side comparison</strong> - Subscriber counts, total views, video counts, and engagement rates</div>
                        <div>• <strong>Winner analysis</strong> - See which channel performs better and why</div>
                        <div>• <strong>Top performing videos</strong> - Discover what content works best for each channel</div>
                        <div>• <strong>Keyword insights</strong> - Find trending keywords used in successful video titles</div>
                        <div>• <strong>Best posting times</strong> - Learn optimal days and hours for maximum reach</div>
                        <div>• <strong>Audience geography</strong> - View top countries watching each channel</div>
                        <div>• <strong>Performance metrics</strong> - Average views, likes, and comments per video</div>
                        <div>• <strong>Actionable recommendations</strong> - Get specific tips to improve your channel based on competitor analysis</div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-blue-200">
                      <p className="font-medium text-gray-900 mb-1">💡 Pro Tip:</p>
                      <p className="text-xs ml-5">Compare your channel with a successful competitor in your niche. Study their posting schedule, keyword usage, and content strategy. Apply these insights to boost your own channel's growth!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Comparison Results */}
            {channel1 && channel2 && (
              <div className="space-y-6 mt-8">
                {/* Quick Summary Cards */}
                {
                  (() => {
                    const diff = computeDiffSummary(channel1, channel2)
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-300 shadow-sm hover:shadow-md transition-all">
                          <div className="text-xs text-gray-500 font-medium">Subscribers Gap</div>
                          <div className="mt-3 text-xl sm:text-2xl font-bold text-gray-900">{formatNumber(diff.subscribersDiff)}</div>
                          <div className="text-xs text-gray-600 mt-2">{diff.winnerIsChannel1 ? channel1.title + ' leads' : channel2.title + ' leads'}</div>
                        </div>

                        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-300 shadow-sm hover:shadow-md transition-all">
                          <div className="text-xs text-gray-500 font-medium">Views Gap</div>
                          <div className="mt-3 text-xl sm:text-2xl font-bold text-gray-900">{formatNumber(diff.viewsDiff)}</div>
                          <div className="text-xs text-gray-600 mt-2">{diff.winnerIsChannel1 ? channel1.title + ' leads' : channel2.title + ' leads'}</div>
                        </div>

                        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-300 shadow-sm hover:shadow-md transition-all">
                          <div className="text-xs text-gray-500 font-medium">Engagement Difference</div>
                          <div className="mt-3 text-xl sm:text-2xl font-bold text-gray-900">{diff.engagementDiff}%</div>
                          <div className="text-xs text-gray-600 mt-2">Higher = better</div>
                        </div>
                      </div>
                    )
                  })()
                }

                {/* Winner/Loser Banner */}
                <div className="bg-white border border-gray-300 rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div className={`text-center p-6 rounded-xl border ${getChannelRank(channel1) < getChannelRank(channel2) ? 'bg-gray-900 border-gray-900 text-white' : 'bg-gray-50 border-gray-300'}`}>
                      <div className="text-3xl mb-2">{getChannelRank(channel1) < getChannelRank(channel2) ? '🏆' : '🥈'}</div>
                      <h3 className={`text-xl font-bold mb-2 ${getChannelRank(channel1) < getChannelRank(channel2) ? 'text-white' : 'text-gray-900'}`}>{channel1.title}</h3>
                      <p className={`text-sm font-semibold ${getChannelRank(channel1) < getChannelRank(channel2) ? 'text-white' : 'text-gray-700'}`}>
                        {getChannelRank(channel1) < getChannelRank(channel2) ? '✓ WINNER' : '2ND PLACE'}
                      </p>
                    </div>
                    <div className={`text-center p-6 rounded-xl border ${getChannelRank(channel2) < getChannelRank(channel1) ? 'bg-gray-900 border-gray-900 text-white' : 'bg-gray-50 border-gray-300'}`}>
                      <div className="text-3xl mb-2">{getChannelRank(channel2) < getChannelRank(channel1) ? '🏆' : '🥈'}</div>
                      <h3 className={`text-xl font-bold mb-2 ${getChannelRank(channel2) < getChannelRank(channel1) ? 'text-white' : 'text-gray-900'}`}>{channel2.title}</h3>
                      <p className={`text-sm font-semibold ${getChannelRank(channel2) < getChannelRank(channel1) ? 'text-white' : 'text-gray-700'}`}>
                        {getChannelRank(channel2) < getChannelRank(channel1) ? '✓ WINNER' : '2ND PLACE'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="relative">
                    {getChannelRank(channel1) < getChannelRank(channel2) && (
                      <div className="absolute -top-3 -right-3 z-10 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">🏆 Winner</div>
                    )}
                    {getChannelRank(channel1) > getChannelRank(channel2) && (
                      <div className="absolute -top-3 -right-3 z-10 bg-gray-400 text-white px-3 py-1 rounded-full text-xs font-bold">2nd Place</div>
                    )}
                    <ChannelCard
                      channel={channel1}
                      rank={getChannelRank(channel1)}
                      isWinner={getChannelRank(channel1) < getChannelRank(channel2)}
                      videos={channel1Videos}
                    />
                  </div>
                  <div className="relative">
                    {getChannelRank(channel2) < getChannelRank(channel1) && (
                      <div className="absolute -top-3 -right-3 z-10 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">🏆 Winner</div>
                    )}
                    {getChannelRank(channel2) > getChannelRank(channel1) && (
                      <div className="absolute -top-3 -right-3 z-10 bg-gray-400 text-white px-3 py-1 rounded-full text-xs font-bold">2nd Place</div>
                    )}
                    <ChannelCard
                      channel={channel2}
                      rank={getChannelRank(channel2)}
                      isWinner={getChannelRank(channel2) < getChannelRank(channel1)}
                      videos={channel2Videos}
                    />
                  </div>
                </div>

                {/* Top 3 Videos Comparison */}
                <div className="bg-white border border-gray-300 rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Play className="w-5 h-5 text-gray-700" />
                    Top 3 Performing Videos
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Channel 1 Top Videos */}
                    <div>
                      <h4 className="font-semibold text-blue-600 mb-4 text-sm sm:text-base">{channel1.title}</h4>
                      <div className="space-y-3">
                        {channel1Videos.slice(0, 3).map((video, idx) => (
                          <div key={video.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition">
                            <div className="flex gap-3">
                              <div className="shrink-0 w-16 h-9 rounded bg-gray-200 relative">
                                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover rounded" />
                                <span className="absolute top-0.5 right-0.5 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded font-bold">#{idx + 1}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2">{video.title}</h5>
                                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                  <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                    <div className="font-semibold">{formatNumber(video.viewCount)}</div>
                                    <div className="text-blue-600">views</div>
                                  </div>
                                  <div className="bg-purple-50 text-purple-700 px-2 py-1 rounded">
                                    <div className="font-semibold">{calculateVideoEngagementRate(video)}%</div>
                                    <div className="text-purple-600">engagement</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {channel1Videos.length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-4">No videos found</p>
                        )}
                      </div>
                    </div>

                    {/* Channel 2 Top Videos */}
                    <div>
                      <h4 className="font-semibold text-purple-600 mb-4 text-sm sm:text-base">{channel2.title}</h4>
                      <div className="space-y-3">
                        {channel2Videos.slice(0, 3).map((video, idx) => (
                          <div key={video.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition">
                            <div className="flex gap-3">
                              <div className="shrink-0 w-16 h-9 rounded bg-gray-200 relative">
                                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover rounded" />
                                <span className="absolute top-0.5 right-0.5 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded font-bold">#{idx + 1}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2">{video.title}</h5>
                                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                  <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                    <div className="font-semibold">{formatNumber(video.viewCount)}</div>
                                    <div className="text-blue-600">views</div>
                                  </div>
                                  <div className="bg-purple-50 text-purple-700 px-2 py-1 rounded">
                                    <div className="font-semibold">{calculateVideoEngagementRate(video)}%</div>
                                    <div className="text-purple-600">engagement</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {channel2Videos.length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-4">No videos found</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Keywords */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="bg-white border border-gray-300 rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all">
                    <h4 className="font-semibold text-gray-900 mb-4 text-sm sm:text-base">Top Keywords — {channel1.title}</h4>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {channel1TopKeywords.length ? channel1TopKeywords.map(k => (
                        <span key={k} className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg border border-gray-300">{k}</span>
                      )) : <span className="text-sm text-gray-500">No keywords found</span>}
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                      <h5 className="font-medium text-sm text-gray-900 mb-3">Top Countries</h5>
                      {channel1Countries.length ? (
                        <ol className="text-xs text-gray-700 space-y-2">
                          {channel1Countries.map(c => (
                            <li key={c.country} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                              <span className="font-medium">{c.country}</span>
                              <span className="font-bold text-gray-700">{formatNumber(c.views)}</span>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="text-xs text-gray-500 p-2 bg-gray-50 rounded-lg">No country data available</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-white border border-gray-300 rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all">
                    <h4 className="font-semibold text-gray-900 mb-4 text-sm sm:text-base">Top Keywords — {channel2.title}</h4>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {channel2TopKeywords.length ? channel2TopKeywords.map(k => (
                        <span key={k} className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg border border-gray-300">{k}</span>
                      )) : <span className="text-sm text-gray-500">No keywords found</span>}
                    </div>
                    <div className="mt-3">
                      <h5 className="font-medium text-sm text-gray-900 mb-3">Top Countries (last 365 days)</h5>
                      {channel2Countries.length ? (
                        <ol className="text-xs text-gray-700 space-y-2">
                          {channel2Countries.map(c => (
                            <li key={c.country} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                              <span className="font-medium">{c.country}</span>
                              <span className="font-semibold text-gray-700">{formatNumber(c.views)}</span>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="text-xs text-gray-500 p-2 bg-gray-50 rounded-lg">No country data. Connect owner access token to fetch analytics.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Performance Comparison - Simplified & Premium */}
                <div className="bg-white border border-gray-300 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-gray-700" />
                    Performance Comparison
                  </h2>

                  {/* Mobile-friendly metric cards - Simplified */}
                  <div className="grid grid-cols-1 gap-3 md:hidden">
                    {/* Channel 1 Metrics */}
                    <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3 text-center text-sm">{channel1.title}</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Subscribers</span>
                          <span className="font-semibold">{formatNumber(channel1.subscriberCount)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Total Views</span>
                          <span className="font-semibold">{formatNumber(channel1.viewCount)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Videos</span>
                          <span className="font-semibold">{formatNumber(channel1.videoCount)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-300">
                          <span className="text-gray-600">Engagement</span>
                          <span className="font-semibold text-gray-900">{calculateEngagementRate(channel1, channel1Videos)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Channel 2 Metrics */}
                    <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3 text-center text-sm">{channel2.title}</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Subscribers</span>
                          <span className="font-semibold">{formatNumber(channel2.subscriberCount)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Total Views</span>
                          <span className="font-semibold">{formatNumber(channel2.viewCount)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Videos</span>
                          <span className="font-semibold">{formatNumber(channel2.videoCount)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-300">
                          <span className="text-gray-600">Engagement</span>
                          <span className="font-semibold text-gray-900">{calculateEngagementRate(channel2, channel2Videos)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>


                  {/* Desktop table view - simplified */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-gray-300">
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Metric</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">{channel1.title}</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">{channel2.title}</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Difference</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-100 hover:bg-blue-50/50">
                          <td className="py-3 px-4 text-gray-700 font-medium text-sm">Subscribers</td>
                          <td className="py-3 px-4 font-semibold">{formatNumber(channel1.subscriberCount)}</td>
                          <td className="py-3 px-4 font-semibold">{formatNumber(channel2.subscriberCount)}</td>
                          <td className="py-3 px-4">
                            <span className={`font-semibold ${parseInt(channel1.subscriberCount) > parseInt(channel2.subscriberCount) ? "text-green-600" : "text-red-600"}`}>
                              {formatNumber(Math.abs(parseInt(channel1.subscriberCount) - parseInt(channel2.subscriberCount)))}
                            </span>
                          </td>
                        </tr>
                        <tr className="border-b border-gray-100 hover:bg-blue-50/50">
                          <td className="py-3 px-4 text-gray-700 font-medium text-sm">Total Views</td>
                          <td className="py-3 px-4 font-semibold">{formatNumber(channel1.viewCount)}</td>
                          <td className="py-3 px-4 font-semibold">{formatNumber(channel2.viewCount)}</td>
                          <td className="py-3 px-4">
                            <span className={`font-semibold ${parseInt(channel1.viewCount) > parseInt(channel2.viewCount) ? "text-green-600" : "text-red-600"}`}>
                              {formatNumber(Math.abs(parseInt(channel1.viewCount) - parseInt(channel2.viewCount)))}
                            </span>
                          </td>
                        </tr>
                        <tr className="border-b border-gray-100 hover:bg-blue-50/50">
                          <td className="py-3 px-4 text-gray-700 font-medium text-sm">Videos</td>
                          <td className="py-3 px-4 font-semibold">{formatNumber(channel1.videoCount)}</td>
                          <td className="py-3 px-4 font-semibold">{formatNumber(channel2.videoCount)}</td>
                          <td className="py-3 px-4">
                            <span className={`font-semibold ${parseInt(channel1.videoCount) > parseInt(channel2.videoCount) ? "text-green-600" : "text-red-600"}`}>
                              {formatNumber(Math.abs(parseInt(channel1.videoCount) - parseInt(channel2.videoCount)))}
                            </span>
                          </td>
                        </tr>
                        <tr className="border-b border-gray-100 hover:bg-blue-50/50">
                          <td className="py-3 px-4 text-gray-700 font-medium text-sm">Avg Views/Video</td>
                          <td className="py-3 px-4 font-semibold">{formatNumber(calculateAvgViews(channel1))}</td>
                          <td className="py-3 px-4 font-semibold">{formatNumber(calculateAvgViews(channel2))}</td>
                          <td className="py-3 px-4">
                            <span className={`font-semibold ${calculateAvgViews(channel1) > calculateAvgViews(channel2) ? "text-green-600" : "text-red-600"}`}>
                              {formatNumber(Math.abs(calculateAvgViews(channel1) - calculateAvgViews(channel2)))}
                            </span>
                          </td>
                        </tr>
                        <tr className="hover:bg-blue-50/50">
                          <td className="py-3 px-4 text-gray-700 font-medium text-sm">Engagement</td>
                          <td className="py-3 px-4 font-semibold">{calculateEngagementRate(channel1, channel1Videos)}%</td>
                          <td className="py-3 px-4 font-semibold">{calculateEngagementRate(channel2, channel2Videos)}%</td>
                          <td className="py-3 px-4">
                            <span className={`font-semibold ${parseFloat(calculateEngagementRate(channel1, channel1Videos)) > parseFloat(calculateEngagementRate(channel2, channel2Videos)) ? "text-green-600" : "text-red-600"}`}>
                              {Math.abs(parseFloat(calculateEngagementRate(channel1, channel1Videos)) - parseFloat(calculateEngagementRate(channel2, channel2Videos))).toFixed(2)}%
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Add Compare Videos Button */}
                  <div className="mt-6 flex justify-center">
                    <Button
                      onClick={handleCompareVideos}
                      className="bg-black hover:bg-gray-900 text-white font-bold py-2 px-6 rounded-lg transition-all"
                    >
                      <GitCompare className="w-4 h-4 mr-2" />
                      Compare Videos
                    </Button>
                  </div>
                </div>

                {/* Video Listings */}
                {(showVideos === "channel1" || showVideos === "channel2" || showVideos === "comparison") && (
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-6">
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                        {showVideos === "channel1"
                          ? `${channel1?.title} - Videos`
                          : showVideos === "channel2"
                            ? `${channel2?.title} - Videos`
                            : `Video Comparison`}
                      </h2>
                      <Button
                        variant="outline"
                        onClick={() => setShowVideos(null)}
                        className="flex items-center gap-2 text-xs sm:text-sm"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                      </Button>
                    </div>

                    {videosLoading ? (
                      <div className="flex justify-center items-center h-32">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : showVideos === "comparison" ? (
                      // Video comparison view
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <h3 className="font-bold text-gray-900 mb-3 text-center text-sm sm:text-base">{channel1?.title}</h3>
                            <div className="space-y-2">
                              {channel1Videos.map((video) => (
                                <div key={video.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition">
                                  <div className="flex gap-3">
                                    <div className="shrink-0">
                                      <img
                                        src={video.thumbnail}
                                        alt={video.title}
                                        className="w-20 h-12 object-cover rounded"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-medium text-gray-900 text-xs sm:text-sm line-clamp-2 mb-1">{video.title}</h4>
                                      <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Eye className="w-3 h-3" />
                                        {formatNumber(video.viewCount)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h3 className="font-bold text-gray-900 mb-3 text-center text-sm sm:text-base">{channel2?.title}</h3>
                            <div className="space-y-2">
                              {channel2Videos.map((video) => (
                                <div key={video.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition">
                                  <div className="flex gap-3">
                                    <div className="shrink-0">
                                      <img
                                        src={video.thumbnail}
                                        alt={video.title}
                                        className="w-20 h-12 object-cover rounded"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-medium text-gray-900 text-xs sm:text-sm line-clamp-2 mb-1">{video.title}</h4>
                                      <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Eye className="w-3 h-3" />
                                        {formatNumber(video.viewCount)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Video comparison summary */}
                        <div className="bg-blue-50 rounded-xl p-4 mt-4">
                          <h3 className="font-bold text-gray-900 mb-3 text-sm">Video Comparison Summary</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="bg-white p-3 rounded-lg text-center text-xs">
                              <p className="text-gray-600 mb-1">Avg. Views</p>
                              <p className="font-bold text-sm">
                                {channel1 && channel1Videos.length > 0
                                  ? formatNumber(Math.round(channel1Videos.reduce((sum, video) => sum + video.viewCount, 0) / channel1Videos.length))
                                  : "N/A"}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">vs</p>
                              <p className="font-bold text-sm">
                                {channel2 && channel2Videos.length > 0
                                  ? formatNumber(Math.round(channel2Videos.reduce((sum, video) => sum + video.viewCount, 0) / channel2Videos.length))
                                  : "N/A"}
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded-lg text-center text-xs">
                              <p className="text-gray-600 mb-1">Avg. Likes</p>
                              <p className="font-bold text-sm">
                                {channel1 && channel1Videos.length > 0
                                  ? formatNumber(Math.round(channel1Videos.reduce((sum, video) => sum + video.likeCount, 0) / channel1Videos.length))
                                  : "N/A"}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">vs</p>
                              <p className="font-bold text-sm">
                                {channel2 && channel2Videos.length > 0
                                  ? formatNumber(Math.round(channel2Videos.reduce((sum, video) => sum + video.likeCount, 0) / channel2Videos.length))
                                  : "N/A"}
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded-lg text-center text-xs">
                              <p className="text-gray-600 mb-1">Avg. Comments</p>
                              <p className="font-bold text-sm">
                                {channel1 && channel1Videos.length > 0
                                  ? formatNumber(Math.round(channel1Videos.reduce((sum, video) => sum + video.commentCount, 0) / channel1Videos.length))
                                  : "N/A"}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">vs</p>
                              <p className="font-bold text-sm">
                                {channel2 && channel2Videos.length > 0
                                  ? formatNumber(Math.round(channel2Videos.reduce((sum, video) => sum + video.commentCount, 0) / channel2Videos.length))
                                  : "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(showVideos === "channel1" ? channel1Videos : channel2Videos).map((video) => (
                          <div key={video.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition">
                            <div className="flex gap-3">
                              <div className="shrink-0">
                                <img
                                  src={video.thumbnail}
                                  alt={video.title}
                                  className="w-16 h-12 object-cover rounded"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-gray-900 text-xs line-clamp-2 mb-1">{video.title}</h3>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <Eye className="w-3 h-3" />
                                  {formatNumber(video.viewCount)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Why This Channel is Better */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <InsightCard
                    channel={channel1}
                    isWinner={getChannelRank(channel1) < getChannelRank(channel2)}
                    comparisonData={{
                      channel1Subscribers: parseInt(channel1.subscriberCount),
                      channel2Subscribers: parseInt(channel2.subscriberCount),
                      channel1Views: parseInt(channel1.viewCount),
                      channel2Views: parseInt(channel2.viewCount)
                    }}
                  />
                  <InsightCard
                    channel={channel2}
                    isWinner={getChannelRank(channel2) < getChannelRank(channel1)}
                    comparisonData={{
                      channel1Subscribers: parseInt(channel1.subscriberCount),
                      channel2Subscribers: parseInt(channel2.subscriberCount),
                      channel1Views: parseInt(channel1.viewCount),
                      channel2Views: parseInt(channel2.viewCount)
                    }}
                  />
                </div>

                {/* Enhanced Analytics - Keywords, Posting Times, Performance Metrics */}
                {channel1Videos.length > 0 && channel2Videos.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <EnhancedAnalyticsCard
                      channel={channel1}
                      videos={channel1Videos}
                      isWinner={getChannelRank(channel1) < getChannelRank(channel2)}
                    />
                    <EnhancedAnalyticsCard
                      channel={channel2}
                      videos={channel2Videos}
                      isWinner={getChannelRank(channel2) < getChannelRank(channel1)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Upgrade Card Modal */}
      {showUpgradeCard && (
        <UpgradeCard 
          requiredCredits={CREDIT_COSTS.COMPARE}
          feature="Channel Comparison"
        />
      )}

      {/* Mobile Bottom Navigation - Only show sidebar button */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-40">
        <div className="flex justify-center py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-3 rounded-full"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </nav>
    </div>
  )
}

// Helper to compute top keywords from video titles and tags
function computeTopKeywords(videos: YouTubeVideo[], topN = 8) {
  const counts: Record<string, number> = {}
  videos.forEach((v) => {
    try {
      // Normalize title to string
      const rawTitle = typeof v.title === 'string' ? v.title : (v.title ? String(v.title) : '')
      const titleWords = rawTitle
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter((w) => w && w.length > 3)
      if (Array.isArray(titleWords)) {
        titleWords.forEach((w) => (counts[w] = (counts[w] || 0) + 1))
      }

      // Normalize tags to array
      let tagsArr: string[] = []
      if (Array.isArray(v.tags)) {
        tagsArr = v.tags as string[]
      }

      tagsArr.forEach((t: string) => {
        const tag = (t || '').toLowerCase().trim()
        if (tag.length > 2) counts[tag] = (counts[tag] || 0) + 2
      })
    } catch (e) {
      // Defensive: skip problematic video entry
      console.warn('computeTopKeywords: skipping video due to error', e, v)
    }
  })
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, topN).map(e => e[0])
}

function formatDuration(iso: string | null) {
  if (!iso) return 'N/A'
  try {
    // Simple ISO 8601 PT#H#M#S parser
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return iso
    const h = parseInt(match[1] || '0', 10)
    const m = parseInt(match[2] || '0', 10)
    const s = parseInt(match[3] || '0', 10)
    if (h) return `${h}h ${m}m ${s}s`
    if (m) return `${m}m ${s}s`
    return `${s}s`
  } catch (e) {
    return iso
  }
}