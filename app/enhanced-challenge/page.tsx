"use client"

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trophy, Target, BarChart3, Users } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import SharedSidebar from '@/components/shared-sidebar'
import EnhancedChallengeCard from '@/components/enhanced-challenge-card'
import ChallengeCreator from '@/components/challenge-creator'
import ChallengeDetailsModal from '@/components/challenge-details-modal'
import ChallengeStats from '@/components/challenge-stats'
import LeaderboardModal from '@/components/leaderboard-modal'
import { Challenge, ChallengeConfig, UserChallengeStats } from '@/types/challenge'
import { Skeleton } from '@/components/ui/skeleton'

export default function EnhancedChallengePage() {
  const { toast } = useToast()
  
  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [activeTab, setActiveTab] = useState<'challenges' | 'create' | 'stats'>('challenges')
  
  // Data State
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [stats, setStats] = useState<UserChallengeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  
  // Modal State
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null)
  const [showChallengeDetails, setShowChallengeDetails] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  useEffect(() => {
    loadChallenges()
    loadStats()
  }, [])

  const loadChallenges = async () => {
    try {
      const response = await fetch('/api/challenges?includeUploads=true')
      const data = await response.json()
      
      if (response.ok) {
        setChallenges(data.challenges || [])
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to load challenges",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load challenges",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/challenges/stats')
      const data = await response.json()
      
      if (response.ok) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const handleCreateChallenge = async (config: ChallengeConfig) => {
    setCreating(true)
    try {
      const response = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: "Success! 🎉",
          description: "Your challenge has been created and started!",
        })
        
        setActiveTab('challenges')
        loadChallenges()
        loadStats()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create challenge",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create challenge",
        variant: "destructive"
      })
    } finally {
      setCreating(false)
    }
  }

  const handleViewDetails = (challenge: Challenge) => {
    setSelectedChallenge(challenge)
    setShowChallengeDetails(true)
  }

  const handleTrackUpload = async (challengeId: string, videoData?: any) => {
    try {
      const response = await fetch('/api/challenges/track-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId,
          ...videoData
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: "Upload Tracked! 🎬",
          description: data.message || "Your upload has been tracked successfully!",
        })
        
        loadChallenges()
        loadStats()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to track upload",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to track upload",
        variant: "destructive"
      })
    }
  }

  const activeChallenges = challenges.filter(c => c.status === 'active')
  const completedChallenges = challenges.filter(c => c.status === 'completed')

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SharedSidebar 
          isOpen={sidebarOpen} 
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
        <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
          <div className="p-8">
            <div className="space-y-6">
              <Skeleton className="h-8 w-64" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-64" />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <SharedSidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />
      
      <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                YouTube Challenge Hub
              </h1>
              <p className="text-gray-600">
                Build consistency, grow your channel, and achieve your YouTube goals
              </p>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
              <div className="flex items-center justify-between mb-6">
                <TabsList>
                  <TabsTrigger value="challenges" className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    My Challenges
                  </TabsTrigger>
                  <TabsTrigger value="create" className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Create Challenge
                  </TabsTrigger>
                  <TabsTrigger value="stats" className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Statistics
                  </TabsTrigger>
                </TabsList>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLeaderboard(true)}
                    className="flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    Leaderboard
                  </Button>
                  {activeTab === 'challenges' && (
                    <Button
                      size="sm"
                      onClick={() => setActiveTab('create')}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      New Challenge
                    </Button>
                  )}
                </div>
              </div>

              {/* My Challenges Tab */}
              <TabsContent value="challenges" className="space-y-6">
                {activeChallenges.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-blue-500" />
                      Active Challenges ({activeChallenges.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {activeChallenges.map(challenge => (
                        <EnhancedChallengeCard
                          key={challenge.id}
                          challenge={challenge}
                          onViewDetails={handleViewDetails}
                          onTrackUpload={(id) => handleTrackUpload(id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {completedChallenges.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-green-500" />
                      Completed Challenges ({completedChallenges.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {completedChallenges.map(challenge => (
                        <EnhancedChallengeCard
                          key={challenge.id}
                          challenge={challenge}
                          onViewDetails={handleViewDetails}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {challenges.length === 0 && (
                  <Card className="text-center py-12">
                    <CardContent>
                      <Target className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <CardTitle className="mb-2">No Challenges Yet</CardTitle>
                      <CardDescription className="mb-4">
                        Start your first YouTube consistency challenge to build momentum and grow your channel
                      </CardDescription>
                      <Button onClick={() => setActiveTab('create')}>
                        Create Your First Challenge
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Create Challenge Tab */}
              <TabsContent value="create">
                <ChallengeCreator
                  onCreateChallenge={handleCreateChallenge}
                  onCancel={() => setActiveTab('challenges')}
                  isLoading={creating}
                />
              </TabsContent>

              {/* Statistics Tab */}
              <TabsContent value="stats">
                {stats ? (
                  <ChallengeStats
                    stats={stats}
                    onViewLeaderboard={() => setShowLeaderboard(true)}
                  />
                ) : (
                  <Card className="text-center py-12">
                    <CardContent>
                      <BarChart3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <CardTitle className="mb-2">No Statistics Yet</CardTitle>
                      <CardDescription>
                        Complete some challenges to see your progress statistics
                      </CardDescription>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* Modals */}
      <ChallengeDetailsModal
        challenge={selectedChallenge}
        isOpen={showChallengeDetails}
        onClose={() => {
          setShowChallengeDetails(false)
          setSelectedChallenge(null)
        }}
        onTrackUpload={handleTrackUpload}
      />

      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />
    </div>
  )
}