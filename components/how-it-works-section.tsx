"use client"

import { ArrowRight, CheckCircle2, Play, Sparkles, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const steps = [
  {
    number: "01",
    title: "Connect Your Channel",
    description: "Sign in with Google and connect your YouTube channel in seconds. No technical setup required.",
    icon: "🔗",
    color: "from-blue-500 to-cyan-500",
    bgColor: "from-blue-50 to-cyan-50"
  },
  {
    number: "02",
    title: "Let AI Analyze",
    description: "Our AI studies your niche, competitors, and audience to create a personalized growth strategy.",
    icon: "🤖",
    color: "from-purple-500 to-pink-500",
    bgColor: "from-purple-50 to-pink-50"
  },
  {
    number: "03",
    title: "Create & Schedule",
    description: "Generate viral content ideas, optimize titles and descriptions, then schedule for maximum impact.",
    icon: "📅",
    color: "from-green-500 to-emerald-500",
    bgColor: "from-green-50 to-emerald-50"
  },
  {
    number: "04",
    title: "Watch Growth Explode",
    description: "Sit back as your channel grows on autopilot. Track analytics and optimize with AI insights.",
    icon: "🚀",
    color: "from-orange-500 to-red-500",
    bgColor: "from-orange-50 to-red-50"
  }
]

export function HowItWorksSection() {
  return (
    <section className="relative py-24 overflow-hidden bg-white">
      {/* Background Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-pink-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 shadow-lg mb-6">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              How It Works
            </span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-6">
            Start growing in
            <span className="block mt-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              4 simple steps
            </span>
          </h2>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From zero to viral in minutes. Our AI handles the complexity while you focus on creating amazing content.
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {steps.map((step, index) => (
              <div
                key={index}
                className="group relative"
              >
                {/* Connection Line (desktop only) */}
                {index < steps.length - 1 && index % 2 === 0 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-gray-300 to-transparent" />
                )}

                {/* Card Glow */}
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${step.color} rounded-3xl blur opacity-0 group-hover:opacity-30 transition duration-500`} />

                {/* Card */}
                <div className={`relative h-full p-8 rounded-3xl bg-gradient-to-br ${step.bgColor} border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl`}>
                  {/* Step Number */}
                  <div className="flex items-start justify-between mb-6">
                    <div className={`text-6xl font-black bg-gradient-to-r ${step.color} bg-clip-text text-transparent opacity-20`}>
                      {step.number}
                    </div>
                    <div className="text-5xl group-hover:scale-110 transition-transform duration-300">
                      {step.icon}
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    {step.description}
                  </p>

                  {/* Check Icon */}
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <CheckCircle2 className={`w-5 h-5 bg-gradient-to-r ${step.color} bg-clip-text text-transparent`} />
                    <span>Quick & Easy</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="inline-block p-1 rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
            <div className="px-12 py-8 rounded-3xl bg-white">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Ready to transform your channel?
              </h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Join 10,000+ creators who are already growing faster with AI-powered automation.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  asChild
                  className="px-8 py-6 text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-2xl"
                >
                  <Link href="/signup">
                    <Zap className="mr-2 h-5 w-5" />
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="px-8 py-6 text-lg font-semibold border-2 border-gray-300 hover:border-blue-600 hover:bg-blue-50 transition-all duration-300 rounded-2xl"
                >
                  <Link href="#demo">
                    <Play className="mr-2 h-5 w-5" />
                    Watch Demo
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
      `}</style>
    </section>
  )
}
