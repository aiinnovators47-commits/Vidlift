"use client"

import { Sparkles, TrendingUp, Users, Video, Play, ArrowRight, Star, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

const successStories = [
  {
    name: "Sarah Johnson",
    role: "Tech Reviewer",
    channel: "TechSarah",
    subscribers: "2.3M",
    growth: "+847%",
    avatar: "👩‍💻",
    quote: "Creere Snap transformed my channel from 50K to 2.3M subscribers in just 8 months. The AI insights are incredible!",
    stats: [
      { label: "Subscribers", value: "2.3M", change: "+847%" },
      { label: "Monthly Views", value: "45M", change: "+523%" },
      { label: "Revenue", value: "$85K/mo", change: "+1,200%" }
    ],
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-50 to-cyan-50"
  },
  {
    name: "Marcus Davis",
    role: "Gaming Creator",
    channel: "MarcusPlays",
    subscribers: "1.8M",
    growth: "+612%",
    avatar: "🎮",
    quote: "The scheduling automation alone saved me 30 hours per week. Now I can focus on creating content that matters.",
    stats: [
      { label: "Subscribers", value: "1.8M", change: "+612%" },
      { label: "Monthly Views", value: "32M", change: "+445%" },
      { label: "Revenue", value: "$62K/mo", change: "+890%" }
    ],
    gradient: "from-purple-500 to-pink-500",
    bgGradient: "from-purple-50 to-pink-50"
  },
  {
    name: "Emma Chen",
    role: "Lifestyle Vlogger",
    channel: "EmmaDaily",
    subscribers: "950K",
    growth: "+423%",
    avatar: "✨",
    quote: "I finally understand my audience. The analytics dashboard shows me exactly what content to create next.",
    stats: [
      { label: "Subscribers", value: "950K", change: "+423%" },
      { label: "Monthly Views", value: "18M", change: "+367%" },
      { label: "Revenue", value: "$38K/mo", change: "+678%" }
    ],
    gradient: "from-pink-500 to-orange-500",
    bgGradient: "from-pink-50 to-orange-50"
  }
]

export function YouTubeGrowthShowcase() {
  return (
    <section className="relative py-24 overflow-hidden bg-white">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-gradient-to-r from-pink-400/10 to-orange-400/10 rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_0.5px,transparent_0.5px),linear-gradient(to_bottom,#8882_0.5px,transparent_0.5px)] bg-[size:64px_64px]" />

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 shadow-lg mb-6">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Creator Success Stories
            </span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-6">
            Real creators,
            <span className="block mt-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              real results
            </span>
          </h2>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See how creators like you transformed their channels with AI-powered growth strategies.
          </p>
        </div>

        {/* Success Story Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {successStories.map((story, index) => (
            <div
              key={index}
              className="group relative"
            >
              {/* Card Glow */}
              <div className={`absolute -inset-0.5 bg-gradient-to-r ${story.gradient} rounded-3xl blur opacity-0 group-hover:opacity-30 transition duration-500`} />

              {/* Card */}
              <div className={`relative h-full p-8 rounded-3xl bg-gradient-to-br ${story.bgGradient} border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl`}>
                {/* Avatar & Name */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-5xl">{story.avatar}</div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{story.name}</h3>
                    <p className="text-sm text-gray-600">{story.role}</p>
                    <p className="text-xs text-gray-500">@{story.channel}</p>
                  </div>
                </div>

                {/* Quote */}
                <div className="relative mb-6">
                  <Quote className={`w-8 h-8 absolute -top-2 -left-2 opacity-20 bg-gradient-to-r ${story.gradient} bg-clip-text text-transparent`} />
                  <p className="text-gray-700 leading-relaxed pl-6 italic">
                    "{story.quote}"
                  </p>
                </div>

                {/* Stats */}
                <div className="space-y-3 border-t border-gray-200 pt-6">
                  {story.stats.map((stat, statIndex) => (
                    <div key={statIndex} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{stat.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-gray-900">{stat.value}</span>
                        <Badge className={`bg-gradient-to-r ${story.gradient} text-white border-0 text-xs`}>
                          {stat.change}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Growth Badge */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-center gap-2">
                    <TrendingUp className={`w-5 h-5 bg-gradient-to-r ${story.gradient} bg-clip-text text-transparent`} />
                    <span className={`text-2xl font-black bg-gradient-to-r ${story.gradient} bg-clip-text text-transparent`}>
                      {story.growth}
                    </span>
                    <span className="text-sm text-gray-600">Total Growth</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-6 text-lg">
            Join 10,000+ creators who are already crushing it with AI
          </p>
          <Button
            size="lg"
            className="px-10 py-6 text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-2xl"
          >
            Start Your Success Story
            <ArrowRight className="ml-3 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  )
}
