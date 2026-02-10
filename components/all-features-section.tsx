'use client'

import { Sparkles, Zap, TrendingUp, Tv, MessageSquare, Brain, Video, Search, Lightbulb, BarChart4, Clock, Users } from 'lucide-react'
import { useScrollAnimation, useStaggeredAnimation } from '@/hooks/useScrollAnimation'

const features = [
  {
    icon: Sparkles,
    title: 'AI Title Generator',
    description: 'Generate engaging, SEO-optimized titles that boost click-through rates'
  },
  {
    icon: Zap,
    title: 'Thumbnail Creator',
    description: 'Create eye-catching thumbnails with AI that stand out in feeds'
  },
  {
    icon: TrendingUp,
    title: 'Trend Analysis',
    description: 'Stay ahead with real-time trending topics and keyword insights'
  },
  {
    icon: Tv,
    title: 'Description Optimizer',
    description: 'Auto-generate detailed descriptions with timestamps and keywords'
  },
  {
    icon: MessageSquare,
    title: 'Engagement Booster',
    description: 'Get AI-suggested captions and comments to boost interactions'
  },
  {
    icon: Brain,
    title: 'Smart Analytics',
    description: 'Deep dive analytics to understand what content resonates'
  },
  {
    icon: Video,
    title: 'Auto-Detect Uploads',
    description: 'Automatically detect when you upload and analyze your content instantly'
  },
  {
    icon: Search,
    title: 'Keyword Research',
    description: 'Find high-potential keywords and tags for maximum discoverability'
  },
  {
    icon: Lightbulb,
    title: 'Content Ideas',
    description: 'Get data-driven suggestions for your next viral content ideas'
  }
]

export function AllFeaturesSection() {
  const { isVisible: headerVisible, elementRef: headerRef } = useScrollAnimation({ threshold: 0.1 })
  const { visibleItems: featureItems, containerRef: featuresRef } = useStaggeredAnimation(9, { threshold: 0.1 })

  return (
    <section
      className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div 
          ref={headerRef}
          className={`text-center mb-16 transition-all duration-1000 ${
            headerVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-12'
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-6 animate-pulse">
            <Sparkles className="w-4 h-4" />
            <span>Everything you need to grow</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Powerful Features Built for Growth
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From AI-powered tools to analytics, we have everything you need to create viral content and grow your YouTube channel.
          </p>
        </div>

        {/* Features Grid */}
        <div 
          ref={featuresRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon
            const isVisible = featureItems.includes(index)

            return (
              <div
                key={index}
                data-animate-item={index}
                className={`group bg-white rounded-2xl p-8 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-700 hover:-translate-y-2 ${
                  isVisible
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-12 scale-95'
                }`}
              >
                <div className={`w-12 h-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-500 ${isVisible ? 'animate-pulse' : ''}`}>
                  <Icon className="w-6 h-6 text-blue-600 transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed transition-opacity duration-500">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 md:p-12 text-white">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">Ready to get started?</h3>
            <p className="text-blue-100 text-lg mb-6 max-w-2xl mx-auto">
              Join thousands of creators who are already using our tools to grow their channels faster.
            </p>
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-300">
              Start Free Trial
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
