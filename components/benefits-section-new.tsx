'use client'

import { useEffect, useRef, useState } from 'react'
import { TrendingUp, Users, BarChart3, Zap, Target, Award, Lightbulb, Shield } from 'lucide-react'

const benefits = [
  {
    icon: Target,
    title: 'Your Message Becomes Clearer',
    description: 'When your content is strategically optimized, every video reinforces your expertise and brand positioning.',
    color: 'blue'
  },
  {
    icon: Users,
    title: 'Audience Grows Naturally',
    description: 'Structured, high-quality content attracts viewers who are genuinely interested in your niche.',
    color: 'green'
  },
  {
    icon: BarChart3,
    title: 'Channel Becomes an Asset',
    description: 'Build real authority and monetization potential instead of chasing viral moments.',
    color: 'purple'
  },
  {
    icon: Award,
    title: 'Opportunities Find You',
    description: 'As your authority grows, sponsorships, collaborations, and partnerships come naturally.',
    color: 'orange'
  }
]

const getIconColor = (color: string) => {
  switch(color) {
    case 'blue': return 'text-blue-600'
    case 'green': return 'text-green-600'
    case 'purple': return 'text-purple-600'
    case 'orange': return 'text-orange-600'
    default: return 'text-gray-600'
  }
}

const getBgColor = (color: string) => {
  switch(color) {
    case 'blue': return 'bg-blue-50'
    case 'green': return 'bg-green-50'
    case 'purple': return 'bg-purple-50'
    case 'orange': return 'bg-orange-50'
    default: return 'bg-gray-50'
  }
}

export function BenefitsSection() {
  const [visibleBenefits, setVisibleBenefits] = useState<number[]>([])
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const benefitElements = entry.target.querySelectorAll('[data-benefit]')
            benefitElements.forEach((el) => {
              const benefitIndex = parseInt(el.getAttribute('data-benefit') || '0')
              setTimeout(() => {
                setVisibleBenefits((prev) => [...new Set([...prev, benefitIndex])])
              }, benefitIndex * 100)
            })
          }
        })
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="py-20 px-4 sm:px-6 lg:px-8 bg-white"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-600 text-sm font-medium mb-6">
            <Lightbulb className="w-4 h-4" />
            <span>Long-term value</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            What Changes Over Time
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            When your content is optimized and consistent, transformation happens naturally. Build sustainable growth that compounds over time.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon
            const isVisible = visibleBenefits.includes(index)

            return (
              <div
                key={index}
                data-benefit={index}
                className={`group bg-white rounded-2xl p-8 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-500 transform hover:-translate-y-1 ${
                  isVisible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-8'
                }`}
              >
                <div className="flex items-start gap-6">
                  <div className={`w-14 h-14 ${getBgColor(benefit.color)} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-7 h-7 ${getIconColor(benefit.color)}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Additional Value Proposition */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 md:p-12 text-white text-center">
          <div className="max-w-3xl mx-auto">
            <Shield className="w-12 h-12 mx-auto mb-6 text-blue-200" />
            <h3 className="text-2xl md:text-3xl font-bold mb-4">Sustainable Growth That Compounds</h3>
            <p className="text-blue-100 text-lg mb-6">
              Unlike short-term hacks, our approach builds lasting authority that continues growing even when you're not actively posting.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {[
                { label: 'Long-term Value', value: 'Years of growth' },
                { label: 'Sustainable', value: 'Natural expansion' },
                { label: 'Compound Effect', value: 'Growth acceleration' }
              ].map((item, index) => (
                <div key={index} className="bg-white/10 rounded-xl p-4">
                  <div className="text-2xl font-bold text-white">{item.value}</div>
                  <div className="text-blue-200 text-sm">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}