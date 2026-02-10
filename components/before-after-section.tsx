"use client"

import { Sparkles, TrendingUp, Users, Video, CheckCircle2, ArrowRight, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"

const transformations = [
  {
    period: "Before Creere Snap",
    stats: [
      { icon: Users, label: "Subscribers", value: "12.5K", color: "text-gray-400" },
      { icon: Video, label: "Monthly Views", value: "85K", color: "text-gray-400" },
      { icon: BarChart3, label: "Engagement", value: "1.2%", color: "text-gray-400" },
      { icon: TrendingUp, label: "Revenue", value: "$340/mo", color: "text-gray-400" }
    ],
    gradient: "from-gray-100 to-gray-200",
    borderColor: "border-gray-300"
  },
  {
    period: "After 6 Months",
    stats: [
      { icon: Users, label: "Subscribers", value: "247K", color: "text-blue-600", badge: "+1,876%" },
      { icon: Video, label: "Monthly Views", value: "3.2M", color: "text-purple-600", badge: "+3,665%" },
      { icon: BarChart3, label: "Engagement", value: "8.7%", color: "text-green-600", badge: "+625%" },
      { icon: TrendingUp, label: "Revenue", value: "$18.5K/mo", color: "text-orange-600", badge: "+5,341%" }
    ],
    gradient: "from-blue-50 via-purple-50 to-pink-50",
    borderColor: "border-purple-300"
  }
]

const keyImprovements = [
  {
    title: "AI-Optimized Content",
    description: "Machine learning analyzed 10,000+ viral videos to create your perfect content strategy",
    icon: "🤖",
    metric: "10x faster growth"
  },
  {
    title: "Smart Scheduling",
    description: "Posted at optimal times when your audience is most active and engaged",
    icon: "⏰",
    metric: "47% more reach"
  },
  {
    title: "SEO Domination",
    description: "AI-generated titles, tags, and descriptions that rank #1 in search results",
    icon: "🎯",
    metric: "523% more views"
  },
  {
    title: "Audience Insights",
    description: "Deep analytics revealed exactly what your viewers want to see next",
    icon: "📊",
    metric: "85% retention"
  }
]

export function BeforeAfterSection() {
  return (
    <section className="relative py-24 overflow-hidden bg-linear-to-b from-white via-gray-50 to-white">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-linear-to-r from-purple-50 to-pink-50 border border-purple-200 shadow-lg mb-6">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Transformation Results
            </span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-6">
            The numbers
            <span className="block mt-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              don't lie
            </span>
          </h2>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See the dramatic transformation that happens when you combine AI intelligence with your creative vision.
          </p>
        </div>

        {/* Before/After Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-16">
          {transformations.map((transformation, index) => (
            <div
              key={index}
              className="relative group"
            >
              {/* Card */}
              <div className={`relative p-8 rounded-3xl bg-gradient-to-br ${transformation.gradient} border-2 ${transformation.borderColor} transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl`}>
                {/* Period Label */}
                <div className="text-center mb-8">
                  <h3 className={`text-2xl font-black ${index === 0 ? 'text-gray-700' : 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'}`}>
                    {transformation.period}
                  </h3>
                </div>

                {/* Stats Grid */}
                <div className="space-y-6">
                  {transformation.stats.map((stat, statIndex) => (
                    <div key={statIndex} className={`flex items-center justify-between p-4 rounded-2xl ${index === 0 ? 'bg-white/50' : 'bg-white'} border ${index === 0 ? 'border-gray-200' : 'border-purple-200'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl ${index === 0 ? 'bg-gray-200' : 'bg-linear-to-br from-purple-100 to-pink-100'} flex items-center justify-center`}>
                          <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-1">{stat.label}</div>
                          <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                        </div>
                      </div>
                      {stat.badge && (
                        <div className="px-3 py-1.5 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border border-green-300">
                          <span className="text-sm font-black text-green-700">{stat.badge}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Arrow (only between cards on desktop) */}
              {index === 0 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
                    <ArrowRight className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Key Improvements */}
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-black text-center text-gray-900 mb-12">
            What Made the Difference?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {keyImprovements.map((improvement, index) => (
              <div
                key={index}
                className="group relative p-6 rounded-2xl bg-white border border-gray-200 hover:border-purple-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="text-center">
                  <div className="text-4xl mb-4">{improvement.icon}</div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">{improvement.title}</h4>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">{improvement.description}</p>
                  <div className="inline-block px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full">
                    <span className="text-sm font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {improvement.metric}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <div className="inline-block p-1 rounded-3xl bg-gradient-to-r from-purple-600 to-pink-600">
            <div className="px-12 py-8 rounded-3xl bg-white">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Ready to transform your channel?
              </h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Join thousands of creators who've already achieved explosive growth with AI.
              </p>
              <Button
                size="lg"
                className="px-10 py-6 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-2xl"
              >
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
