'use client'

import { BarChart3, Target, Zap, Play, Users, TrendingUp } from 'lucide-react'
import { useScrollAnimation, useStaggeredAnimation } from '@/hooks/useScrollAnimation'

export function FeaturesHighlight() {
  const { isVisible: headerVisible, elementRef: headerRef } = useScrollAnimation({ threshold: 0.1 })
  const { visibleItems: featureItems, containerRef: featuresRef } = useStaggeredAnimation(3, { threshold: 0.1 })
  const { visibleItems: statItems, containerRef: statsRef } = useStaggeredAnimation(4, { threshold: 0.1 })

  const features = [
    {
      icon: BarChart3,
      title: "Actionable Analytics",
      description: "Understand what works with creator-friendly dashboards and automated recommendations that are easy to act on.",
      color: "blue"
    },
    {
      icon: Target,
      title: "ASAP Growth Plays",
      description: "Data-backed titles, descriptions and tags optimized to maximize discoverability and watch-time.",
      color: "emerald"
    },
    {
      icon: Zap,
      title: "Automated Workflows",
      description: "From scheduling to auto-detecting uploads, save hours every week with reliable automation built for creators.",
      color: "purple"
    }
  ]

  const getIconColor = (color: string) => {
    switch(color) {
      case 'blue': return 'text-blue-600'
      case 'emerald': return 'text-emerald-600'
      case 'purple': return 'text-purple-600'
      default: return 'text-gray-600'
    }
  }

  const getBgColor = (color: string) => {
    switch(color) {
      case 'blue': return 'bg-blue-50'
      case 'emerald': return 'bg-emerald-50'
      case 'purple': return 'bg-purple-50'
      default: return 'bg-gray-50'
    }
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div 
          ref={headerRef}
          className={`text-center mb-16 transition-all duration-1000 ${
            headerVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-12'
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-6 animate-pulse">
            <Play className="w-4 h-4" />
            <span>Built for creators who mean business</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 max-w-3xl mx-auto">
            Enterprise-grade workflows, scaled for individual creators
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Analytics, automated uploads, and proven growth playbooks that actually work.
          </p>
        </div>

        <div 
          ref={featuresRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon
            const isVisible = featureItems.includes(index)
            return (
              <div 
                key={index}
                data-animate-item={index}
                className={`group bg-white rounded-2xl p-8 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-700 ${
                  isVisible 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-12'
                } hover:-translate-y-2`}
              >
                <div className={`w-14 h-14 ${getBgColor(feature.color)} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-500 ${isVisible ? 'animate-bounce' : ''}`}>
                  <Icon className={`w-6 h-6 ${getIconColor(feature.color)} transition-colors duration-300`} />
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

        {/* Additional stats section */}
        <div 
          ref={statsRef}
          className="mt-20 pt-12 border-t border-gray-200"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "10K+", label: "Active Creators" },
              { number: "50M+", label: "Videos Analyzed" },
              { number: "98%", label: "Uptime" },
              { number: "24/7", label: "Support" }
            ].map((stat, index) => {
              const isVisible = statItems.includes(index)
              return (
                <div 
                  key={index} 
                  data-animate-item={index}
                  className={`group transition-all duration-700 ${
                    isVisible 
                      ? 'opacity-100 translate-y-0' 
                      : 'opacity-0 translate-y-8'
                  }`}
                >
                  <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                    {stat.number}
                  </div>
                  <div className="text-gray-600 font-medium">
                    {stat.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}