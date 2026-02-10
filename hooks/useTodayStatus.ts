'use client'

import { useState, useEffect } from 'react'

export interface TodayStatus {
  isUploadedToday: boolean
  uploadedAt: string | null
  pointsEarned: number
  onTimeStatus: boolean
  videoTitle: string | null
  videoUrl: string | null
  videoId: string | null
}

export interface DeadlineInfo {
  nextUploadDate: string | null
  isTodayDeadline: boolean
  daysUntilDeadline: number | null
}

export function useTodayStatus(challengeId: string) {
  const [status, setStatus] = useState<TodayStatus | null>(null)
  const [deadline, setDeadline] = useState<DeadlineInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTodayStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/challenges/today-status?challengeId=${challengeId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch today status')
      }
      
      const data = await response.json()
      setStatus(data.status)
      setDeadline(data.deadline)
      
      console.log('✅ Today status loaded:', data.status)
    } catch (err: any) {
      console.error('❌ Error fetching today status:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (challengeId) {
      fetchTodayStatus()
    }
  }, [challengeId])

  return {
    status,
    deadline,
    loading,
    error,
    refetch: fetchTodayStatus
  }
}
