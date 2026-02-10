"use client"

import React, { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  Search,
  Sparkles,
  TrendingUp,
  Eye,
  ArrowUpRight,
  RefreshCw,
  Copy,
  CheckCircle,
  AlertCircle,
  Zap,
  Video,
  Save,
  X,
  Check,
  Tag,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TitleSuggestion {
  title: string
  searchScore: number
  keywordMatchPercentage: number
  contentType: string
  estimatedCTR: number
}

interface TrendInsights {
  topKeywords: string[]
  avgViewsPerVideo: number
  trendingPatterns: string[]
}

interface SearchResponse {
  success: boolean
  userInput: string
  searchScore: number
  optimizedUserTitle: string
  top20Titles: TitleSuggestion[]
  relatedKeywords: string[]
  trendInsights: TrendInsights
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
  tags?: string[]
}

export default function TitleSearchScoreComponent() {
  const { data: session } = useSession()
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [error, setError] = useState('')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  
  // Video selection and tag save states
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [videos, setVideos] = useState<Video[]>([])
  const [loadingVideos, setLoadingVideos] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [savingTags, setSavingTags] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [youtubeChannelId, setYoutubeChannelId] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  // Load YouTube channel and token on mount
  useEffect(() => {
    const loadChannelInfo = async () => {
      try {
        if (typeof window === 'undefined') return
        
        // Try to get channel from localStorage
        const channelData = localStorage.getItem('youtube_channel')
        if (channelData) {
          const channel = JSON.parse(channelData)
          setYoutubeChannelId(channel.id)
          
          // Try to get token from server first (with auto-refresh)
          try {
            const tokenRes = await fetch(`/api/tokens?channelId=${channel.id}`)
            if (tokenRes.ok) {
              const tokenData = await tokenRes.json()
              const token = tokenData?.data?.access_token
              if (token) {
                setAccessToken(token)
                localStorage.setItem(`youtube_access_token_${channel.id}`, token)
                localStorage.setItem('youtube_access_token', token)
                return
              }
            }
          } catch (err) {
            console.warn('Failed to fetch token from server:', err)
          }
          
          // Fallback to localStorage token
          const localToken = localStorage.getItem(`youtube_access_token_${channel.id}`) || 
                           localStorage.getItem('youtube_access_token')
          if (localToken) {
            setAccessToken(localToken)
          }
        }
      } catch (err) {
        console.error('Error loading channel info:', err)
      }
    }
    
    loadChannelInfo()
  }, [session])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!keyword.trim()) {
      setError('Please enter a keyword or title')
      return
    }

    setLoading(true)
    setError('')
    setResults(null)

    try {
      const response = await fetch('/api/title-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword: keyword.trim() }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate suggestions')
      }

      const data = await response.json()
      setResults(data)

      // Scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  // Fetch videos from YouTube channel
  const fetchVideos = async () => {
    if (!youtubeChannelId) {
      setSaveError('Please connect your YouTube channel first')
      return
    }

    setLoadingVideos(true)
    setSaveError('')

    try {
      const url = `/api/youtube/videos?channelId=${encodeURIComponent(youtubeChannelId)}&fetchAll=false&maxResults=20`
      const response = await fetch(url)

      if (!response.ok) {
        if (response.status === 401) {
          // Try to refresh token
          const refreshed = await refreshAccessToken()
          if (refreshed) {
            // Retry fetch
            return fetchVideos()
          }
          throw new Error('Please reconnect your YouTube channel')
        }
        throw new Error('Failed to fetch videos')
      }

      const data = await response.json()
      setVideos(data.videos || [])
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to load videos')
    } finally {
      setLoadingVideos(false)
    }
  }

  // Refresh access token
  const refreshAccessToken = async (): Promise<boolean> => {
    try {
      if (!youtubeChannelId) return false
      
      const tokenRes = await fetch(`/api/tokens?channelId=${youtubeChannelId}`)
      if (tokenRes.ok) {
        const tokenData = await tokenRes.json()
        const token = tokenData?.data?.access_token
        if (token) {
          setAccessToken(token)
          localStorage.setItem(`youtube_access_token_${youtubeChannelId}`, token)
          localStorage.setItem('youtube_access_token', token)
          return true
        }
      }
      
      // Try manual refresh
      const refreshToken = localStorage.getItem(`youtube_refresh_token_${youtubeChannelId}`) || 
                          localStorage.getItem('youtube_refresh_token')
      if (!refreshToken) return false

      const res = await fetch('/api/youtube/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      })

      if (res.ok) {
        const data = await res.json()
        if (data?.access_token) {
          setAccessToken(data.access_token)
          localStorage.setItem(`youtube_access_token_${youtubeChannelId}`, data.access_token)
          localStorage.setItem('youtube_access_token', data.access_token)
          return true
        }
      }
      return false
    } catch (err) {
      console.error('Error refreshing token:', err)
      return false
    }
  }

  // Fetch real tags for a title by searching YouTube
  const fetchRealTagsForTitle = async (title: string): Promise<string[]> => {
    try {
      // Search for videos with this title to get real tags from actual videos
      const response = await fetch(`/api/tags/search?keyword=${encodeURIComponent(title)}`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.tags && Array.isArray(data.tags)) {
          // Extract just the tag names (filter out objects, get string values)
          return data.tags
            .map((t: any) => typeof t === 'string' ? t : t.tag)
            .filter((tag: string) => tag && tag.length > 0)
            .slice(0, 5)
        }
      }
    } catch (err) {
      console.warn('Failed to fetch real tags:', err)
    }
    
    // Fallback: Return empty, user can view result tags instead
    return []
  }

  // Open video selection modal when clicking on a score
  const handleScoreClick = async (title: string, suggestion?: TitleSuggestion) => {
    // Try to get real tags for this title
    const realTags = await fetchRealTagsForTitle(title)
    
    // Use real tags if found, otherwise use top keywords from results
    const tagsToSave = realTags.length > 0 ? realTags : (results?.trendInsights.topKeywords || []).slice(0, 5)
    
    setSelectedTags(tagsToSave)
    setSaveError('')
    setSaveSuccess(false)
    setShowVideoModal(true)
    await fetchVideos()
  }

  // Save tags to selected video
  const handleSaveTags = async () => {
    if (!selectedVideo || selectedTags.length === 0) {
      setSaveError('Please select tags to save')
      return
    }

    if (!accessToken) {
      setSaveError('Please reconnect your YouTube channel')
      return
    }

    setSavingTags(true)
    setSaveError('')
    setSaveSuccess(false)

    try {
      // Merge existing tags with new tags (avoiding duplicates)
      const existingTags = selectedVideo.tags || []
      const allTags = [...new Set([...existingTags, ...selectedTags])]
      
      const response = await fetch('/api/tags/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId: selectedVideo.id,
          tags: allTags,
          accessToken: accessToken,
          channelId: youtubeChannelId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // Handle token expiration
        if (response.status === 401) {
          const refreshed = await refreshAccessToken()
          if (refreshed) {
            // Retry save with new token
            return handleSaveTags()
          }
          throw new Error('Session expired. Please reconnect your YouTube channel.')
        }
        
        throw new Error(errorData.error || 'Failed to save tags')
      }

      const data = await response.json()
      setSaveSuccess(true)
      
      // Update local video with new tags
      const updatedTags = data.tags || allTags
      setSelectedVideo(prev => prev ? { ...prev, tags: updatedTags } : null)
      setVideos(prev => prev.map(v => 
        v.id === selectedVideo.id 
          ? { ...v, tags: updatedTags }
          : v
      ))

      // Close modal after 2 seconds
      setTimeout(() => {
        setShowVideoModal(false)
        setSelectedVideo(null)
        setSelectedTags([])
      }, 2000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save tags')
    } finally {
      setSavingTags(false)
    }
  }

  // Remove a tag from selected video
  const removeTagFromVideo = async (tag: string) => {
    if (!selectedVideo) return
    
    const updatedTags = (selectedVideo.tags || []).filter(t => t !== tag)
    
    // Immediately save the change
    setSavingTags(true)
    setSaveError('')
    
    try {
      const response = await fetch('/api/tags/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId: selectedVideo.id,
          tags: updatedTags,
          accessToken: accessToken,
          channelId: youtubeChannelId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        if (response.status === 401) {
          const refreshed = await refreshAccessToken()
          if (refreshed) {
            return removeTagFromVideo(tag)
          }
          throw new Error('Session expired. Please reconnect your YouTube channel.')
        }
        
        throw new Error(errorData.error || 'Failed to remove tag')
      }

      // Update local state
      setSelectedVideo(prev => prev ? { ...prev, tags: updatedTags } : null)
      setVideos(prev => prev.map(v => 
        v.id === selectedVideo.id 
          ? { ...v, tags: updatedTags }
          : v
      ))
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to remove tag')
    } finally {
      setSavingTags(false)
    }
  }

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-orange-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200'
    if (score >= 60) return 'bg-blue-50 border-blue-200'
    if (score >= 40) return 'bg-yellow-50 border-yellow-200'
    return 'bg-orange-50 border-orange-200'
  }

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`
    return views.toString()
  }

  return (
    <div className="w-full">
      {/* Search Section removed as requested */}
      <div className="hidden" />

      {/* Results Section */}
      {results && (
        <div ref={resultsRef} className="space-y-8">
          {/* Search Score Card */}
          <Card className={cn(
            'border-2 p-6 rounded-xl',
            getScoreBgColor(results.searchScore)
          )}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Search Score</p>
                  <p className="text-gray-900 mt-1">
                    <span className="text-lg font-semibold">{results.userInput}</span>
                  </p>
                </div>
                <div className="text-right">
                  <div className={cn('text-5xl font-bold', getScoreColor(results.searchScore))}>
                    {results.searchScore}
                  </div>
                  <p className="text-xs text-gray-600 mt-2">/ 100</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-300/50">
                <p className="text-sm font-semibold text-gray-700 mb-3">Your Optimized Title</p>
                <div className="flex items-center justify-between bg-white/60 p-4 rounded-lg border border-gray-200/50">
                  <p className="text-gray-900 font-medium">{results.optimizedUserTitle}</p>
                  <button
                    onClick={() => copyToClipboard(results.optimizedUserTitle, -1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {copiedIndex === -1 ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Copy className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Trend Insights */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-4 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-sm font-semibold text-gray-700">Top Keywords</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {results.trendInsights.topKeywords.slice(0, 5).map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </Card>

            <Card className="p-4 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Eye className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-sm font-semibold text-gray-700">Avg Views</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatViews(results.trendInsights.avgViewsPerVideo)}
              </p>
              <p className="text-xs text-gray-500 mt-2">per video</p>
            </Card>

            <Card className="p-4 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Zap className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-sm font-semibold text-gray-700">Trends</p>
              </div>
              <div className="space-y-1">
                {results.trendInsights.trendingPatterns.map((pattern, idx) => (
                  <p key={idx} className="text-xs text-gray-600">
                    • {pattern}
                  </p>
                ))}
              </div>
            </Card>
          </div>

          {/* Related Keywords */}
          <Card className="p-6 border border-gray-200 rounded-xl bg-white">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">People Also Search For</h3>
            <div className="grid md:grid-cols-3 gap-3">
              {results.relatedKeywords.map((keyword, idx) => (
                <button
                  key={idx}
                  onClick={() => setKeyword(keyword)}
                  className="px-4 py-2 text-left text-sm bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-lg transition-colors group"
                >
                  <p className="text-gray-700 group-hover:text-blue-700 font-medium truncate">{keyword}</p>
                  <p className="text-xs text-gray-500 group-hover:text-blue-600 mt-1">Click to search</p>
                </button>
              ))}
            </div>
          </Card>

          {/* Top 20 Title Suggestions */}
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-blue-600" />
                Top 20 Optimized Titles
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                SEO-friendly titles likely to appear in YouTube search suggestions
              </p>
            </div>

            <div className="grid gap-3">
              {results.top20Titles.map((suggestion, index) => (
                <Card
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg bg-white hover:shadow-md hover:border-blue-300 transition-all group"
                >
                  <div className="space-y-3">
                    {/* Title and Copy Button */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 font-medium line-clamp-2 group-hover:text-blue-700 transition-colors">
                          {suggestion.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {suggestion.title.length} characters
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(suggestion.title, index)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
                      >
                        {copiedIndex === index ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Copy className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
                        )}
                      </button>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-5 gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => handleScoreClick(suggestion.title, suggestion)}
                        className="text-center hover:bg-blue-50 rounded-lg p-2 transition-colors cursor-pointer group"
                        title="Click to save real tags to your video"
                      >
                        <p className={cn('text-lg font-bold group-hover:scale-110 transition-transform', getScoreColor(suggestion.searchScore))}>
                          {suggestion.searchScore}
                        </p>
                        <p className="text-xs text-gray-600 flex items-center justify-center gap-1">
                          <Tag className="h-3 w-3" />
                          Tags
                        </p>
                      </button>
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">
                          {Math.round(suggestion.keywordMatchPercentage)}%
                        </p>
                        <p className="text-xs text-gray-600">Match</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">
                          {suggestion.estimatedCTR.toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-600">Est. CTR</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full whitespace-nowrap">
                          {suggestion.contentType}
                        </p>
                      </div>
                      <button
                        onClick={() => handleScoreClick(results.userInput, suggestion)}
                        className="text-center hover:bg-green-50 rounded-lg p-2 transition-colors cursor-pointer"
                        title="Save real YouTube tags"
                      >
                        <Save className="h-5 w-5 mx-auto text-green-600" />
                        <p className="text-xs text-gray-600 mt-1">Save Tags</p>
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-600">
                <strong>Score:</strong> SEO ranking potential | <strong>Match:</strong> Keyword relevance |{' '}
                <strong>Est. CTR:</strong> Estimated click-through rate | <strong>Type:</strong> Content format
              </p>
            </div>
          </div>

          {/* Search Preview */}
          <Card className="p-6 border border-gray-200 rounded-xl bg-white">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              How Your Title Appears in Search
            </h3>
            <div className="space-y-3">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Search Result Preview</p>
                <p className="text-lg font-semibold text-blue-600 hover:underline cursor-pointer">
                  {results.optimizedUserTitle}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  youtube.com › results › {results.userInput}
                </p>
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                  Discover the best {results.userInput} content with our optimized suggestions...
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!results && !loading && (
        <div className="text-center py-12" />
      )}

      {/* Video Selection Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Video className="h-6 w-6 text-blue-600" />
                  Select Video to Add Tags
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Choose a video and the tags will be automatically saved
                </p>
              </div>
              <button
                onClick={() => setShowVideoModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>

            {/* Tags to Save */}
            <div className="p-6 border-b border-gray-200 bg-blue-50">
              <p className="text-sm font-semibold text-gray-700 mb-2">Tags to Save:</p>
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-full flex items-center gap-2"
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Videos List */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingVideos ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <p className="ml-3 text-gray-600">Loading your videos...</p>
                </div>
              ) : videos.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No videos found</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {videos.map((video) => (
                    <div
                      key={video.id}
                      onClick={() => setSelectedVideo(video)}
                      className={cn(
                        'p-4 border-2 rounded-lg cursor-pointer transition-all',
                        selectedVideo?.id === video.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      )}
                    >
                      <div className="flex gap-4">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-32 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 line-clamp-2">
                            {video.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {video.views} views
                          </p>
                          {video.tags && video.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {video.tags.slice(0, 3).map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                              {video.tags.length > 3 && (
                                <span className="px-2 py-0.5 text-gray-500 text-xs">
                                  +{video.tags.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {selectedVideo?.id === video.id && (
                          <CheckCircle className="h-6 w-6 text-blue-600 shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              {/* Current Video Tags Section - Only show when video is selected */}
              {selectedVideo && selectedVideo.tags && selectedVideo.tags.length > 0 && (
                <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-700">Current Tags in Video:</p>
                    <p className="text-xs text-gray-500">{selectedVideo.tags.length} tags</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedVideo.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full flex items-center gap-2 group hover:bg-gray-200 transition-colors"
                      >
                        {tag}
                        <button
                          onClick={() => removeTagFromVideo(tag)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove this tag"
                        >
                          <X className="h-3 w-3 text-gray-500 hover:text-red-600" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Click the X on any tag to remove it, or add new tags below
                  </p>
                </div>
              )}
              
              {saveError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-sm text-red-700">{saveError}</p>
                </div>
              )}
              {saveSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="text-sm text-green-700">Tags saved successfully!</p>
                </div>
              )}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {selectedVideo ? `Selected: ${selectedVideo.title}` : 'Select a video to continue'}
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowVideoModal(false)}
                    disabled={savingTags}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveTags}
                    disabled={!selectedVideo || savingTags || saveSuccess}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {savingTags ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : saveSuccess ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Saved!
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Tags
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
