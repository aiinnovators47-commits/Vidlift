"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Calendar as CalendarIcon, Target, Clock, Video, Zap, Flame, Dumbbell, Zap as Lightning, BarChart3, Calendar as CalendarCheck, Trophy, Settings2 } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { CHALLENGE_TEMPLATES, ChallengeConfig } from '@/types/challenge'

interface ChallengeCreatorProps {
  onCreateChallenge: (config: ChallengeConfig) => void
  onCancel: () => void
  isLoading?: boolean
}

export default function ChallengeCreator({ onCreateChallenge, onCancel, isLoading }: ChallengeCreatorProps) {
  const [step, setStep] = useState<'type' | 'config' | 'details'>('type')
  const [selectedType, setSelectedType] = useState<keyof typeof CHALLENGE_TEMPLATES | 'custom' | null>(null)
  const [config, setConfig] = useState<Partial<ChallengeConfig>>({
    emailNotifications: true,
    leaderboardVisible: true,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  })
  const [startDate, setStartDate] = useState<Date | undefined>(new Date())
  const [startTime, setStartTime] = useState<string>(() => {
    const d = new Date()
    return d.toTimeString().slice(0,5) // HH:MM
  })
  const [calendarOpen, setCalendarOpen] = useState(false)

  // Keep time input in sync when date changes
  useEffect(() => {
    if (startDate) setStartTime(startDate.toTimeString().slice(0,5))
  }, [startDate])

  const handleTypeSelect = (type: keyof typeof CHALLENGE_TEMPLATES | 'custom') => {
    setSelectedType(type)
    if (type !== 'custom') {
      const template = CHALLENGE_TEMPLATES[type]
      setConfig(prev => ({
        ...prev,
        challengeType: type,
        durationDays: template.durationDays,
        uploadFrequencyDays: template.uploadFrequencyDays,
        videosPerUpload: template.videosPerUpload,
        title: template.title,
        description: template.description
      }))
    }
    setStep('config')
  }

  const handleConfigNext = () => {
    if (!config.title || !startDate) {
      return
    }
    setStep('details')
  }

  const handleCreate = () => {
    if (!config.title || !startDate || !config.challengeType) return

    const finalConfig: ChallengeConfig = {
      challengeType: config.challengeType || 'custom',
      title: config.title,
      description: config.description,
      startDate: startDate.toISOString(),
      durationDays: config.durationDays || 30,
      uploadFrequencyDays: config.uploadFrequencyDays || 1,
      videosPerUpload: config.videosPerUpload || 1,
      videoType: config.videoType || 'long',
      categoryNiche: config.categoryNiche,
      timezone: config.timezone || 'UTC',
      emailNotifications: config.emailNotifications ?? true,
      leaderboardVisible: config.leaderboardVisible ?? true
    }

    onCreateChallenge(finalConfig)
  }

  const challengeTypes = [
    { key: 'daily_30' as const, icon: Flame, title: '30-Day Daily', subtitle: 'Upload every day for 30 days', difficulty: 'Hard' },
    { key: 'daily_60' as const, icon: Dumbbell, title: '60-Day Daily', subtitle: 'Upload every day for 2 months', difficulty: 'Expert' },
    { key: 'every_2_days_30' as const, icon: Zap, title: 'Every 2 Days', subtitle: '30 days, upload every other day', difficulty: 'Medium' },
    { key: 'every_3_days_45' as const, icon: Target, title: 'Every 3 Days', subtitle: '45 days, quality over quantity', difficulty: 'Easy' },
    { key: 'weekly_4' as const, icon: CalendarCheck, title: 'Weekly Challenge', subtitle: '4 weeks, once per week', difficulty: 'Beginner' },
    { key: 'weekly_12' as const, icon: Trophy, title: '12-Week Marathon', subtitle: 'Weekly uploads for 3 months', difficulty: 'Medium' },
    { key: 'custom' as const, icon: Settings2, title: 'Custom Challenge', subtitle: 'Create your own schedule', difficulty: 'Custom' }
  ]

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800'
      case 'Easy': return 'bg-blue-100 text-blue-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Hard': return 'bg-orange-100 text-orange-800'
      case 'Expert': return 'bg-red-100 text-red-800'
      default: return 'bg-purple-100 text-purple-800'
    }
  }

  if (step === 'type') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Choose Your Challenge</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">Select a challenge type that matches your goals and commitment level</p>
        </div>

        {/* Challenge Type Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {challengeTypes.map((type) => {
            const IconComponent = type.icon
            return (
            <Card 
              key={type.key}
              className="cursor-pointer hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 shadow-sm hover:border-blue-400 dark:hover:border-blue-500 h-full"
              onClick={() => handleTypeSelect(type.key)}
            >
              <CardContent className="p-5">
                {/* Icon */}
                <div className="mb-4">
                  <IconComponent className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>

                {/* Title and Badge */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{type.title}</h3>
                  <Badge className={cn("text-xs font-semibold flex-shrink-0", getDifficultyColor(type.difficulty))}>
                    {type.difficulty}
                  </Badge>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{type.subtitle}</p>

                {/* Stats */}
                {type.key !== 'custom' && (
                  <div className="flex flex-col gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <Video className="w-3 h-3 text-gray-500" />
                      <span><span className="font-semibold text-gray-900 dark:text-white">{CHALLENGE_TEMPLATES[type.key].targetVideos}</span> videos</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span><span className="font-semibold text-gray-900 dark:text-white">{CHALLENGE_TEMPLATES[type.key].durationDays}</span> days</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            )
          })}
        </div>
      </div>
    )
  }

  if (step === 'config') {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-0 space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-2">Configure Your Challenge</h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Customize your challenge settings and preferences</p>
        </div>

        {/* Configuration Card */}
        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* Challenge Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-base font-semibold text-gray-900 dark:text-white">Challenge Title <span className="text-red-500">*</span></Label>
              <Input
                id="title"
                placeholder="e.g., Daily Upload Marathon"
                value={config.title || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
                className="border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md shadow-sm focus:ring-2 focus:ring-blue-200"
              />
            </div>

            {/* Challenge Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-base font-semibold text-gray-900 dark:text-white">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe your challenge goals and what you want to achieve..."
                value={config.description || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                className="border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white resize-none rounded-md shadow-sm focus:ring-2 focus:ring-blue-200"
                rows={4}
              />
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label className="text-base font-semibold text-gray-900 dark:text-white cursor-pointer" onClick={() => setCalendarOpen(true)}>Start Date <span className="text-red-500">*</span></Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md shadow-sm px-4 py-2",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "EEEE, MMMM d, yyyy") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => { 
                      // Preserve time when user picks a date
                      if (!date) return
                      const d = new Date(date)
                      const [h, m] = startTime.split(':').map(Number)
                      if (!Number.isNaN(h) && !Number.isNaN(m)) d.setHours(h, m, 0, 0)
                      setStartDate(d)
                      setCalendarOpen(false)
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Start Time */}
            <div className="space-y-2">
              <Label className="text-base font-semibold text-gray-900 dark:text-white">Start Time</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => {
                  const val = e.target.value
                  setStartTime(val)

                  // Apply time to startDate or create a new date with this time
                  if (startDate) {
                    const nd = new Date(startDate)
                    const [h, m] = val.split(':').map(Number)
                    if (!Number.isNaN(h) && !Number.isNaN(m)) {
                      nd.setHours(h, m, 0, 0)
                      setStartDate(nd)
                    }
                  } else {
                    const nd = new Date()
                    const [h, m] = val.split(':').map(Number)
                    if (!Number.isNaN(h) && !Number.isNaN(m)) {
                      nd.setHours(h, m, 0, 0)
                      setStartDate(nd)
                    }
                  }
                }}
                className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md shadow-sm p-2"
              />
            </div>

          {/* Custom Configuration */}
          {selectedType === 'custom' && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold">Custom Settings</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (Days)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    max="365"
                    value={config.durationDays || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, durationDays: parseInt(e.target.value) }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="frequency">Upload Every (Days)</Label>
                  <Input
                    id="frequency"
                    type="number"
                    min="1"
                    max="30"
                    value={config.uploadFrequencyDays || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, uploadFrequencyDays: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 mt-8">
            <Button variant="outline" onClick={() => setStep('type')} className="w-full sm:w-auto px-6 py-2 rounded-md">
              Back
            </Button>
            <Button onClick={handleConfigNext} disabled={!config.title || !startDate} className="w-full sm:w-auto px-6 py-2 rounded-md bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-md">
              Next
            </Button>
          </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'details') {
    return (
      <Card className="max-w-2xl mx-auto rounded-2xl shadow-lg overflow-hidden">
        <CardHeader>
          <CardTitle>Final Details</CardTitle>
          <CardDescription>
            Set your video preferences and notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {/* Video Type */}
          <div className="space-y-2">
            <Label>Video Type</Label>
            <Select value={config.videoType} onValueChange={(value: 'long' | 'shorts' | 'mixed') => 
              setConfig(prev => ({ ...prev, videoType: value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Select video type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="long">Long-form Videos</SelectItem>
                <SelectItem value="shorts">YouTube Shorts</SelectItem>
                <SelectItem value="mixed">Mixed Content</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category/Niche */}
          <div className="space-y-2">
            <Label htmlFor="category">Category/Niche (Optional)</Label>
            <Input
              id="category"
              placeholder="e.g., Gaming, Education, Lifestyle"
              value={config.categoryNiche || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, categoryNiche: e.target.value }))}
            />
          </div>

          {/* Preferences */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Preferences</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-gray-500">
                  Receive reminder emails for upcoming deadlines
                </p>
              </div>
              <Switch
                checked={config.emailNotifications}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, emailNotifications: checked }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Leaderboard Visibility</Label>
                <p className="text-sm text-gray-500">
                  Show your progress on the community leaderboard
                </p>
              </div>
              <Switch
                checked={config.leaderboardVisible}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, leaderboardVisible: checked }))}
              />
            </div>
          </div>

          {/* Challenge Summary */}
          <div className="bg-blue-50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-blue-900">Challenge Summary</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>Duration:</strong> {config.durationDays} days</p>
              <p><strong>Frequency:</strong> Every {config.uploadFrequencyDays} day(s)</p>
              <p><strong>Total Videos:</strong> ~{Math.ceil((config.durationDays || 30) / (config.uploadFrequencyDays || 1))}</p>
              <p><strong>Start Date:</strong> {startDate ? format(startDate, "PPP p") : 'Not set'}</p>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('config')}>
              Back
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Challenge'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}