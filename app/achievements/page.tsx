"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AchievementDisplay } from '@/components/achievement-display'
import { Trophy, Star, Zap, Flame, Crown, Medal, Target, Calendar, ArrowLeft } from 'lucide-react'
import SharedSidebar from '@/components/shared-sidebar'

export default function AchievementsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'all' | 'recent'>('all')

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading achievements...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    router.push('/auth/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="flex">
        <SharedSidebar />
        
        <main className="flex-1 p-4 sm:p-6 md:p-8 pb-20 md:pb-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.back()}
                className="text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                  <Trophy className="w-8 h-8 text-amber-500" />
                  Achievement Center
                </h1>
                <p className="text-slate-400 mt-1">Celebrate your milestones and track your progress</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <Button
                variant={activeTab === 'all' ? 'default' : 'outline'}
                onClick={() => setActiveTab('all')}
                className={activeTab === 'all' ? 'bg-amber-600 hover:bg-amber-700' : 'text-slate-300 border-slate-700'}
              >
                <Trophy className="w-4 h-4 mr-2" />
                All Achievements
              </Button>
              <Button
                variant={activeTab === 'recent' ? 'default' : 'outline'}
                onClick={() => setActiveTab('recent')}
                className={activeTab === 'recent' ? 'bg-amber-600 hover:bg-amber-700' : 'text-slate-300 border-slate-700'}
              >
                <Star className="w-4 h-4 mr-2" />
                Recent Unlocks
              </Button>
            </div>

            {/* Achievement Display */}
            <div className="mb-8">
              <AchievementDisplay 
                compact={false} 
                challengeId={activeTab === 'recent' ? 'recent' : undefined}
              />
            </div>

            {/* Achievement Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card className="bg-slate-800/50 border-slate-700 hover:border-amber-500/50 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-400">
                    <Flame className="w-5 h-5" />
                    Streak Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      Weekly Warrior (7-day streak)
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      Fortnight Fighter (14-day streak)
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      Monthly Master (30-day streak)
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 hover:border-amber-500/50 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-400">
                    <Target className="w-5 h-5" />
                    Milestone Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      First Steps (1st upload)
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                      Deca-Poster (10 uploads)
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      Quarter Century (25 uploads)
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 hover:border-amber-500/50 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-400">
                    <Zap className="w-5 h-5" />
                    Special Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Perfect Week (7 days, 0 misses)
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      Early Bird (5 early uploads)
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      Challenge Master (100% completion)
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Tips Section */}
            <Card className="bg-slate-800/30 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-200 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400" />
                  How to Earn More Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-slate-300">📈 Consistency is Key</h4>
                    <ul className="text-sm text-slate-400 space-y-1">
                      <li>• Maintain regular upload schedules</li>
                      <li>• Build and maintain streaks</li>
                      <li>• Aim for perfect weeks</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-slate-300">🎯 Quality Over Quantity</h4>
                    <ul className="text-sm text-slate-400 space-y-1">
                      <li>• Upload before deadlines for bonus points</li>
                      <li>• Complete challenges with 100% success</li>
                      <li>• Participate in special challenges</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}