"use client"

import { Quote, Star, CheckCircle, Play } from 'lucide-react'
import { useScrollAnimation, useStaggeredAnimation } from '@/hooks/useScrollAnimation'

export function TestimonialsSection() {
  const { isVisible: headerVisible, elementRef: headerRef } = useScrollAnimation({ threshold: 0.1 })
  const { visibleItems: testimonialItems, containerRef: testimonialsRef } = useStaggeredAnimation(4, { threshold: 0.1 })
  const { visibleItems: statItems, containerRef: statsRef } = useStaggeredAnimation(4, { threshold: 0.1 })

  const testimonials = [
    {
      name: 'Alex Chen',
      role: 'Tech Review Channel',
      subs: '120K',
      quote: 'Auto-detect saved me so much time — the streak tracking is brilliant. My engagement increased by 40% in just 2 months.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      verified: true
    },
    {
      name: 'Maya Rodriguez',
      role: 'Fitness & Lifestyle',
      subs: '50K',
      quote: 'The analytics helped me understand what to post next. Growth doubled in 4 weeks and my audience retention improved significantly.',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
      verified: true
    },
    {
      name: 'David Kim',
      role: 'Gaming Channel',
      subs: '8K',
      quote: 'I love the onboarding — it actually makes it easy to stay consistent. The AI title suggestions alone increased my CTR by 60%.',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
      verified: false
    },
    {
      name: 'Sarah Johnson',
      role: 'Cooking Channel',
      subs: '250K',
      quote: 'The thumbnail creator is a game-changer. My videos now stand out in feeds and my watch time has increased dramatically.',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
      verified: true
    }
  ]

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div 
          ref={headerRef}
          className={`text-center mb-16 transition-all duration-1000 ${
            headerVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-12'
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-600 text-sm font-medium mb-6 animate-pulse">
            <CheckCircle className="w-4 h-4" />
            <span>Trusted by creators worldwide</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Real Creators, Real Results
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands of successful YouTubers who use our tools to grow their channels faster.
          </p>
        </div>

        <div 
          ref={testimonialsRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {testimonials.map((t, i) => {
            const isVisible = testimonialItems.includes(i)
            return (
              <div 
                key={i} 
                data-animate-item={i}
                className={`group bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-700 ${
                  isVisible 
                    ? 'opacity-100 translate-y-0 scale-100' 
                    : 'opacity-0 translate-y-12 scale-95'
                } hover:-translate-y-2`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative">
                    <img 
                      src={t.image} 
                      alt={t.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                    {t.verified && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                      {t.name}
                    </h3>
                    <p className="text-sm text-gray-600">{t.role}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-sm font-medium text-gray-900">{t.subs} subs</span>
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="relative">
                  <Quote className="absolute top-0 left-0 w-5 h-5 text-gray-300" />
                  <p className="text-gray-700 pl-7 pt-1 leading-relaxed">
                    "{t.quote}"
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Stats section */}
        <div 
          ref={statsRef}
          className="mt-16 pt-12 border-t border-gray-200"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "50K+", label: "Active Channels" },
              { number: "2M+", label: "Videos Analyzed" },
              { number: "89%", label: "Satisfaction Rate" },
              { number: "4.9/5", label: "Average Rating" }
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