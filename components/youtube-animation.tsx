"use client"

import { useEffect, useState } from "react"
import { Play, Heart, MessageCircle, Share2 } from "lucide-react"

export function YouTubeAnimation() {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    setIsAnimating(true)
  }, [])

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Animated Background Circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-300/20 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
      </div>

      {/* YouTube Video Player Animation */}
      <div className="relative z-10 w-full max-w-sm mx-auto">
        {/* Video Thumbnail */}
        <div
          className={`relative mb-6 rounded-2xl overflow-hidden shadow-2xl transform transition-all duration-700 ${
            isAnimating ? "scale-100 opacity-100" : "scale-90 opacity-0"
          }`}
        >
          <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 relative flex items-center justify-center">
            {/* Play Button */}
            <div className="absolute inset-0 flex items-center justify-center hover:bg-black/20 transition">
              <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg hover:bg-red-700 transition transform hover:scale-110">
                <Play className="w-8 h-8 text-white fill-white ml-1" />
              </div>
            </div>

            {/* Video Duration */}
            <span className="absolute bottom-3 right-3 bg-black/80 text-white text-xs px-2 py-1 rounded">12:45</span>
          </div>
        </div>

        {/* Video Info */}
        <div
          className={`space-y-4 transform transition-all duration-700 delay-200 ${
            isAnimating ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          {/* Title */}
          <h3 className="text-xl font-bold text-white leading-tight">
            How to Grow Your YouTube Channel 10X Faster with AI
          </h3>

          {/* Channel Info */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400"></div>
            <div>
              <p className="text-white font-semibold text-sm">YouTube Creator</p>
              <p className="text-gray-300 text-xs">125K subscribers</p>
            </div>
          </div>

          {/* Engagement Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center space-x-2 text-gray-300 hover:text-red-500 transition cursor-pointer group">
              <Heart className="w-5 h-5 group-hover:fill-red-500 transition" />
              <span className="text-sm">1.2M</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300 hover:text-blue-400 transition cursor-pointer">
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm">45K</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300 hover:text-green-400 transition cursor-pointer">
              <Share2 className="w-5 h-5" />
              <span className="text-sm">32K</span>
            </div>
          </div>

          {/* Subscribe Button Animation */}
          <button className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transform transition hover:scale-105 shadow-lg mt-4">
            Subscribe
          </button>
        </div>

        {/* Floating Elements */}
        <div className="absolute -top-10 -right-10 w-20 h-20 bg-red-500/20 rounded-full blur-2xl animate-bounce"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
      </div>
    </div>
  )
}
