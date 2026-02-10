"use client"

import { useState } from "react"
import { Sparkles, Play, Pause, RotateCcw, CheckCircle2, Zap, TrendingUp, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const demoSteps = [
  {
    id: 1,
    title: "Upload Your Video",
    description: "Simply drag and drop your video or paste a YouTube link",
    icon: Video,
    color: "from-blue-500 to-cyan-500",
    bgColor: "from-blue-50 to-cyan-50",
    features: ["Bulk upload", "Auto-thumbnails", "Format detection"]
  },
  {
    id: 2,
    title: "AI Analyzes Content",
    description: "Our AI scans your video and generates optimal metadata",
    icon: Sparkles,
    color: "from-purple-500 to-pink-500",
    bgColor: "from-purple-50 to-pink-50",
    features: ["Viral title suggestions", "SEO tags", "Best practices"]
  },
  {
    id: 3,
    title: "Optimize & Schedule",
    description: "Review AI suggestions and schedule for peak engagement times",
    icon: Zap,
    color: "from-orange-500 to-red-500",
    bgColor: "from-orange-50 to-red-50",
    features: ["Smart scheduling", "Multiple channels", "Analytics preview"]
  },
  {
    id: 4,
    title: "Watch It Grow",
    description: "Track real-time analytics and let AI optimize your strategy",
    icon: TrendingUp,
    color: "from-green-500 to-emerald-500",
    bgColor: "from-green-50 to-emerald-50",
    features: ["Live dashboard", "Growth insights", "Auto-optimization"]
  }
]

export function VideoDemoSection() {
  const [activeStep, setActiveStep] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)

  const handlePlayDemo = () => {
    setIsPlaying(true)
    let currentStep = 1
    const interval = setInterval(() => {
      if (currentStep < 4) {
        currentStep++
        setActiveStep(currentStep)
      } else {
        setIsPlaying(false)
        clearInterval(interval)
      }
    }, 2500)
  }

  const handleReset = () => {
    setIsPlaying(false)
    setActiveStep(1)
  }

  return (
    <section id="demo" className="relative py-24 overflow-hidden bg-white">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-0 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/3 right-0 w-96 h-96 bg-gradient-to-r from-pink-400/10 to-orange-400/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_0.5px,transparent_0.5px),linear-gradient(to_bottom,#8882_0.5px,transparent_0.5px)] bg-[size:64px_64px]" />

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 shadow-lg mb-6">
            <Play className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Interactive Demo
            </span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-6">
            See it in
            <span className="block mt-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              action
            </span>
          </h2>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Watch how Creere Snap transforms your YouTube workflow in minutes, not hours.
          </p>

          {/* Demo Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={isPlaying ? () => setIsPlaying(false) : handlePlayDemo}
              className="px-8 py-6 text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-2xl"
            >
              {isPlaying ? (
                <>
                  <Pause className="mr-2 h-5 w-5" />
                  Pause Demo
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Play Interactive Demo
                </>
              )}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleReset}
              className="px-8 py-6 text-lg font-semibold border-2 border-gray-300 hover:border-blue-600 hover:bg-blue-50 transition-all duration-300 rounded-2xl"
            >
              <RotateCcw className="mr-2 h-5 w-5" />
              Reset
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="relative">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 transition-all duration-500 ease-out"
                style={{ width: `${(activeStep / 4) * 100}%` }}
              />
            </div>
            <div className="absolute -top-1 left-0 right-0 flex justify-between">
              {demoSteps.map((step) => (
                <div
                  key={step.id}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${activeStep >= step.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 border-white shadow-lg scale-125'
                      : 'bg-white border-gray-300'
                    }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Demo Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {demoSteps.map((step, index) => {
            const isActive = activeStep === step.id
            const isCompleted = activeStep > step.id

            return (
              <div
                key={step.id}
                onClick={() => !isPlaying && setActiveStep(step.id)}
                className={`group relative cursor-pointer transition-all duration-500 ${isActive ? 'scale-105' : ''
                  }`}
              >
                {/* Glow Effect */}
                {isActive && (
                  <div className={`absolute -inset-0.5 bg-gradient-to-r ${step.color} rounded-3xl blur opacity-50 animate-pulse`} />
                )}

                {/* Card */}
                <div className={`relative h-full p-6 rounded-3xl border-2 transition-all duration-300 ${isActive
                    ? `bg-gradient-to-br ${step.bgColor} border-gray-300 shadow-2xl`
                    : isCompleted
                      ? 'bg-white border-green-300 shadow-lg'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-xl'
                  }`}>
                  {/* Step Number */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-2xl ${isCompleted
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                        : isActive
                          ? `bg-gradient-to-r ${step.color}`
                          : 'bg-gray-100'
                      } transition-all duration-300`}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      ) : (
                        <step.icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                      )}
                    </div>
                    <Badge className={`${isActive
                        ? `bg-gradient-to-r ${step.color} text-white`
                        : 'bg-gray-100 text-gray-600'
                      }`}>
                      Step {step.id}
                    </Badge>
                  </div>

                  {/* Content */}
                  <h3 className={`text-xl font-bold mb-2 ${isActive ? 'text-gray-900' : 'text-gray-700'
                    }`}>
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    {step.description}
                  </p>

                  {/* Features */}
                  {isActive && (
                    <div className="space-y-2 mt-4 animate-fade-in">
                      {step.features.map((feature, fIndex) => (
                        <div key={fIndex} className="flex items-center gap-2">
                          <CheckCircle2 className={`w-4 h-4 bg-gradient-to-r ${step.color} bg-clip-text text-transparent`} />
                          <span className="text-xs text-gray-700 font-medium">{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-6 text-lg">
            Ready to experience the magic yourself?
          </p>
          <Button
            size="lg"
            className="px-10 py-6 text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-2xl"
          >
            <Zap className="mr-2 h-5 w-5" />
            Try It Free Now
          </Button>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.2; }
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </section>
  )
}
