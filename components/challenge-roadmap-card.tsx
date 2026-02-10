"use client"

import React, { useState, useEffect } from 'react'
import { Trophy, CheckCircle, Circle, Lock } from 'lucide-react'

interface ChallengeRoadmapCardProps {
  challengeTitle?: string
  videosUploaded?: number
  totalVideosNeeded?: number
  currentStreak?: number
  totalPoints?: number
  startDate?: string | Date
  durationDays?: number
  cadenceEveryDays?: number
  onMarkStepDone?: (step: number) => Promise<void> | void
}

export default function ChallengeRoadmapCard({
  challengeTitle = "YouTube Challenge",
  videosUploaded = 5,
  totalVideosNeeded = 30,
  currentStreak = 5,
  totalPoints = 450,
  startDate,
  durationDays,
  cadenceEveryDays = 1,
  onMarkStepDone
}: ChallengeRoadmapCardProps) {
  const [activeStep, setActiveStep] = useState<number | null>(null)

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (activeStep !== null && !target.closest('.step-container')) {
        setActiveStep(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [activeStep]);

  const start = startDate ? new Date(startDate) : new Date()
  const duration = durationDays || 30

  // 7 steps to become a successful creator
  const roadmapSteps = [
    { step: 1, title: "First Video", desc: "Upload your first video", videos: 1 },
    { step: 2, title: "Consistency", desc: "Upload 5 videos", videos: 5 },
    { step: 3, title: "Building Habits", desc: "Upload 10 videos", videos: 10 },
    { step: 4, title: "Finding Voice", desc: "Upload 15 videos", videos: 15 },
    { step: 5, title: "Growing Skills", desc: "Upload 20 videos", videos: 20 },
    { step: 6, title: "Expert Level", desc: "Upload 25 videos", videos: 25 },
    { step: 7, title: "Successful Creator", desc: "Complete challenge", videos: 30 }
  ]

  const getStepStatus = (stepVideos: number) => {
    if (videosUploaded >= stepVideos) return 'completed'
    if (videosUploaded >= stepVideos - 2) return 'current'
    return 'locked'
  }

  const progressPercentage = Math.round((videosUploaded / totalVideosNeeded) * 100)

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-700/50 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
          <h3 className="text-base sm:text-lg font-semibold text-white">{challengeTitle}</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] sm:text-xs text-slate-400">Progress</div>
            <div className="text-sm font-bold text-yellow-400">{progressPercentage}%</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] sm:text-xs text-slate-400">Streak</div>
            <div className="text-sm font-bold text-orange-400">{currentStreak}🔥</div>
          </div>
        </div>
      </div>

      {/* Roadmap Journey */}
      <div className="relative overflow-visible z-0">
        {/* Background curved path - Responsive */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }} viewBox="0 0 1000 100" preserveAspectRatio="none">
          <path
            d="M 60 40 Q 150 60, 240 40 T 420 60 Q 510 75, 600 60 T 780 75 Q 870 85, 960 80"
            stroke="rgba(100, 116, 139, 0.3)"
            strokeWidth="3"
            fill="none"
            strokeDasharray="8,8"
          />
          <path
            d="M 60 40 Q 150 60, 240 40 T 420 60 Q 510 75, 600 60 T 780 75 Q 870 85, 960 80"
            stroke="rgba(234, 179, 8, 0.5)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            style={{
              strokeDasharray: `${progressPercentage * 9} 1000`,
              transition: 'stroke-dasharray 1s ease'
            }}
          />
        </svg>

        {/* Steps */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 relative" style={{ zIndex: 1 }}>
          {roadmapSteps.map((item, index) => {
            const status = getStepStatus(item.videos)
            const positions = [
              'translate-y-0',
              'translate-y-2 sm:translate-y-4',
              'translate-y-0',
              'translate-y-3 sm:translate-y-6',
              'translate-y-1 sm:translate-y-2',
              'translate-y-4 sm:translate-y-8',
              'translate-y-2 sm:translate-y-4'
            ]
            
            return (
              <div
                key={item.step}
                role="button"
                tabIndex={0}
                className={`flex flex-col items-center transition-all duration-500 ${positions[index]} step-container`}
                onClick={(e) => { e.stopPropagation(); setActiveStep(activeStep === item.step ? null : item.step) }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setActiveStep(activeStep === item.step ? null : item.step) } }}
              >
                {/* Step Circle - Reduced size for mobile */}
                <div className="relative mb-1 sm:mb-2">
                  <div
                    className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                      status === 'completed'
                        ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 border-yellow-400 shadow-lg shadow-yellow-500/30'
                        : status === 'current'
                        ? 'bg-gradient-to-br from-blue-500 to-blue-700 border-blue-400 shadow-lg shadow-blue-500/30 animate-pulse'
                        : 'bg-slate-800 border-slate-600'
                    }`}
                  >
                    {status === 'completed' ? (
                      <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                    ) : status === 'current' ? (
                      <Circle className="w-4 h-4 sm:w-6 sm:h-6 text-white fill-white" />
                    ) : (
                      <Lock className="w-3 h-3 sm:w-5 sm:h-5 text-slate-500" />
                    )}
                  </div>
                  {/* Step Number Badge - Reduced size */}
                  <div
                    className={`absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[8px] sm:text-xs font-bold ${
                      status === 'completed' || status === 'current'
                        ? 'bg-white text-slate-900'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {item.step}
                  </div>
                </div>

                {/* Step Info - More compact for mobile */}
                <div className="text-center">
                  <div
                    className={`text-[10px] sm:text-xs font-semibold mb-0.5 transition-colors ${
                      status === 'completed'
                        ? 'text-yellow-400'
                        : status === 'current'
                        ? 'text-blue-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {item.title}
                  </div>
                  <div className="text-[8px] sm:text-[10px] text-slate-400 hidden xs:block">{item.desc}</div>
                  <div
                    className={`text-[8px] sm:text-[10px] font-bold mt-0.5 sm:mt-1 ${
                      status === 'completed'
                        ? 'text-yellow-400'
                        : status === 'current'
                        ? 'text-blue-400'
                        : 'text-slate-600'
                    }`}
                  >
                    {item.videos} videos
                  </div>
                </div>

                {/* Popover showing target date and details */}
                {(() => {
                  const fraction = totalVideosNeeded ? Math.min(1, item.videos / totalVideosNeeded) : (index + 1) / roadmapSteps.length
                  const targetDays = Math.max(0, Math.round(duration * fraction))
                  const targetDate = new Date(start.getTime() + targetDays * 24 * 60 * 60 * 1000)
                  const now = new Date()
                  const daysRemaining = Math.max(0, Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
                  const uploadsRemaining = Math.max(0, item.videos - (videosUploaded || 0))
                  // Estimate next upload date based on cadence (simple heuristic)
                  const nextUploadOffset = (videosUploaded + 1) * cadenceEveryDays
                  const estimatedNextUpload = new Date(start.getTime() + nextUploadOffset * 24 * 60 * 60 * 1000)

                  const targetDateString = targetDate.toLocaleDateString()
                  const nextUploadString = estimatedNextUpload.toLocaleDateString()

                  return activeStep === item.step ? (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 w-[90vw] max-w-xs sm:max-w-sm md:min-w-[22rem] bg-white border border-slate-200 rounded-lg p-3 sm:p-4 shadow-2xl z-50 text-left text-slate-900 mb-2" onClick={(e) => e.stopPropagation()}>
                      {/* Arrow */}
                      <div className="absolute bottom-[-6px] left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white rotate-45 border-b border-r border-slate-200" />

                      <div className="flex items-start justify-between mb-2 sm:mb-3">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm sm:text-base">{item.title}</h4>
                          <p className="text-xs text-slate-600 mt-1">{item.desc}</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setActiveStep(null) }} className="text-sm text-slate-400 hover:text-slate-600 ml-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                          </svg>
                        </button>
                      </div>

                      <div className="space-y-1 sm:space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">Target Date:</span>
                          <span className="font-medium text-slate-900">{targetDateString}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">Status:</span>
                          <span className={`font-medium capitalize ${status === 'completed' ? 'text-emerald-600' : status === 'current' ? 'text-blue-600' : 'text-slate-500'}`}>
                            {status}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">Videos Needed:</span>
                          <span className="font-medium text-slate-900">{item.videos}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">Days Remaining:</span>
                          <span className="font-medium text-slate-900">{daysRemaining}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">Uploads Left:</span>
                          <span className="font-medium text-slate-900">{uploadsRemaining}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">Est. Next Upload:</span>
                          <span className="font-medium text-slate-900">{nextUploadString}</span>
                        </div>
                      </div>

                      <div className="mt-3 sm:mt-4 flex flex-col gap-2">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            if (onMarkStepDone) await onMarkStepDone(item.step)
                            // If no handler provided, just close the popover
                            setActiveStep(null)
                          }}
                          className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-3 rounded-md text-sm font-semibold transition-colors w-full"
                        >
                          Mark Step Complete
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); window.location.href = '/challenge' }} className="inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 py-2 px-3 rounded-md text-sm font-semibold border border-slate-200 transition-colors w-full">View Challenge</button>
                      </div>

                    </div>
                  ) : null
                })()}
              </div>
            )
          })}
        </div>
      </div>

      {/* Stats Footer - Mobile responsive */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-700/50">
        <div className="text-center">
          <div className="text-[10px] sm:text-xs text-slate-400 mb-1">Videos Uploaded</div>
          <div className="text-lg sm:text-2xl font-bold text-white">
            {videosUploaded}
            <span className="text-xs sm:text-sm text-slate-400">/{totalVideosNeeded}</span>
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] sm:text-xs text-slate-400 mb-1">Current Streak</div>
          <div className="text-lg sm:text-2xl font-bold text-orange-400">{currentStreak} 🔥</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] sm:text-xs text-slate-400 mb-1">Total Points</div>
          <div className="text-lg sm:text-2xl font-bold text-yellow-400">{totalPoints}</div>
        </div>
      </div>
    </div>
  )
}
