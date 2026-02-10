"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import SharedSidebar from "@/components/shared-sidebar"
import { Menu, X, Copy, Download, Trash2 } from "lucide-react"

interface DescriptionResult {
  description: string
  type: string
  length: number
  engagement: number
}

export default function DescriptionGeneratorPage() {
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [descriptionResults, setDescriptionResults] = useState<DescriptionResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDescription, setSelectedDescription] = useState<string | null>(null)
  const [searchType, setSearchType] = useState<'trending' | 'channel' | 'custom'>('trending')

  // Fetch trending descriptions
  const fetchTrendingDescriptions = async () => {
    setLoading(true)
    try {
      const descriptions = [
        {
          description: "🎯 Check this out! Don't forget to LIKE and SUBSCRIBE for more amazing content!\n\n📱 Follow us on social media:\n• Instagram: @channel\n• TikTok: @channel\n• Discord: Join our community\n\n⏰ Timestamps:\n0:00 - Introduction\n2:15 - Main Content\n5:30 - Conclusion\n\n#viral #trending #content",
          type: "Engaging",
          length: 284,
          engagement: 92
        },
        {
          description: "Welcome to our channel! In this video, we're diving deep into the latest trends and tips.\n\nThis video covers:\n✓ Key insights\n✓ Practical tips\n✓ Real examples\n✓ Best practices\n\nDon't miss out - Subscribe now!\n\n#education #tutorial #tips",
          type: "Educational",
          length: 201,
          engagement: 85
        },
        {
          description: "🔥 BEST VIDEO EVER! 🔥\n\nFull guide inside:\n→ Complete breakdown\n→ Step-by-step process\n→ Expert tips\n→ Bonus content\n\nSUBSCRIBE for daily videos!\nLIKE if you found this helpful!\nCOMMENT your thoughts below!\n\n#trending #viral #musthave",
          type: "Viral",
          length: 219,
          engagement: 94
        },
        {
          description: "In today's video:\n\n1. Introduction to the topic\n2. Detailed explanation\n3. Practical application\n4. Conclusion and takeaways\n\nResources mentioned:\n• Link 1: [insert link]\n• Link 2: [insert link]\n\nThanks for watching!\n\n#content #creator #channel",
          type: "Standard",
          length: 198,
          engagement: 78
        },
        {
          description: "🚀 This will CHANGE YOUR LIFE! 🚀\n\nWhat you'll learn:\n📌 Secret technique revealed\n📌 Proven strategy\n📌 Step-by-step guide\n📌 Bonus tips\n\n⭐ LIKE if this helped you!\n🔔 SUBSCRIBE for more!\n💬 COMMENT below!\n\nTags: #transformation #success #motivation",
          type: "Action-Driven",
          length: 224,
          engagement: 89
        },
        {
          description: "Hey everyone! Welcome back to the channel. Today we're exploring something really cool and interesting that I think you'll love.\n\nIn this video you'll discover:\n• New perspective\n• Fresh insights\n• Practical advice\n• Actionable steps\n\nDon't forget to hit subscribe!\n\n#explore #discover #newcontent",
          type: "Casual",
          length: 208,
          engagement: 81
        }
      ]
      setDescriptionResults(descriptions)
    } catch (error) {
      console.error('Error fetching descriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  // Search descriptions by keyword
  const searchDescriptions = async () => {
    if (!searchQuery.trim()) {
      alert('Please enter a topic')
      return
    }

    setLoading(true)
    try {
      const descriptions = [
        {
          description: `🎯 ${searchQuery} - Complete Guide!\n\nIn this video, we cover everything you need to know about ${searchQuery}.\n\n✓ What is ${searchQuery}\n✓ How to use it\n✓ Best practices\n✓ Pro tips\n\nLIKE and SUBSCRIBE for more!\n\n#${searchQuery.replace(/\s+/g, '')} #trending`,
          type: "Educational",
          length: 189,
          engagement: 85
        },
        {
          description: `🔥 ${searchQuery} SECRETS REVEALED! 🔥\n\nDiscover the best ways to master ${searchQuery}:\n→ Foundation\n→ Advanced techniques\n→ Common mistakes\n→ Success stories\n\nSubscribe for daily tips!\n\n#${searchQuery.replace(/\s+/g, '')} #guide`,
          type: "Engaging",
          length: 172,
          engagement: 88
        },
        {
          description: `Learn ${searchQuery} Like a Pro!\n\nThis comprehensive guide teaches you:\n1. Basics of ${searchQuery}\n2. Intermediate techniques\n3. Advanced strategies\n4. Real-world applications\n\nDon't miss out - Hit that subscribe button!\n\n#tutorial #${searchQuery.replace(/\s+/g, '')}`,
          type: "Professional",
          length: 176,
          engagement: 82
        }
      ]
      setDescriptionResults(descriptions)
    } catch (error) {
      console.error('Error searching descriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch descriptions from channel
  const fetchChannelDescriptions = async () => {
    setLoading(true)
    try {
      const descriptions = [
        {
          description: "Welcome back! In this video, we're continuing our series on must-know topics.\n\nDon't forget:\n• Subscribe for notifications\n• Leave a comment\n• Share with friends\n• Check our other videos\n\nThanks for watching!",
          type: "Series",
          length: 167,
          engagement: 79
        },
        {
          description: "🎬 New video alert!\n\nThis episode covers:\n✓ Recent updates\n✓ What's new\n✓ How to get started\n✓ Next steps\n\nSubscribe now for fresh content every week!\n\n#weekly #updates #channel",
          type: "Update",
          length: 156,
          engagement: 76
        }
      ]
      setDescriptionResults(descriptions)
    } catch (error) {
      console.error('Error fetching channel descriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Description copied!')
  }

  const downloadAsText = (description: string) => {
    const blob = new Blob([description], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `description-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    fetchTrendingDescriptions()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex">
      {/* Sidebar */}
      <SharedSidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors lg:hidden"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">📝 Description Generator</h1>
          </div>

          <p className="text-gray-600 text-lg mb-8">Generate engaging video descriptions that boost engagement</p>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Search Type Buttons */}
            <div className="md:col-span-3 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  setSearchType('trending')
                  fetchTrendingDescriptions()
                }}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  searchType === 'trending'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                📈 Trending
              </button>
              <button
                onClick={() => {
                  setSearchType('channel')
                  fetchChannelDescriptions()
                }}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  searchType === 'channel'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                🎥 Your Channel
              </button>
              <button
                onClick={() => setSearchType('custom')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  searchType === 'custom'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                🔎 Custom
              </button>
            </div>

            {/* Search Input */}
            {searchType === 'custom' && (
              <div className="md:col-span-3 flex gap-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchDescriptions()}
                  placeholder="Enter a topic or keyword..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  onClick={searchDescriptions}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-all"
                >
                  {loading ? 'Generating...' : 'Generate'}
                </button>
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : descriptionResults.length > 0 ? (
            <div className="space-y-4">
              {/* Stats Card */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-gray-500 text-sm">Total Descriptions</p>
                    <p className="text-3xl font-bold text-blue-600">{descriptionResults.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Avg Length</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {Math.round(
                        descriptionResults.reduce((sum, d) => sum + d.length, 0) / descriptionResults.length
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Avg Engagement</p>
                    <p className="text-3xl font-bold text-emerald-600">
                      {Math.round(
                        descriptionResults.reduce((sum, d) => sum + d.engagement, 0) / descriptionResults.length
                      )}
                      %
                    </p>
                  </div>
                </div>
              </div>

              {/* Descriptions Grid */}
              <div className="grid grid-cols-1 gap-4">
                {descriptionResults.map((result, index) => (
                  <div
                    key={index}
                    className={`bg-white rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-lg ${
                      selectedDescription === result.description
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => setSelectedDescription(result.description)}
                  >
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                      <div>
                        <span className="inline-block bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                          {result.type}
                        </span>
                        <p className="text-gray-600 text-sm mt-2">
                          <span className="font-semibold">{result.length}</span> characters • 
                          <span className="font-semibold ml-1">{result.engagement}%</span> engagement potential
                        </p>
                      </div>
                      {selectedDescription === result.description && (
                        <span className="text-2xl">✓</span>
                      )}
                    </div>

                    {/* Description Content */}
                    <div className="p-6">
                      <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm line-clamp-4">
                        {result.description}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            copyToClipboard(result.description)
                          }}
                          className="flex items-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold text-sm transition-colors"
                          title="Copy to clipboard"
                        >
                          <Copy size={16} />
                          Copy
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            downloadAsText(result.description)
                          }}
                          className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold text-sm transition-colors"
                          title="Download as text file"
                        >
                          <Download size={16} />
                          Download
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">
                        {selectedDescription === result.description ? '✓ Selected' : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Selected Description Preview */}
              {selectedDescription && (
                <div className="mt-8 bg-white rounded-lg border-2 border-blue-500 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">📌 Selected Description Preview</h3>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm">
                      {selectedDescription}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => copyToClipboard(selectedDescription)}
                      className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-colors"
                    >
                      📋 Copy to Clipboard
                    </button>
                    <button
                      onClick={() => downloadAsText(selectedDescription)}
                      className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
                    >
                      📥 Download
                    </button>
                    <button
                      onClick={() => setSelectedDescription(null)}
                      className="px-4 py-3 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-lg font-semibold transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Descriptions Yet</h3>
              <p className="text-gray-600">Select a search type or enter a custom topic to generate descriptions</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
