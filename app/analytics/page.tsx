"use client"

import { useState, useEffect } from "react"
import { TopCountriesChart } from "@/components/TopCountriesChart"

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

export default function AnalyticsPage() {
  const [youtubeChannel, setYoutubeChannel] = useState<YouTubeChannel | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load channel data from localStorage
    const loadChannelData = () => {
      try {
        if (typeof window === 'undefined') return
        
        const storedChannel = localStorage.getItem("youtube_channel")
        if (storedChannel) {
          const channel = JSON.parse(storedChannel)
          setYoutubeChannel(channel)
        }
      } catch (error) {
        console.error("Failed to load channel data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadChannelData()
  }, [])

  const formatNumber = (num: string) => {
    const n = parseInt(num)
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return n.toString()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Analytics</h1>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
          <p className="text-gray-600">View detailed insights about your YouTube channel performance</p>
        </div>

        {youtubeChannel ? (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-4 mb-6">
                <img 
                  src={youtubeChannel.thumbnail} 
                  alt={youtubeChannel.title} 
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{youtubeChannel.title}</h2>
                  <p className="text-gray-600">{youtubeChannel.customUrl || `youtube.com/channel/${youtubeChannel.id}`}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <p className="text-sm text-blue-800 font-medium">Subscribers</p>
                  <p className="text-2xl font-bold text-blue-900">{formatNumber(youtubeChannel.subscriberCount)}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                  <p className="text-sm text-purple-800 font-medium">Total Views</p>
                  <p className="text-2xl font-bold text-purple-900">{formatNumber(youtubeChannel.viewCount)}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                  <p className="text-sm text-green-800 font-medium">Videos</p>
                  <p className="text-2xl font-bold text-green-900">{formatNumber(youtubeChannel.videoCount)}</p>
                </div>
              </div>
            </div>

            <TopCountriesChart channelId={youtubeChannel.id} />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Channel Connected</h2>
            <p className="text-gray-600 mb-6">Connect your YouTube channel to view analytics.</p>
            <a 
              href="/connect" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Connect Channel
            </a>
          </div>
        )}
      </div>
    </div>
  )
}