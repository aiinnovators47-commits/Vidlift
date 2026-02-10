'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Zap, Users, TrendingUp, Star } from 'lucide-react'
import Link from 'next/link'

export function StartNowSection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
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
      className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50"
    >
      <div className="max-w-6xl mx-auto">
        {/* Main Card */}
        <div
          className={`bg-white rounded-3xl p-8 md:p-12 border border-gray-200 shadow-xl overflow-hidden relative transition-all duration-700 transform hover:shadow-2xl ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          {/* Content */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left side - Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                <span>Join 10,000+ creators</span>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Transform Your YouTube Channel Today
              </h2>

              <p className="text-lg text-gray-600 mb-8 max-w-lg">
                Join thousands of successful creators who are already using our AI-powered tools to grow their YouTube channels faster.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gray-100 text-gray-900 font-semibold hover:bg-gray-200 transition-colors duration-300"
                >
                  View Pricing
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span>4.9/5 Rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>10K+ Users</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>250% Growth</span>
                </div>
              </div>
            </div>

            {/* Right side - Visual */}
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <div className="text-4xl">🚀</div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Launch?</h3>
                  <p className="text-gray-600">Start your growth journey in seconds</p>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <Star className="w-6 h-6 text-yellow-400 fill-current" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { number: "10K+", label: "Active Creators" },
              { number: "2M+", label: "Videos Analyzed" },
              { number: "250%", label: "Avg. Growth" },
              { number: "99.9%", label: "Uptime" }
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-2xl md:text-3xl font-bold mb-1">{stat.number}</div>
                <div className="text-blue-100 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
