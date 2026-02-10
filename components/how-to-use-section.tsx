'use client'

import { useEffect, useRef, useState } from 'react'
import { Zap, BarChart3, Sparkles, CheckCircle, Link, Brain, Play, TrendingUp } from 'lucide-react'

const steps = [
  {
    icon: Link,
    title: 'Connect Your Channel',
    description: 'Link your YouTube channel with one click. We analyze your content strategy and audience insights.',
    number: '01'
  },
  {
    icon: Brain,
    title: 'Get AI Insights',
    description: 'Receive data-driven recommendations for titles, descriptions, thumbnails, and engagement tactics.',
    number: '02'
  },
  {
    icon: Sparkles,
    title: 'Generate Content',
    description: 'Let AI generate optimized content that matches your channel voice and resonates with your audience.',
    number: '03'
  },
  {
    icon: TrendingUp,
    title: 'Publish & Grow',
    description: 'Publish with confidence and watch your views, subscribers, and engagement skyrocket.',
    number: '04'
  }
]

export function HowToUseSection() {
  const [visibleSteps, setVisibleSteps] = useState<number[]>([])
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const stepElements = entry.target.querySelectorAll('[data-step]')
            stepElements.forEach((el) => {
              const stepIndex = parseInt(el.getAttribute('data-step') || '0')
              setTimeout(() => {
                setVisibleSteps((prev) => [...new Set([...prev, stepIndex])])
              }, stepIndex * 100)
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-6">
            <Play className="w-4 h-4" />
            <span>Simple 4-step process</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Simple, powerful, and designed for creators who want to grow faster. Get started in minutes.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 to-blue-400 transform -translate-x-1/2"></div>
          
          <div className="space-y-12">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isVisible = visibleSteps.includes(index)
              const isEven = index % 2 === 0

              return (
                <div
                  key={index}
                  data-step={index}
                  className={`flex items-center ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 ${
                    isVisible
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-8'
                  }`}
                >
                  {/* Step number and content */}
                  <div className={`flex-1 ${isEven ? 'md:text-right' : 'md:text-left'}`}>
                    <div className="inline-flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-bold">{step.number}</span>
                      </div>
                      <div className={`hidden md:block w-12 h-0.5 bg-blue-200 ${isEven ? 'mr-4' : 'ml-4'}`}></div>
                    </div>
                    
                    <div className={`bg-white rounded-2xl p-8 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-500 ${isEven ? 'md:mr-8' : 'md:ml-8'}`}>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Icon */}
                  <div className="flex-shrink-0 relative z-10">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300">
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                  </div>

                  {/* Empty space for alignment */}
                  <div className="flex-1 hidden md:block"></div>
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 md:p-12 text-white max-w-3xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">Ready to start growing?</h3>
            <p className="text-blue-100 text-lg mb-6">
              Join thousands of creators who are already using our platform to grow their YouTube channels.
            </p>
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-300">
              Get Started Now
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
