import React from 'react'
import { Video } from 'lucide-react'

interface TrendingVideo {
  id: string
  title: string
  channelTitle: string
  thumbnail: string
  viewCount: string
  publishedAt: string
}

export default function TrendingVideosCard({ 
  trendingVideos, 
  loadingVideos 
}: { 
  trendingVideos: TrendingVideo[]
  loadingVideos: boolean 
}) {
  if (loadingVideos) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-gray-200 aspect-video animate-pulse"></div>
            <div className="p-3">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!trendingVideos || trendingVideos.length === 0) {
    return (
      <div className="text-center py-8">
        <Video className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No trending videos found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {trendingVideos.map((video) => (
        <a 
          key={video.id}
          href={`https://youtube.com/watch?v=${video.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="relative aspect-video">
            <img 
              src={video.thumbnail} 
              alt={video.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
          </div>
          <div className="p-3">
            <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">
              {video.title}
            </h3>
            <p className="text-xs text-gray-600 mb-2">{video.channelTitle}</p>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>{video.viewCount} views</span>
              <span>{new Date(video.publishedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </a>
      ))}
    </div>
  )
}