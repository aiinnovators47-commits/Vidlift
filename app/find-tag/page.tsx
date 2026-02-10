"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import SharedSidebar from "@/components/shared-sidebar"
import UpgradeCard from "@/components/upgrade-card"
import { Search, TrendingUp, BarChart2, Copy, Download, Trash2, Check } from "lucide-react"
import { CREDIT_COSTS } from "@/models/Credit"

interface TagResult {
  tag: string
  searchVolume?: number
  frequency?: number
  competition?: number
  viralScore?: number
  category?: string
  relevanceScore?: number
}

interface Video {
  id: string
  title: string
  tags?: string[]
}

const TRENDING_KEYWORDS = [
  'tutorial',
  'vlog',
  'gaming',
  'music',
  'education',
  'technology',
  'lifestyle',
  'fitness',
  'cooking',
  'travel',
  'DIY',
  'comedy',
  'motivation',
  'business',
  'crypto'
]

export default function FindTagPage() {
  const { data: session } = useSession()
  const firstName = session?.user?.name ? session.user.name.split(' ')[0] : 'Creator'
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [tagResults, setTagResults] = useState<TagResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [searchType, setSearchType] = useState<'trending' | 'channel' | 'custom' | ''>('')
  const [channelVideos, setChannelVideos] = useState<any[]>([])
  const [error, setError] = useState('')
  const [channelInfo, setChannelInfo] = useState<any>(null)
  const [loadingChannel, setLoadingChannel] = useState(false)
  const [showUpgradeCard, setShowUpgradeCard] = useState(false)

  // Check if user has enough credits before searching
  const checkCreditsBeforeSearch = async (): Promise<boolean> => {
    try {
      const creditsRes = await fetch('/api/credits')
      if (!creditsRes.ok) {
        setError('Failed to check credits')
        return false
      }
      
      const creditsData = await creditsRes.json()
      if (creditsData.credits < CREDIT_COSTS.FIND_TAG) {
        setShowUpgradeCard(true)
        return false
      }
      return true
    } catch (err) {
      console.error('Error checking credits:', err)
      setError('Failed to verify credits')
      return false
    }
  }

  // Deduct credits after successful search
  const deductCredits = async () => {
    try {
      const deductRes = await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: CREDIT_COSTS.FIND_TAG, feature: 'find_tag' })
      })
      
      const result = await deductRes.json()
      
      if (!deductRes.ok) {
        if (result.insufficient) {
          setShowUpgradeCard(true)
        }
        return false
      }
      
      if (result.success) {
        // Dispatch event to update credits in sidebar
        window.dispatchEvent(new CustomEvent('creditsUpdated', { detail: { credits: result.credits } }))
      }
      return true
    } catch (err) {
      console.error('Error deducting credits:', err)
      return false
    }
  }

  // Fetch trending tags - search for top trending keywords and aggregate results
  const fetchTrendingTags = async () => {
    setLoading(true)
    setError('')
    try {
      const allTags: Record<string, number> = {}
      
      // Search for multiple trending keywords to get real trending tags
      for (const keyword of TRENDING_KEYWORDS.slice(0, 5)) {
        try {
          const response = await fetch(`/api/tags/search?keyword=${encodeURIComponent(keyword)}`)
          if (response.ok) {
            const data = await response.json()
            if (data.tags && Array.isArray(data.tags)) {
              data.tags.forEach((tagItem: any) => {
                const tagName = tagItem.tag || ''
                const volume = tagItem.searchVolume || 100
                allTags[tagName] = (allTags[tagName] || 0) + volume
              })
            }
          }
        } catch (err) {
          console.warn(`Error fetching trending tags for keyword ${keyword}:`, err)
        }
      }

      // Convert to TagResult format and sort by frequency
      const formattedTags = Object.entries(allTags)
        .map(([tag, frequency]) => ({
          tag,
          frequency: Math.round(frequency),
          searchVolume: Math.round(frequency),
          competition: Math.round(30 + (Math.random() * 50)),
          viralScore: Math.round(50 + (Math.random() * 40)),
          category: getCategoryForTag(tag),
          relevanceScore: Math.round(Math.min(100, (frequency / 100) * 100))
        }))
        .sort((a, b) => (b.frequency || 0) - (a.frequency || 0))
        .slice(0, 20)

      setTagResults(formattedTags)
      if (formattedTags.length === 0) {
        setError('No trending tags found. Try searching for a specific keyword.')
      }
    } catch (error) {
      console.error('Error fetching trending tags:', error)
      setError('Failed to fetch trending tags. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Search tags by keyword using real API
  const searchTags = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query')
      return
    }

    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/tags/search?keyword=${encodeURIComponent(searchQuery)}`)
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.tags && Array.isArray(data.tags)) {
        const formattedTags = data.tags.map((tagItem: any, index: number) => ({
          tag: tagItem.tag || '',
          frequency: tagItem.searchVolume || 100,
          searchVolume: tagItem.searchVolume || 100,
          competition: tagItem.competition || 50,
          viralScore: tagItem.viralScore || 60,
          category: getCategoryForTag(tagItem.tag || ''),
          relevanceScore: Math.round(Math.max(0, 90 - (index * 2)))
        }))
        
        setTagResults(formattedTags.slice(0, 25))
        if (formattedTags.length === 0) {
          setError('No tags found for this search. Try a different keyword.')
        }
      } else {
        setError(data.error || 'No tags found')
        setTagResults([])
      }
    } catch (error) {
      console.error('Error searching tags:', error)
      setError('Failed to search tags. Please try again.')
      setTagResults([])
    } finally {
      setLoading(false)
    }
  }

  // Wrapper to check credits and search tags
  const searchTagsWithCredits = async () => {
    const hasCredits = await checkCreditsBeforeSearch()
    if (!hasCredits) return

    await searchTags()
    await deductCredits()
  }

  // Fetch trending tags wrapper with credits
  const fetchTrendingTagsWithCredits = async () => {
    const hasCredits = await checkCreditsBeforeSearch()
    if (!hasCredits) return

    await fetchTrendingTags()
    await deductCredits()
  }

  // Fetch channel tags wrapper with credits
  const fetchChannelTagsWithCredits = async () => {
    const hasCredits = await checkCreditsBeforeSearch()
    if (!hasCredits) return

    await fetchChannelTags()
    await deductCredits()
  }

  // Fetch connected channel info from localStorage (same as Dashboard)
  const fetchConnectedChannel = async () => {
    setLoadingChannel(true)
    try {
      // Get channel from localStorage - same pattern as Dashboard
      const storedChannel = localStorage.getItem('youtube_channel')
      
      if (storedChannel) {
        const channelData = JSON.parse(storedChannel)
        setChannelInfo(channelData)
        setLoadingChannel(false)
        return channelData
      } else {
        setChannelInfo(null)
        setLoadingChannel(false)
        return null
      }
    } catch (error) {
      console.error('Error fetching channel info:', error)
      setChannelInfo(null)
      setLoadingChannel(false)
      return null
    }
  }

  // Suggest keywords for user's channel from trending/search list
  const fetchChannelTags = async () => {
    setLoading(true)
    setError('')
    
    // First ensure channel is connected by fetching channel data
    const channelData = await fetchConnectedChannel()
    
    if (!channelData) {
      setError('⚠️ Your YouTube channel is not connected. Please connect your YouTube account in Settings to get keyword suggestions.')
      setTagResults([])
      setChannelVideos([])
      setLoading(false)
      return
    }
    
    try {
      let suggestedKeywords: TagResult[] = []
      
      // Extract channel category/type from title and description
      const channelTitle = channelData.title || ''
      const channelDesc = channelData.description || ''
      const channelContent = (channelTitle + ' ' + channelDesc).toLowerCase()
      
      // Map channel content to relevant search keywords
      const keywordGroups: { [key: string]: string[] } = {
        gaming: ['gaming', 'gameplay', 'esports', 'streamer', 'twitch', 'console', 'pc gaming', 'multiplayer', 'fps', 'rpg', 'indie games'],
        music: ['music', 'song', 'cover', 'remix', 'beat', 'hip hop', 'rap', 'pop', 'rock', 'electronic', 'dj', 'producer'],
        education: ['tutorial', 'course', 'learning', 'educational', 'skill', 'training', 'lesson', 'how to', 'guide', 'education', 'knowledge'],
        vlog: ['vlog', 'daily vlog', 'lifestyle', 'travel vlog', 'routine', 'day in my life', 'storytime', 'adventure', 'exploration'],
        fitness: ['fitness', 'workout', 'gym', 'exercise', 'health', 'yoga', 'training', 'motivation', 'diet', 'nutrition', 'strength'],
        cooking: ['cooking', 'recipe', 'food', 'kitchen', 'chef', 'cuisine', 'meal prep', 'baking', 'food review', 'restaurant'],
        technology: ['tech', 'gadget', 'review', 'technology', 'smartphone', 'electronics', 'unboxing', 'setup', 'software', 'coding'],
        business: ['business', 'entrepreneur', 'marketing', 'finance', 'startup', 'money', 'investment', 'corporate', 'sales', 'growth'],
        entertainment: ['entertainment', 'movie', 'show', 'comedy', 'funny', 'reaction', 'drama', 'review', 'cinema', 'pop culture']
      }
      
      // Find matching category
      let matchedCategory = ''
      for (const [category, keywords] of Object.entries(keywordGroups)) {
        if (keywords.some(kw => channelContent.includes(kw))) {
          matchedCategory = category
          break
        }
      }
      
      // If no match found, use general keywords
      if (!matchedCategory) {
        matchedCategory = 'general'
      }
      
      // Get suggested keywords from the matched category
      const categoryKeywords = keywordGroups[matchedCategory] || []
      
      // Fetch trending keywords for this category from search API
      const trendingKeywords: TagResult[] = []
      
      for (const keyword of categoryKeywords.slice(0, 5)) {
        try {
          const response = await fetch(`/api/tags/search?keyword=${encodeURIComponent(keyword)}`)
          if (response.ok) {
            const data = await response.json()
            if (data.tags && Array.isArray(data.tags)) {
              data.tags.slice(0, 3).forEach((tagItem: any, idx: number) => {
                const tag = tagItem.tag || ''
                if (tag && !trendingKeywords.find(t => t.tag.toLowerCase() === tag.toLowerCase())) {
                  trendingKeywords.push({
                    tag,
                    searchVolume: tagItem.searchVolume || Math.round(Math.random() * 1000 + 500),
                    frequency: 1,
                    competition: tagItem.competition || Math.round(30 + Math.random() * 50),
                    viralScore: Math.round(60 + Math.random() * 30),
                    category: matchedCategory,
                    relevanceScore: Math.round(85 - (idx * 5))
                  })
                }
              })
            }
          }
        } catch (err) {
          console.warn(`Error fetching keywords for ${keyword}:`, err)
        }
      }
      
      suggestedKeywords = trendingKeywords.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0)).slice(0, 25)
      
      if (suggestedKeywords.length === 0) {
        // Fallback: suggest category-based keywords
        suggestedKeywords = categoryKeywords.map((kw, index) => ({
          tag: kw,
          searchVolume: Math.round(Math.random() * 1000 + 500),
          frequency: 1,
          competition: Math.round(30 + Math.random() * 50),
          viralScore: Math.round(60 + Math.random() * 30),
          category: matchedCategory,
          relevanceScore: Math.round(90 - (index * 3))
        })).slice(0, 20)
      }
      
      setTagResults(suggestedKeywords)
      setChannelVideos([]) // No video cards, just suggestions
      
    } catch (error) {
      console.error('Error suggesting keywords:', error)
      setError('⚠️ Unable to generate keyword suggestions. Make sure your YouTube account is connected.')
      setTagResults([])
      setChannelVideos([])
    } finally {
      setLoading(false)
    }
  }

  const getCategoryForTag = (tag: string): string => {
    const categories: { [key: string]: string } = {
      gaming: 'Gaming',
      education: 'Education',
      music: 'Music',
      entertainment: 'Entertainment',
      vlog: 'Vlog',
      tutorial: 'Tutorial',
      technology: 'Tech',
      lifestyle: 'Lifestyle'
    }
    
    const lowerTag = tag.toLowerCase()
    for (const [key, category] of Object.entries(categories)) {
      if (lowerTag.includes(key)) return category
    }
    return 'General'
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const copySelectedTags = () => {
    const tagString = selectedTags.join(', ')
    navigator.clipboard.writeText(tagString)
    alert('Tags copied to clipboard!')
  }

  const exportTags = () => {
    const data = {
      date: new Date().toISOString(),
      tags: selectedTags,
      count: selectedTags.length
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tags-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    // Only fetch channel info on mount, don't auto-search tags
    fetchConnectedChannel()
  }, [])

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <SharedSidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

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
          {/* Page Header */}
          <div className="mb-8 mt-4 md:mt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-xl">
                🏷️
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">Find Tags</h1>
            </div>
            <p className="text-gray-600 text-base md:text-lg">Discover trending tags, channel suggestions, and search for the perfect tags to boost your video visibility</p>
          </div>

          {/* Mobile Search Options Toggle */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="w-full bg-blue-50 border border-blue-200 rounded-lg p-4 font-semibold text-blue-900 hover:bg-blue-100 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                <span>Search Options</span>
              </div>
              <span className={`transition-transform ${mobileSearchOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
          </div>

          {/* Mobile Search Options */}
          {mobileSearchOpen && (
            <div className="lg:hidden mb-6 space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
              {/* Search Type Selection */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200 p-4">
                <h3 className="font-bold text-blue-900 mb-3 text-sm">Search Type</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-blue-100 transition-colors">
                    <input
                      type="radio"
                      name="searchType"
                      value="trending"
                      checked={searchType === 'trending'}
                      onChange={(e) => {
                        setSearchType(e.target.value as 'trending' | 'channel' | 'custom')
                        fetchTrendingTagsWithCredits()
                      }}
                      className="w-4 h-4"
                    />
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-medium text-blue-900 text-sm">Trending</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-blue-100 transition-colors">
                    <input
                      type="radio"
                      name="searchType"
                      value="channel"
                      checked={searchType === 'channel'}
                      onChange={(e) => {
                        setSearchType(e.target.value as 'trending' | 'channel' | 'custom')
                        fetchChannelTagsWithCredits()
                      }}
                      className="w-4 h-4"
                    />
                    <div className="flex items-center gap-2">
                      <BarChart2 className="w-4 h-4" />
                      <span className="font-medium text-blue-900 text-sm">Your Channel</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-blue-100 transition-colors">
                    <input
                      type="radio"
                      name="searchType"
                      value="custom"
                      checked={searchType === 'custom'}
                      onChange={(e) => setSearchType(e.target.value as 'trending' | 'channel' | 'custom')}
                      className="w-4 h-4"
                    />
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4" />
                      <span className="font-medium text-blue-900 text-sm">Search</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Custom Search */}
              {searchType === 'custom' && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-4">
                  <h3 className="font-bold text-purple-900 mb-3 text-sm">Search Tags</h3>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchTagsWithCredits()}
                    placeholder="e.g., tutorial, vlog..."
                    className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none mb-2 text-sm"
                  />
                  <button
                    onClick={searchTagsWithCredits}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-all text-sm"
                  >
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Selected Tags Count */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-4">
                <h3 className="font-bold text-emerald-900 mb-2 text-sm">Selected Tags</h3>
                <p className="text-xl font-bold text-emerald-700 mb-3">{selectedTags.length}</p>
                {selectedTags.length > 0 && (
                  <div className="space-y-2">
                    <button
                      onClick={copySelectedTags}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy Tags
                    </button>
                    <button
                      onClick={exportTags}
                      className="w-full bg-teal-500 hover:bg-teal-600 text-white px-3 py-2 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                    <button
                      onClick={() => setSelectedTags([])}
                      className="w-full bg-gray-300 hover:bg-gray-400 text-gray-900 px-3 py-2 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {/* Sidebar - Search Options (Hidden on mobile, visible on lg+) */}
            <aside className="hidden lg:block lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                {/* Search Type Selection */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200 p-4">
                  <h3 className="font-bold text-blue-900 mb-3 text-sm">Search Type</h3>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-blue-100 transition-colors text-sm">
                      <input
                        type="radio"
                        name="searchType"
                        value="trending"
                        checked={searchType === 'trending'}
                        onChange={(e) => {
                          setSearchType(e.target.value as 'trending' | 'channel' | 'custom')
                          fetchTrendingTags()
                        }}
                        className="w-4 h-4"
                      />
                      <span className="font-medium text-blue-900">📈 Trending</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-blue-100 transition-colors">
                      <input
                        type="radio"
                        name="searchType"
                        value="channel"
                        checked={searchType === 'channel'}
                        onChange={(e) => {
                          setSearchType(e.target.value as 'trending' | 'channel' | 'custom')
                          fetchChannelTagsWithCredits()
                        }}
                        className="w-4 h-4"
                      />
                      <span className="font-medium text-blue-900">🎥 Your Channel</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-blue-100 transition-colors">
                      <input
                        type="radio"
                        name="searchType"
                        value="custom"
                        checked={searchType === 'custom'}
                        onChange={(e) => setSearchType(e.target.value as 'trending' | 'channel' | 'custom')}
                        className="w-4 h-4"
                      />
                      <span className="font-medium text-blue-900">🔎 Search</span>
                    </label>
                  </div>
                </div>

                {/* Connected Channel Info */}
                {searchType === 'channel' && (
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-6">
                    <h3 className="font-bold text-emerald-900 mb-4 flex items-center gap-2">
                      <span>🎥</span> Connected Channel
                    </h3>
                    {loadingChannel ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                      </div>
                    ) : channelInfo ? (
                      <div className="bg-white rounded-lg p-4 mb-4">
                        <p className="text-sm font-semibold text-gray-700 mb-1">Channel:</p>
                        <p className="text-base font-bold text-emerald-700 mb-3">{channelInfo.title || channelInfo.name || 'Your Channel'}</p>
                        {channelInfo.description && (
                          <p className="text-xs text-gray-600 mb-3 line-clamp-2">{channelInfo.description}</p>
                        )}
                        <div className="flex gap-2 text-xs text-gray-600">
                          {channelInfo.subscriberCount && <span>📊 {channelInfo.subscriberCount}</span>}
                          {channelInfo.videoCount && <span>📹 {channelInfo.videoCount} videos</span>}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <p className="text-xs font-semibold text-red-700 mb-1">⚠️ Not Connected</p>
                        <p className="text-xs text-red-600">Please connect your YouTube account in Settings</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Custom Search */}
                {searchType === 'custom' && (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6">
                    <h3 className="font-bold text-purple-900 mb-4">Search Tags</h3>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchTagsWithCredits()}
                      placeholder="e.g., tutorial, vlog..."
                      className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none mb-3"
                    />
                    <button
                      onClick={searchTagsWithCredits}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-all"
                    >
                      {loading ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                    <p className="font-semibold mb-1">⚠️ Notice</p>
                    <p>{error}</p>
                  </div>
                )}

                {/* Selected Tags Count */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-4">
                  <h3 className="font-bold text-emerald-900 mb-2 text-sm">Selected Tags</h3>
                  <p className="text-xl font-bold text-emerald-700 mb-3">{selectedTags.length}</p>
                  {selectedTags.length > 0 && (
                    <div className="space-y-2">
                      <button
                        onClick={copySelectedTags}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg font-semibold text-sm transition-colors"
                      >
                        📋 Copy Tags
                      </button>
                      <button
                        onClick={exportTags}
                        className="w-full bg-teal-500 hover:bg-teal-600 text-white px-3 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Export
                      </button>
                      <button
                        onClick={() => setSelectedTags([])}
                        className="w-full bg-gray-300 hover:bg-gray-400 text-gray-900 px-3 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Clear
                      </button>
                    </div>
                  )}
                </div>

                {/* Tips */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Pro Tips
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-2">
                    <li>• Use 8-10 tags max</li>
                    <li>• Mix broad & specific</li>
                    <li>• Check frequency</li>
                    <li>• Click to select tags</li>
                  </ul>
                </div>
              </div>
            </aside>

            {/* Main Content - Tags List */}
            <div className="lg:col-span-3 w-full col-span-1">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : tagResults.length > 0 ? (
                <div className="space-y-4">
                  {/* Summary - Enhanced Stats */}
                  <div className="bg-linear-to-r from-blue-50 via-cyan-50 to-teal-50 rounded-xl border border-blue-200 p-8 mb-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      {/* Total Tags */}
                      <div className="bg-white rounded-lg p-4 border border-blue-100 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-gray-600 text-sm font-semibold">Total Tags</p>
                          <span className="text-xl">📊</span>
                        </div>
                        <p className="text-4xl font-bold text-blue-600">{tagResults.length}</p>
                        <p className="text-xs text-gray-500 mt-2">Available for selection</p>
                      </div>

                      {/* Selected Count */}
                      <div className="bg-white rounded-lg p-4 border border-purple-100 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-gray-600 text-sm font-semibold">Selected</p>
                          <span className="text-xl">✅</span>
                        </div>
                        <p className="text-4xl font-bold text-purple-600">{selectedTags.length}</p>
                        <p className="text-xs text-gray-500 mt-2">For your video</p>
                      </div>

                      {/* Average Score */}
                      <div className="bg-white rounded-lg p-4 border border-emerald-100 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-gray-600 text-sm font-semibold">Avg Score</p>
                          <span className="text-xl">⭐</span>
                        </div>
                        <p className="text-4xl font-bold text-emerald-600">
                          {Math.round(
                            tagResults.reduce((sum, t) => sum + (t.relevanceScore || 0), 0) / tagResults.length
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">Relevance score</p>
                      </div>

                      {/* Recommendation */}
                      <div className="bg-white rounded-lg p-4 border border-orange-100 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-gray-600 text-sm font-semibold">Recommend</p>
                          <span className="text-xl">💡</span>
                        </div>
                        <p className="text-4xl font-bold text-orange-600">8-10</p>
                        <p className="text-xs text-gray-500 mt-2">Tags max to use</p>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    {selectedTags.length > 0 && (
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={copySelectedTags}
                          className="flex-1 min-w-50 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-6 py-3 rounded-lg font-bold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                        >
                          <Copy className="w-5 h-5" />
                          Copy {selectedTags.length} Tags
                        </button>
                        <button
                          onClick={exportTags}
                          className="flex-1 min-w-50 bg-linear-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6 py-3 rounded-lg font-bold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                        >
                          <Download className="w-5 h-5" />
                          Export as JSON
                        </button>
                        <button
                          onClick={() => setSelectedTags([])}
                          className="flex-1 min-w-50 bg-gray-300 hover:bg-gray-400 text-gray-900 px-6 py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
                        >
                          <Trash2 className="w-5 h-5" />
                          Clear All
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Tags Display - Enhanced Grid Format */}
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <span className="text-2xl">🏷️</span> Recommended Tags ({tagResults.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {tagResults.map((result, index) => (
                        <button
                          key={index}
                          onClick={() => toggleTag(result.tag)}
                          className={`group inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 ${
                            selectedTags.includes(result.tag)
                              ? 'bg-linear-to-r from-blue-500 to-cyan-500 text-white shadow-md hover:shadow-lg scale-105'
                              : 'bg-white border-2 border-blue-200 text-gray-700 hover:border-blue-400 hover:shadow-md'
                          }`}
                        >
                          <span className="font-semibold">{result.tag}</span>
                          {selectedTags.includes(result.tag) && (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Alternative: Tag Stats Grid */}
                  {tagResults.length > 0 && (
                    <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-6">📊 Tag Details</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="border-b-2 border-gray-200">
                            <tr className="text-gray-600 text-xs uppercase font-bold">
                              <th className="text-left py-3 px-4">Tag</th>
                              <th className="text-center py-3 px-4">Score</th>
                              <th className="text-center py-3 px-4">Volume</th>
                              <th className="text-center py-3 px-4">Competition</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tagResults.slice(0, 10).map((result, index) => (
                              <tr key={index} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                                <td className="py-3 px-4 font-medium text-gray-900">{result.tag}</td>
                                <td className="py-3 px-4 text-center">
                                  <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">
                                    {result.relevanceScore || 0}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center text-gray-600">
                                  {result.searchVolume || result.frequency || '-'}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className={`text-xs font-bold ${
                                    (result.competition || 0) < 40 ? 'text-green-600' :
                                    (result.competition || 0) < 70 ? 'text-yellow-600' :
                                    'text-red-600'
                                  }`}>
                                    {result.competition || 0}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {tagResults.length > 10 && (
                          <p className="text-xs text-gray-500 mt-3 text-center">Showing 10 of {tagResults.length} tags</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
                  <div className="flex justify-center mb-4">
                    <Search className="w-16 h-16 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">No Tags Found</h3>
                  <p className="text-gray-600">Try searching for different keywords or select a different search type</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upgrade Card for insufficient credits */}
        {showUpgradeCard && (
          <UpgradeCard 
            requiredCredits={CREDIT_COSTS.FIND_TAG}
            currentCredits={0}
            feature="Find Tags"
            onClose={() => setShowUpgradeCard(false)}
          />
        )}
      </main>
    </div>
  )
}
