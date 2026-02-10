"use client"

import React from 'react'
import { Play } from 'lucide-react'

export interface YouTubeChannel {
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

export interface AnalyticsData {
  views?: number
  subscribers?: number
  watchTime?: number
}

export default function ChannelSummary({ channel, analyticsData, wide }: { channel: YouTubeChannel | null, analyticsData?: AnalyticsData | null, wide?: boolean }) {
  const formatNumber = (num: number | string | undefined | null) => {
    const n = typeof num === 'string' ? parseInt(num) : (num || 0)
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return n.toString()
  }

  const subs = analyticsData?.subscribers ?? (channel ? parseInt(channel.subscriberCount) : 0)
  const views = analyticsData?.views ?? (channel ? parseInt(channel.viewCount) : 0)
  const watchTime = analyticsData?.watchTime ?? 0

  return (
    <div className={`bg-white border border-gray-200 rounded-2xl p-4 md:p-6 flex ${wide ? 'flex-col md:flex-row items-start md:items-center gap-6' : 'flex-col md:flex-row items-start md:items-center gap-4'} shadow-sm hover:shadow-lg transition-all` }>
      <div className="flex items-center gap-4">
        <div className={`${wide ? 'w-16 h-16 md:w-20 md:h-20' : 'w-12 h-12 md:w-16 md:h-16'} rounded-lg bg-linear-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-md overflow-hidden` }>`
          {channel?.thumbnail ? (
            // Use an actual img tag; next/image can be overkill for small component and require loader
            <img src={channel.thumbnail} alt={channel.title} className={`${wide ? 'w-20 h-20 md:w-20 md:h-20' : 'w-16 h-16'} object-cover rounded-lg`} />
          ) : (
            <Play className="w-6 h-6" />
          )}
        </div>
        <div className="min-w-0">
          <h2 className={`${wide ? 'text-xl md:text-2xl' : 'text-lg md:text-xl'} font-black text-gray-900 truncate`}>{channel?.title || 'Creator Studio'}</h2>
          <p className="text-sm text-gray-500 truncate">{channel?.customUrl || channel?.id || 'No channel connected'}</p>
        </div>
      </div>

      <div className={`${wide ? 'w-full md:w-auto grid grid-cols-3 gap-6 text-center mt-4 md:mt-0 md:ml-auto' : 'w-full md:w-auto grid grid-cols-3 gap-4 text-center mt-3 md:mt-0 md:ml-auto'}`}>
        <div>
          <div className="text-xs text-gray-500">Subscribers</div>
          <div className="text-lg font-bold text-gray-900">{formatNumber(subs)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Views</div>
          <div className="text-lg font-bold text-gray-900">{formatNumber(views)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Watch Time</div>
          <div className="text-lg font-bold text-gray-900">{formatNumber(watchTime)}h</div>
        </div>
      </div>
    </div>
  )
}
