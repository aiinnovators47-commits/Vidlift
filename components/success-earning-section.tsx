"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Zap, TrendingUp, Users, Gift, BarChart3, Sparkles, Play } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function SuccessEarningSection() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isStarting, setIsStarting] = useState(false)

  const handleStartNow = () => {
    setIsStarting(true)
    if (session) {
      router.push("/connect")
    } else {
      router.push("/signup")
    }
  }

  const steps = [
    {
      icon: Play,
      title: "Create Engaging Content",
      description: "Use AI tools to generate titles, thumbnails, and tags that attract viewers"
    },
    {
      icon: BarChart3,
      title: "Analyze & Optimize",
      description: "Get real-time analytics and insights to improve your videos' performance"
    },
    {
      icon: TrendingUp,
      title: "Grow Your Audience",
      description: "Implement proven strategies to increase subscribers and watch time"
    },
    {
      icon: Gift,
      title: "Monetize Your Channel",
      description: "Reach 1K subscribers and start earning money from ads, sponsors, and more"
    }
  ]

  const stats = [
    { number: "10K+", label: "Creators Using Our Platform" },
    { number: "$2M+", label: "Total Earnings Generated" },
    { number: "5x", label: "Average Growth Rate" },
    { number: "24/7", label: "AI Support Available" }
  ]

  return (
    <section className="relative py-24 sm:py-32 lg:py-40 bg-white overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-purple-100/20 rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-blue-100/60 border border-blue-200 px-4 py-2 rounded-full mb-8">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-600">
              Success Stories
            </span>
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-6 max-w-4xl mx-auto">
            Your Path to
            <span className="block mt-3 bg-linear-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              Success
            </span>
          </h2>

          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Four simple steps to grow your YouTube channel and start earning money with AI
          </p>
        </div>

        {/* Journey Steps - Simplified */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div
                key={index}
                className="relative bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100 p-6 hover:border-blue-300 transition-all hover:shadow-lg group"
              >
                {/* Step number circle */}
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm mb-4">
                  {index + 1}
                </div>

                {/* Icon */}
                <Icon className="w-6 h-6 text-blue-600 mb-3" />

                {/* Content */}
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            )
          })}
        </div>

        {/* CTA Section - Simplified */}
        <div className="bg-linear-to-r from-sky-400 to-blue-500 rounded-2xl shadow-lg p-8 sm:p-12 lg:p-16 text-center text-white">
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Growing?
          </h3>

          <p className="text-blue-50 max-w-2xl mx-auto mb-8 text-sm sm:text-base">
            Get instant access to AI tools, analytics, and resources to grow your YouTube channel.
          </p>

          <button
            onClick={handleStartNow}
            disabled={isStarting}
            className="px-10 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all inline-flex items-center gap-2 shadow-lg hover:shadow-xl"
          >
            Start Now
            <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-blue-100 text-xs sm:text-sm mt-6">
            ✅ No credit card required · Start free
          </p>
        </div>
      </div>
    </section>
  )
}
