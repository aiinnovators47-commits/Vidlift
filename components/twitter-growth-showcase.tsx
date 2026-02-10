"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageCircle, Repeat2, TrendingUp, Clock, Zap, Target, Users, Bot } from "lucide-react"

const examplePosts = [
  {
    content:
      "🚀 Just launched our new AI-powered feature! The future of content creation is here. What do you think about AI in social media? #AI #Innovation #TechTrends",
    time: "2 hours ago",
    likes: 245,
    retweets: 67,
    comments: 34,
    engagement: "8.2%",
    type: "Product Launch",
  },
  {
    content:
      "Monday motivation: Every expert was once a beginner. Keep pushing forward! 💪 What's one skill you're working on this week? #MondayMotivation #Growth",
    time: "1 day ago",
    likes: 189,
    retweets: 43,
    comments: 28,
    engagement: "6.8%",
    type: "Motivational",
  },
  {
    content:
      "5 proven strategies to boost your Twitter engagement:\n\n1️⃣ Post consistently\n2️⃣ Use relevant hashtags\n3️⃣ Engage with your audience\n4️⃣ Share valuable content\n5️⃣ Time your posts right\n\nWhich one works best for you? 🤔",
    time: "2 days ago",
    likes: 312,
    retweets: 89,
    comments: 45,
    engagement: "9.1%",
    type: "Educational",
  },
]

const reasons = [
  {
    icon: Clock,
    title: "Save 10+ Hours Weekly",
    description: "Automate content creation and scheduling",
    color: "text-blue-500",
  },
  {
    icon: TrendingUp,
    title: "3x Faster Growth",
    description: "AI-optimized posting times and content",
    color: "text-green-500",
  },
  {
    icon: Target,
    title: "Higher Engagement",
    description: "AI analyzes what your audience loves",
    color: "text-purple-500",
  },
  {
    icon: Users,
    title: "Build Real Connections",
    description: "Focus on relationships while AI handles posting",
    color: "text-orange-500",
  },
]

export function TwitterGrowthShowcase() {
  const [autopilotEnabled, setAutopilotEnabled] = useState(false)

  const toggleAutopilot = () => {
    setAutopilotEnabled(!autopilotEnabled)
  }

  return (
    <section className="py-20 sm:py-32 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent sm:text-4xl text-balance">
            See What Our Users Post & Why They Love It
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            Real posts from real users, powered by AI automation
          </p>
        </div>

        {/* Autopilot Toggle */}
        <div className="flex justify-center mb-12">
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 p-6">
            <div className="flex items-center justify-center space-x-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Autopilot Mode</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {autopilotEnabled ? "AI is managing your content" : "Manual posting mode"}
                </p>
              </div>

              <div className="relative">
                <button
                  onClick={toggleAutopilot}
                  className={`relative inline-flex h-16 w-28 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    autopilotEnabled ? "bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-12 w-12 transform rounded-full bg-white shadow-lg transition-all duration-300 flex items-center justify-center ${
                      autopilotEnabled ? "translate-x-14" : "translate-x-2"
                    }`}
                  >
                    {autopilotEnabled ? (
                      <Zap className="h-6 w-6 text-blue-500" />
                    ) : (
                      <Bot className="h-6 w-6 text-gray-400" />
                    )}
                  </span>
                </button>
              </div>

              <div className="text-center">
                <Badge
                  variant={autopilotEnabled ? "default" : "secondary"}
                  className={`${autopilotEnabled ? "bg-gradient-to-r from-blue-500 to-purple-500" : ""}`}
                >
                  {autopilotEnabled ? "ON" : "OFF"}
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  {autopilotEnabled ? "Posts automatically" : "Manual control"}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Example Posts */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-center mb-8">Example Posts Created by AI</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {examplePosts.map((post, index) => (
              <Card
                key={index}
                className="bg-white/80 backdrop-blur-sm shadow-xl border-0 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {post.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{post.time}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-relaxed">{post.content}</p>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span className="flex items-center">
                        <Heart className="h-3 w-3 mr-1" />
                        {post.likes}
                      </span>
                      <span className="flex items-center">
                        <Repeat2 className="h-3 w-3 mr-1" />
                        {post.retweets}
                      </span>
                      <span className="flex items-center">
                        <MessageCircle className="h-3 w-3 mr-1" />
                        {post.comments}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {post.engagement} engagement
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Why Users Love It */}
        <div>
          <h3 className="text-2xl font-bold text-center mb-8">Why 10,000+ Users Choose Our Tool</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {reasons.map((reason, index) => {
              const Icon = reason.icon
              return (
                <Card
                  key={index}
                  className="bg-white/80 backdrop-blur-sm shadow-xl border-0 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 text-center"
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-center mb-3">
                      <div className="p-3 rounded-full bg-gradient-to-r from-blue-100 to-purple-100">
                        <Icon className={`h-6 w-6 ${reason.color}`} />
                      </div>
                    </div>
                    <CardTitle className="text-lg">{reason.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{reason.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            <Zap className="h-5 w-5 mr-2" />
            Enable Autopilot Now
          </Button>
        </div>
      </div>
    </section>
  )
}
