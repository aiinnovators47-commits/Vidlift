"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import SharedSidebar from "@/components/shared-sidebar"
import { Menu, X } from "lucide-react"

interface TitleResult {
  title: string
  frequency: number
  category: string
  relevanceScore: number
}

export default function TitleGeneratorPage() {
  const { data: session } = useSession()
  const firstName = session?.user?.name ? session.user.name.split(' ')[0] : 'Creator'
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [titleResults, setTitleResults] = useState<TitleResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTitles, setSelectedTitles] = useState<string[]>([])
  const [searchType, setSearchType] = useState<'trending' | 'channel' | 'custom'>('trending')

  // Fetch trending titles
  const fetchTrendingTitles = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/youtube/keywords?trending=true')
      if (response.ok) {
        const data = await response.json()
        const formattedTitles = (data.keywords || []).map((keyword: string, index: number) => ({
          title: `${keyword} - Ultimate Guide`,
          frequency: Math.floor(Math.random() * 1000) + 100,
          category: getCategoryForTitle(keyword),
          relevanceScore: 95 - (index * 2)
        }))
        setTitleResults(formattedTitles)
      }
    } catch (error) {
      console.error('Error fetching trending titles:', error)
    } finally {
      setLoading(false)
    }
  }

  // Search titles by keyword
  const searchTitles = async () => {
    if (!searchQuery.trim()) {
      alert('Please enter a search query')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/youtube/keywords?q=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        const formattedTitles = (data.keywords || []).map((keyword: string, index: number) => {
          const titleVariations = [
            `${keyword} - Complete Tutorial`,
            `How to ${keyword} in 2025`,
            `${keyword} Tips & Tricks`,
            `${keyword} Explained`,
            `Best ${keyword} Guide`,
            `${keyword} Secrets Revealed`,
            `${keyword} Masterclass`,
            `${keyword} for Beginners`,
            `Advanced ${keyword}`,
            `${keyword} Challenge`
          ]
          return {
            title: titleVariations[index % titleVariations.length],
            frequency: Math.floor(Math.random() * 500) + 50,
            category: getCategoryForTitle(keyword),
            relevanceScore: 90 - (index * 1)
          }
        })
        setTitleResults(formattedTitles.slice(0, 15))
      }
    } catch (error) {
      console.error('Error searching titles:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch titles from user's channel videos
  const fetchChannelTitles = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/youtube/best-videos?limit=10')
      if (response.ok) {
        const data = await response.json()
        const allTitles: Record<string, number> = {} as Record<string, number>
        
        (data.videos || []).forEach((video: any) => {
          if (video.title) {
            allTitles[video.title] = (allTitles[video.title] || 0) + 1
          }
        })

        const formattedTitles = Object.entries(allTitles)
          .map(([title, count]) => ({
            title,
            frequency: count as number,
            category: getCategoryForTitle(title),
            relevanceScore: Math.min(100, (count as number) * 10)
          }))
          .sort((a, b) => b.frequency - a.frequency)
          .slice(0, 15)

        setTitleResults(formattedTitles)
      }
    } catch (error) {
      console.error('Error fetching channel titles:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryForTitle = (title: string): string => {
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
    
    const lowerTitle = title.toLowerCase()
    for (const [key, category] of Object.entries(categories)) {
      if (lowerTitle.includes(key)) return category
    }
    return 'General'
  }

  const toggleTitle = (title: string) => {
    setSelectedTitles(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    )
  }

  const copySelectedTitles = () => {
    const titleString = selectedTitles.join('\n')
    navigator.clipboard.writeText(titleString)
    alert('Titles copied to clipboard!')
  }

  const exportTitles = () => {
    const data = {
      date: new Date().toISOString(),
      titles: selectedTitles,
      count: selectedTitles.length
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `titles-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    fetchTrendingTitles()
  }, [])

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <SharedSidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <main className="p-4 sm:p-6 lg:p-8">
          {/* Top Navigation Bar */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>
            <div className="flex-1 ml-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">✨ Title Generator</h1>
            </div>
          </div>

          {/* Header */}
          <div className="mb-10">
            <p className="text-gray-600 text-lg">Generate and manage engaging titles for your videos</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar - Search Options */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Search Type Selection */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200 p-6">
                  <h3 className="font-bold text-blue-900 mb-4">Search Type</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-blue-100 transition-colors">
                      <input
                        type="radio"
                        name="searchType"
                        value="trending"
                        checked={searchType === 'trending'}
                        onChange={(e) => {
                          setSearchType(e.target.value as 'trending' | 'channel' | 'custom')
                          fetchTrendingTitles()
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
                          fetchChannelTitles()
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

                {/* Custom Search */}
                {searchType === 'custom' && (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6">
                    <h3 className="font-bold text-purple-900 mb-4">Search Titles</h3>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchTitles()}
                      placeholder="e.g., gaming, tutorials..."
                      className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none mb-3"
                    />
                    <button
                      onClick={searchTitles}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-all"
                    >
                      {loading ? 'Generating...' : 'Generate'}
                    </button>
                  </div>
                )}

                {/* Selected Titles Count */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-6">
                  <h3 className="font-bold text-emerald-900 mb-3">Selected Titles</h3>
                  <p className="text-2xl font-bold text-emerald-700 mb-4">{selectedTitles.length}</p>
                  {selectedTitles.length > 0 && (
                    <div className="space-y-2">
                      <button
                        onClick={copySelectedTitles}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg font-semibold text-sm transition-colors"
                      >
                        📋 Copy Titles
                      </button>
                      <button
                        onClick={exportTitles}
                        className="w-full bg-teal-500 hover:bg-teal-600 text-white px-3 py-2 rounded-lg font-semibold text-sm transition-colors"
                      >
                        📥 Export
                      </button>
                      <button
                        onClick={() => setSelectedTitles([])}
                        className="w-full bg-gray-300 hover:bg-gray-400 text-gray-900 px-3 py-2 rounded-lg font-semibold text-sm transition-colors"
                      >
                        🗑️ Clear
                      </button>
                    </div>
                  )}
                </div>

                {/* Tips */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h4 className="font-bold text-blue-900 mb-3">💡 Tips</h4>
                  <ul className="text-sm text-blue-800 space-y-2">
                    <li>• Keep titles under 60 chars</li>
                    <li>• Use power words</li>
                    <li>• Include keywords</li>
                    <li>• Click to select titles</li>
                  </ul>
                </div>
              </div>
            </aside>

            {/* Main Content - Titles List */}
            <div className="lg:col-span-3">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : titleResults.length > 0 ? (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200 p-6 mb-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-gray-600 text-sm">Total Titles</p>
                        <p className="text-3xl font-bold text-blue-600">{titleResults.length}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Selected</p>
                        <p className="text-3xl font-bold text-purple-600">{selectedTitles.length}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Avg Score</p>
                        <p className="text-3xl font-bold text-emerald-600">
                          {Math.round(
                            titleResults.reduce((sum, t) => sum + t.relevanceScore, 0) / titleResults.length
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Titles Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {titleResults.map((result, index) => (
                      <button
                        key={index}
                        onClick={() => toggleTitle(result.title)}
                        className={`text-left p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                          selectedTitles.includes(result.title)
                            ? 'bg-gradient-to-br from-blue-500 to-cyan-500 border-transparent text-white shadow-lg'
                            : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md text-gray-900'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-bold text-lg">{result.title}</h4>
                            <p className={`text-xs ${selectedTitles.includes(result.title) ? 'text-white/80' : 'text-gray-500'}`}>
                              {result.category}
                            </p>
                          </div>
                          {selectedTitles.includes(result.title) && (
                            <span className="text-2xl">✓</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="text-xs">
                              <span className={selectedTitles.includes(result.title) ? 'text-white/80' : 'text-gray-600'}>
                                Popularity:
                              </span>
                              <span className="font-semibold ml-1">{result.frequency}</span>
                            </div>
                            <div className="text-xs">
                              <span className={selectedTitles.includes(result.title) ? 'text-white/80' : 'text-gray-600'}>
                                Score:
                              </span>
                              <span className="font-semibold ml-1">{result.relevanceScore}%</span>
                            </div>
                          </div>

                          {/* Score Bar */}
                          <div className="w-20 h-1 bg-gray-300 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${selectedTitles.includes(result.title) ? 'bg-white' : 'bg-blue-500'}`}
                              style={{ width: `${result.relevanceScore}%` }}
                            ></div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
                  <div className="text-6xl mb-4">✨</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">No Titles Generated</h3>
                  <p className="text-gray-600">Try searching for different keywords or select a different search type</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
