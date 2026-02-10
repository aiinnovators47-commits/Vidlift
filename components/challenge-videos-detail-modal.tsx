"use client"

import React, { useState, useEffect } from 'react'
import { X, Eye, ThumbsUp, MessageCircle, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VideoUpload {
  id: string
  video_title?: string
  videoTitle?: string
  video_views?: number
  videoViews?: number
  video_likes?: number
  videoLikes?: number
  video_comments?: number
  videoComments?: number
  upload_date?: string
  uploadDate?: string
  video_url?: string
  videoUrl?: string
  video_thumbnail?: string
  videoThumbnail?: string
}

interface ChallengeVideosDetailModalProps {
  isOpen: boolean
  onClose: () => void
  challenge: any
  videos: VideoUpload[]
}

export default function ChallengeVideosDetailModal({
  isOpen,
  onClose,
  challenge,
  videos,
}: ChallengeVideosDetailModalProps) {
  const [visibleCount, setVisibleCount] = useState(6)
  const [realTimeViews, setRealTimeViews] = useState<Record<string, number>>({})

  // Real-time view updates
  useEffect(() => {
    if (!isOpen) return

    const initialViews: Record<string, number> = {}
    videos.forEach(video => {
      initialViews[video.id || ''] = getVideoViews(video)
    })
    setRealTimeViews(initialViews)

    // Simulate real-time view updates every 5-10 seconds
    const intervals = videos.map((video, index) => {
      return setInterval(() => {
        setRealTimeViews(prev => ({
          ...prev,
          [video.id || '']: (prev[video.id || ''] || getVideoViews(video)) + Math.floor(Math.random() * 5)
        }))
      }, 5000 + index * 1000) // Stagger the updates
    })

    return () => {
      intervals.forEach(interval => clearInterval(interval))
    }
  }, [isOpen, videos])

  if (!isOpen || !challenge) return null

  const visibleVideos = videos.slice(0, visibleCount)
  const hasMore = visibleCount < videos.length

  const handleViewMore = () => {
    setVisibleCount(prev => prev + 6)
  }

  const getVideoTitle = (video: VideoUpload) => 
    video.video_title || video.videoTitle || 'Untitled Video'

  const getVideoViews = (video: VideoUpload) => 
    video.video_views || video.videoViews || 0

  const getVideoLikes = (video: VideoUpload) => 
    video.video_likes || video.videoLikes || 0

  const getVideoComments = (video: VideoUpload) => 
    video.video_comments || video.videoComments || 0

  const getVideoThumbnail = (video: VideoUpload) =>
    video.video_thumbnail || video.videoThumbnail || `https://img.youtube.com/vi/${video.video_url || video.videoUrl || ''}/mqdefault.jpg`

  const getVideoDate = (video: VideoUpload) => {
    const date = video.upload_date || video.uploadDate
    if (!date) return 'N/A'
    const dateObj = new Date(date)
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getVideoTime = (video: VideoUpload) => {
    const date = video.upload_date || video.uploadDate
    if (!date) return ''
    const dateObj = new Date(date)
    return dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4 border-b border-purple-100 flex-shrink-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                {challenge.challengeTitle}
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                {videos.length} videos uploaded
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
            {visibleVideos.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visibleVideos.map((video, index) => (
                    <div
                      key={video.id || index}
                      className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-blue-300 transition-all duration-300"
                    >
                      {/* Video Thumbnail */}
                      <div className="relative mb-4 rounded-lg overflow-hidden bg-gray-200 aspect-video">
                        <img
                          src={getVideoThumbnail(video)}
                          alt={getVideoTitle(video)}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://via.placeholder.com/320x180?text=Video+${index + 1}`
                          }}
                        />
                        {/* Video Number Badge */}
                        <div className="absolute top-2 left-2">
                          <span className="text-xs font-bold text-white bg-blue-600 px-3 py-1.5 rounded-full shadow-md">
                            Video #{index + 1}
                          </span>
                        </div>
                        {/* Status Badge */}
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="w-5 h-5 text-green-500 drop-shadow-lg" />
                        </div>
                      </div>

                      {/* Video Title */}
                      <h3 className="text-sm font-bold text-gray-900 mb-3 line-clamp-2 min-h-[2.5rem]">
                        {getVideoTitle(video)}
                      </h3>

                      {/* Upload Date & Time */}
                      <div className="flex items-center gap-3 text-xs text-gray-600 mb-3 bg-gray-50 p-2 rounded-lg">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-purple-600" />
                          <span>{getVideoDate(video)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>{getVideoTime(video)}</span>
                        </div>
                      </div>

                      {/* Video Stats */}
                      <div className="space-y-2 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg p-3 border border-blue-100">
                        {/* Views - Real-time */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Eye className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-semibold">Views</span>
                          </div>
                          <span className="text-sm font-bold text-blue-600">
                            {formatNumber(realTimeViews[video.id || ''] || getVideoViews(video))}
                          </span>
                        </div>

                        {/* Likes */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-gray-700">
                            <ThumbsUp className="w-4 h-4 text-pink-600" />
                            <span className="text-xs font-semibold">Likes</span>
                          </div>
                          <span className="text-sm font-bold text-pink-600">
                            {formatNumber(getVideoLikes(video))}
                          </span>
                        </div>

                        {/* Comments */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-gray-700">
                            <MessageCircle className="w-4 h-4 text-green-600" />
                            <span className="text-xs font-semibold">Comments</span>
                          </div>
                          <span className="text-sm font-bold text-green-600">
                            {formatNumber(getVideoComments(video))}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* View More Button */}
                {hasMore && (
                  <div className="flex justify-center pt-4">
                    <Button
                      onClick={handleViewMore}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 shadow-md"
                    >
                      View More Videos
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-gray-600 text-lg">No videos uploaded yet</p>
                <p className="text-gray-500 text-sm mt-2">Start uploading videos to see them here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
