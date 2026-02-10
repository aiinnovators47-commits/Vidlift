"use client"

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Loader2, Tags as TagsIcon } from 'lucide-react'
import Image from 'next/image'

interface VideoWithMissingTags {
  id: string
  title: string
  thumbnail: string
  publishedAt: string
  tags: string[]
  suggestedTags: string[]
}

interface AddMissingTagsCardProps {
  videos?: VideoWithMissingTags[]
}

export default function AddMissingTagsCard({ videos = [] }: AddMissingTagsCardProps) {
  const [selectedVideo, setSelectedVideo] = useState<VideoWithMissingTags | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [publishing, setPublishing] = useState(false)
  const [showMore, setShowMore] = useState(false)

  if (videos.length === 0) {
    return null
  }

  const currentVideo = selectedVideo || videos[0]

  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove))
  }

  const handlePublishTags = async () => {
    if (!currentVideo || selectedTags.length === 0) return

    setPublishing(true)
    try {
      const response = await fetch('/api/youtube/update-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: currentVideo.id,
          tags: [...currentVideo.tags, ...selectedTags]
        })
      })

      if (response.ok) {
        // Refresh or update UI
        window.location.reload()
      }
    } catch (error) {
      console.error('Error publishing tags:', error)
    } finally {
      setPublishing(false)
    }
  }

  // Tag score/badges from screenshot
  const tagScores = [51, 52, 47, 60, 59]

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-slate-700/50 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TagsIcon className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Add Missing Tags</h3>
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
              <TagsIcon className="w-12 h-12 text-slate-500" />
            </div>
          )}
        </div>

        {/* Tags Section */}
        <div className="flex-1">
          <h4 className="font-medium text-white mb-4 text-base">{currentVideo.title}</h4>
          
          {/* Suggested Tags with scores */}
          <div className="flex flex-wrap gap-2 mb-4">
            {(showMore ? currentVideo.suggestedTags : currentVideo.suggestedTags.slice(0, 5)).map((tag, index) => {
              const isSelected = selectedTags.includes(tag)
              const score = tagScores[index] || 50
              return (
                <button
                  key={index}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isSelected 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                      : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:border-slate-600'
                  }`}
                  onClick={() => {
                    if (isSelected) {
                      handleRemoveTag(tag)
                    } else {
                      setSelectedTags([...selectedTags, tag])
                    }
                  }}
                >
                  <span className="text-xs font-bold opacity-75">{score}</span>
                  <span>{tag}</span>
                  {isSelected && (
                    <X className="w-3.5 h-3.5" onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveTag(tag)
                    }} />
                  )}
                </button>
              )
            })}
          </div>

          {/* Show More/Less */}
          {currentVideo.suggestedTags.length > 5 && (
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
            onClick={handlePublishTags}
            disabled={selectedTags.length === 0 || publishing}
            className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {publishing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              'Publish Tags'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
