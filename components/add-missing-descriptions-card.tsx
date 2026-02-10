"use client"

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, FileText } from 'lucide-react'
import Image from 'next/image'

interface VideoWithMissingDescription {
  id: string
  title: string
  thumbnail: string
  publishedAt: string
  description: string
  suggestedDescription: string
}

interface AddMissingDescriptionsCardProps {
  videos?: VideoWithMissingDescription[]
}

export default function AddMissingDescriptionsCard({ videos = [] }: AddMissingDescriptionsCardProps) {
  const [selectedVideo, setSelectedVideo] = useState<VideoWithMissingDescription | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [showMore, setShowMore] = useState(false)

  if (videos.length === 0) {
    return null
  }

  const currentVideo = selectedVideo || videos[0]
  const descriptionPreview = showMore 
    ? currentVideo.suggestedDescription 
    : currentVideo.suggestedDescription.slice(0, 200) + '...'

  const handlePublishDescription = async () => {
    if (!currentVideo) return

    setPublishing(true)
    try {
      const response = await fetch('/api/youtube/update-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: currentVideo.id,
          description: currentVideo.suggestedDescription
        })
      })

      if (response.ok) {
        // Refresh or update UI
        window.location.reload()
      }
    } catch (error) {
      console.error('Error publishing description:', error)
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-slate-700/50 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Add Missing Descriptions</h3>
        </div>
        <span className="text-sm text-slate-400">• 15m ago</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Video Thumbnail */}
        <div className="relative w-full lg:w-64 h-36 bg-slate-800 rounded-xl overflow-hidden flex-shrink-0 border border-slate-700/50">
          {currentVideo.thumbnail && currentVideo.thumbnail !== 'https://i.ytimg.com/vi/sample/maxresdefault.jpg' ? (
            <Image
              src={currentVideo.thumbnail}
              alt={currentVideo.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
              <FileText className="w-12 h-12 text-slate-500" />
            </div>
          )}
        </div>

        {/* Description Section */}
        <div className="flex-1">
          <h4 className="font-medium text-white mb-4 text-base">{currentVideo.title}</h4>
          
          {/* Description Preview */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-4">
            <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
              {descriptionPreview}
            </p>
          </div>

          {/* Show More/Less */}
          {currentVideo.suggestedDescription.length > 200 && (
            <button
              onClick={() => setShowMore(!showMore)}
              className="text-sm text-slate-400 hover:text-white mb-4 inline-flex items-center gap-1 transition-colors"
            >
              <span className={`text-xs transition-transform ${showMore ? 'rotate-180' : ''}`}>▼</span>
              {showMore ? 'Show less' : 'Show more'}
            </button>
          )}

          {/* Publish Button */}
          <Button
            onClick={handlePublishDescription}
            disabled={publishing}
            className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {publishing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              'Publish description'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
