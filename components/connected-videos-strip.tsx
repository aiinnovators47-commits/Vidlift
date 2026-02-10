"use client"

import React, { useEffect, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Play, BarChart2 } from 'lucide-react'

interface VideoItem {
  id: string
  title: string
  thumbnail: string
  publishedAt?: string
  duration?: string
  isShort?: boolean
}

interface ConnectedVideosStripProps {
  videos?: VideoItem[]
}

export default function ConnectedVideosStrip({ videos = [] }: ConnectedVideosStripProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Simple auto-scroll loop
  useEffect(() => {
    const el = containerRef.current
    if (!el || videos.length === 0) return

    let rafId: number | null = null
    let last = performance.now()
    const speed = 30 // pixels per second

    const step = (t: number) => {
      const delta = t - last
      last = t
      el.scrollLeft += (speed * delta) / 1000
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 1) {
        el.scrollLeft = 0
      }
      rafId = requestAnimationFrame(step)
    }

    rafId = requestAnimationFrame(step)
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [videos])

  const handleAnalyze = async (video: VideoItem) => {
    try {
      // Placeholder action — you can wire this to a real endpoint
      await fetch('/api/analyze-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: video.id })
      })
      alert(`Analysis started for: ${video.title}`)
    } catch (err) {
      console.error(err)
      alert('Failed to start analysis')
    }
  }

  const handleDecide = (video: VideoItem) => {
    // Decided to open the video page in a new tab for quick action
    window.open(`https://www.youtube.com/watch?v=${video.id}`, '_blank')
  }

  if (!videos || videos.length === 0) return null

  return (
    <div className="mb-8">
      {/* No outer card — strip of video cards only */}
      <div
        ref={containerRef}
        className="flex gap-4 overflow-x-auto no-scrollbar py-2 px-1 items-start"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {videos.map((v) => (
          <div
            key={v.id}
            className="w-56 shrink-0 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl overflow-hidden border border-slate-700/50 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all"
            style={{ scrollSnapAlign: 'start' }}
          >
            <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
              <Image src={v.thumbnail} alt={v.title} fill className="object-cover" />
              {v.isShort && (
                <span className="absolute left-3 top-3 bg-sky-500 text-white text-xs px-2 py-0.5 rounded">Short</span>
              )}
              {v.duration && (
                <span className="absolute right-3 bottom-3 bg-black/70 text-white text-xs px-2 py-0.5 rounded">{v.duration}</span>
              )}
              <span className="absolute left-3 bottom-3 bg-white/10 text-white text-xs px-2 py-0.5 rounded">4K</span>
            </div>

            <div className="p-3 bg-gradient-to-t from-slate-900/60 to-transparent">
              <div className="text-sm font-semibold text-white line-clamp-2 mb-3">{v.title}</div>
              <div className="flex gap-2">
                <button onClick={() => handleAnalyze(v)} className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white py-2 px-3 rounded-lg text-sm font-semibold shadow-md">
                  <BarChart2 className="w-4 h-4" /> Analyze
                </button>
                <button onClick={() => handleDecide(v)} className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white py-2 px-3 rounded-lg text-sm font-semibold shadow-sm">
                  Decide
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
