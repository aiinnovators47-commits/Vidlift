"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Share2, TrendingUp, Target, Zap, CheckCircle, AlertCircle, BarChart3 } from "lucide-react"
import { CREDIT_COSTS } from "@/models/Credit"
import SharedSidebar from "@/components/shared-sidebar"
import UpgradeCard from "@/components/upgrade-card"

const NotificationBell = dynamic(() => import('@/components/notification-bell'), { ssr: false })
import dynamic from "next/dynamic"

interface ChannelScore {
  channelId: string
  channelTitle: string
  overallScore: number
  scores: {
    engagement: number
    growth: number
    consistency: number
    seo: number
    content: number
  }
  metrics: {
    avgViews: number
    engagementRate: number
    uploadFrequency: number
    subscriberGrowth: number
    viewsGrowth: number
  }
  recommendations: string[]
  strengths: string[]
  weaknesses: string[]
}

export default function ChannelScorePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [inputUrl, setInputUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ChannelScore | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showUpgradeCard, setShowUpgradeCard] = useState(false)
  
  // Check authentication
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signup")
    }
  }, [status, router])
  
  // Show loading while checking auth
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }
  
  // Redirect if not authenticated
  if (status === "unauthenticated") {
    return null // The effect handles the redirect
  }
  
  const extractChannelId = (url: string): string | null => {
    try {
      url = url.trim()
      // Channel ID format: UCxxxxxxxxxxxxxxxxxx (24 characters)
      let match = url.match(/youtube\.com\/channel\/([a-zA-Z0-9_-]{24})/)
      if (match) return match[1]
      // Custom URL format: @username or /c/username or /user/username
      match = url.match(/youtube\.com\/@([a-zA-Z0-9_.-]+)/)
      if (match) return `@${match[1]}`
      match = url.match(/youtube\.com\/c\/([a-zA-Z0-9_.-]+)/)
      if (match) return `c/${match[1]}`
      match = url.match(/youtube\.com\/user\/([a-zA-Z0-9_.-]+)/)
      if (match) return `user/${match[1]}`
      // Direct channel ID
      if (/^UC[a-zA-Z0-9_-]{22}$/.test(url)) return url
      // @username format
      if (/^@[a-zA-Z0-9_.-]+$/.test(url)) return url
      return null
    } catch (e) {
      return null
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    
    const channelId = extractChannelId(inputUrl)
    if (!channelId) {
      setError("Invalid YouTube channel URL or ID")
      return
    }
    
    setLoading(true)
    
    try {
      // Check user credits first
      const creditsRes = await fetch('/api/users/credits')
      if (creditsRes.ok) {
        const creditsData = await creditsRes.json();
        if (creditsData.credits < CREDIT_COSTS.CHANNEL_SCORE) {
          setShowUpgradeCard(true);
          return;
        }
      }
      
      // Deduct credits
      const deductRes = await fetch('/api/users/deduct-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: CREDIT_COSTS.CHANNEL_SCORE })
      });
      
      if (!deductRes.ok) {
        console.error('Credit deduction failed');
        // Continue anyway to avoid blocking the user
      }
      
      // Score the channel
      const response = await fetch(`/api/youtube/score-channel?channelId=${encodeURIComponent(channelId)}&accessToken=${localStorage.getItem('youtube_access_token') || ''}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to score channel')
      }
      
      const data = await response.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message || 'An error occurred while scoring the channel')
    } finally {
      setLoading(false)
    }
  }
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }
  
  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Average'
    return 'Poor'
  }
  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Notification bell */}
      <div className="fixed top-4 right-4 z-50">
        <NotificationBell />
      </div>
      
      <div className="flex flex-1">
        {/* Shared Sidebar */}
        <SharedSidebar sidebarOpen={false} setSidebarOpen={() => {}} activePage="ai-tools" isCollapsed={true} setIsCollapsed={() => {}} />
        
        {/* Main Content */}
        <main className="flex-1 pt-16 md:pt-18 px-3 sm:px-4 md:px-6 pb-24 md:pb-12 transition-all duration-300 md:ml-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8 mt-8 md:mt-10">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Channel Scoring Tool</h1>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Analyze your YouTube channel's performance with our comprehensive scoring system.
                Get insights on engagement, growth, consistency, SEO, and content quality.
              </p>
            </div>
            
            {/* Input Form */}
            <Card className="mb-8 border border-gray-200 rounded-2xl bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Enter Channel URL</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-grow">
                    <Input
                      type="text"
                      placeholder="Paste YouTube channel URL or ID (e.g., https://youtube.com/@channel or UC...)"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      className="h-12"
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="h-12">
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Analyzing...
                      </>
                    ) : (
                      'Score Channel'
                    )}
                  </Button>
                </form>
                
                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-red-700 text-sm">{error}</span>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Results */}
            {result && (
              <div className="space-y-6">
                {/* Overall Score */}
                <Card className="border border-gray-200 rounded-2xl bg-white shadow-sm">
                  <CardContent className="p-6">
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center gap-2 mb-3">
                        <div className={`text-5xl font-bold ${getScoreColor(result.overallScore)}`}>
                          {result.overallScore}
                        </div>
                        <span className="text-gray-500 text-lg">/100</span>
                      </div>
                      <p className="text-gray-600">Overall Channel Score - {getScoreLabel(result.overallScore)}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                        <div className={`text-xl font-bold ${getScoreColor(result.scores.engagement)}`}>
                          {result.scores.engagement}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Engagement</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <Target className="w-6 h-6 text-green-500 mx-auto mb-2" />
                        <div className={`text-xl font-bold ${getScoreColor(result.scores.growth)}`}>
                          {result.scores.growth}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Growth</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <Zap className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                        <div className={`text-xl font-bold ${getScoreColor(result.scores.consistency)}`}>
                          {result.scores.consistency}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Consistency</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <BarChart3 className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                        <div className={`text-xl font-bold ${getScoreColor(result.scores.seo)}`}>
                          {result.scores.seo}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">SEO</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <CheckCircle className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
                        <div className={`text-xl font-bold ${getScoreColor(result.scores.content)}`}>
                          {result.scores.content}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Content</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Metrics */}
                <Card className="border border-gray-200 rounded-2xl bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle>Key Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-gray-900">{result.metrics.avgViews.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">Avg. Views per Video</div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-gray-900">{result.metrics.engagementRate.toFixed(2)}%</div>
                        <div className="text-sm text-gray-600">Engagement Rate</div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-gray-900">{result.metrics.uploadFrequency}</div>
                        <div className="text-sm text-gray-600">Upload Frequency (per month)</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Strengths & Recommendations */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border border-gray-200 rounded-2xl bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        Strengths
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {result.strengths.map((strength, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-gray-700">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <Card className="border border-gray-200 rounded-2xl bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-500" />
                        Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {result.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-gray-700">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Weaknesses */}
                {result.weaknesses.length > 0 && (
                  <Card className="border border-gray-200 rounded-2xl bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        Areas for Improvement
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {result.weaknesses.map((weakness, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-gray-700">{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
                
                <div className="flex justify-center gap-4 pt-4">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Share2 className="w-4 h-4" />
                    Share Report
                  </Button>
                  <Link href="/ai-tools">
                    <Button variant="secondary">Back to Tools</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      
      {/* Upgrade Card Modal */}
      {showUpgradeCard && (
        <UpgradeCard 
          requiredCredits={CREDIT_COSTS.CHANNEL_SCORE}
          feature="Channel Scoring"
        />
      )}
    </div>
  )
}