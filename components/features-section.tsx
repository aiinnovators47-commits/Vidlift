"use client"

import { Sparkles, Zap, TrendingUp, Users, Video, BarChart3, Clock, Target, Rocket, Brain, Shield, Globe } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const features = [
  {
    icon: TrendingUp,
    title: "Growth Analytics",
    description: "Track performance with real-time insights. See what works and scale your success.",
    gradient: "from-green-500 to-emerald-500",
    bgGradient: "from-green-50 to-emerald-50"
  },
  {
    icon: BarChart3,
    title: "Competitor Analysis",
    description: "Spy on competitors' strategies. Learn from the best and outperform your niche.",
    gradient: "from-indigo-500 to-blue-500",
    bgGradient: "from-indigo-50 to-blue-50"
  },
  {
    icon: Target,
    title: "SEO Optimization",
    description: "Rank higher with AI-optimized tags, descriptions, and thumbnails for maximum visibility.",
    gradient: "from-pink-500 to-rose-500",
    bgGradient: "from-pink-50 to-rose-50"
  },
  {
    icon: Users,
    title: "Audience Insights",
    description: "Understand your viewers deeply. Get demographic data and engagement patterns.",
    gradient: "from-teal-500 to-cyan-500",
    bgGradient: "from-teal-50 to-cyan-50"
  },
  {
    icon: Clock,
    title: "Time-Saving Automation",
    description: "Automate repetitive tasks. Focus on creating while AI handles the rest.",
    gradient: "from-violet-500 to-purple-500",
    bgGradient: "from-violet-50 to-purple-50"
  },
  {
    icon: Shield,
    title: "Brand Safety",
    description: "Protect your channel with AI content moderation and compliance checks.",
    gradient: "from-amber-500 to-yellow-500",
    bgGradient: "from-amber-50 to-yellow-50"
  }
]

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 sm:py-32 lg:py-40 bg-white overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-purple-100/20 rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-blue-100/60 border border-blue-200 px-4 py-2 rounded-full mb-8">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-600">
              Powerful Features
            </span>
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-6 max-w-4xl mx-auto">
            Everything you need to
            <span className="block mt-3 bg-linear-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              Dominate YouTube
            </span>
          </h2>

          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Our AI-powered platform gives you all the tools to create, optimize, and grow your channel faster than ever before.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative"
            >
              {/* Card Glow Effect */}
              <div className={`absolute -inset-0.5 bg-gradient-to-r ${feature.gradient} rounded-3xl blur opacity-0 group-hover:opacity-20 transition duration-500`} />

              {/* Card */}
              <div className={`relative h-full p-8 rounded-3xl bg-gradient-to-br ${feature.bgGradient} border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl`}>
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-r ${feature.gradient} mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover Arrow */}
                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className={`text-sm font-semibold bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent inline-flex items-center gap-2`}>
                    Learn more
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-6">
            Join thousands of creators who are already growing faster with AI
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Badge className="px-4 py-2 bg-green-100 text-green-700 border-green-200">
              <Zap className="w-4 h-4 mr-2" />
              50,000+ Videos Created
            </Badge>
            <Badge className="px-4 py-2 bg-blue-100 text-blue-700 border-blue-200">
              <Users className="w-4 h-4 mr-2" />
              10,000+ Active Creators
            </Badge>
            <Badge className="px-4 py-2 bg-purple-100 text-purple-700 border-purple-200">
              <TrendingUp className="w-4 h-4 mr-2" />
              250,000+ Hours Saved
            </Badge>
          </div>
        </div>
      </div>
    </section>
  )
}
