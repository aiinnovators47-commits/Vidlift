import { useState, useCallback } from 'react'

interface SyncResult {
  challengeId: string
  status: 'success' | 'duplicate' | 'no_upload' | 'skipped' | 'error'
  videoTitle?: string
  pointsEarned?: number
  isOnTime?: boolean
  streakCount?: number
  message?: string
  reason?: string
}

interface UseSyncUploadsReturn {
  isSyncing: boolean
  syncedCount: number
  results: SyncResult[]
  error: string | null
  triggerSync: (challengeId?: string) => Promise<boolean>
  clearResults: () => void
}

/**
 * Hook to sync uploads from YouTube and auto-save to challenge_uploads
 * 
 * Usage:
 * ```tsx
 * const { isSyncing, syncedCount, results, triggerSync } = useSyncUploads()
 * 
 * return (
 *   <>
 *     <button onClick={() => triggerSync()}>
 *       {isSyncing ? 'Syncing...' : 'Sync Uploads'}
 *     </button>
 *     {results.map(r => (
 *       <div key={r.challengeId}>
 *         {r.status === 'success' && `✅ ${r.videoTitle} - +${r.pointsEarned} points`}
 *       </div>
 *     ))}
 *   </>
 * )
 * ```
 */
export function useSyncUploads(): UseSyncUploadsReturn {
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncedCount, setSyncedCount] = useState(0)
  const [results, setResults] = useState<SyncResult[]>([])
  const [error, setError] = useState<string | null>(null)

  const triggerSync = useCallback(async (challengeId?: string) => {
    try {
      setIsSyncing(true)
      setError(null)
      setResults([])

      const response = await fetch('/api/challenges/sync-uploads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          challengeId
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to sync uploads')
      }

      const data = await response.json()
      setSyncedCount(data.syncedCount || 0)
      setResults(data.results || [])

      console.log('✅ Sync complete:', data)
      return true
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to sync uploads'
      setError(errorMsg)
      console.error('❌ Sync error:', err)
      return false
    } finally {
      setIsSyncing(false)
    }
  }, [])

  const clearResults = useCallback(() => {
    setResults([])
    setSyncedCount(0)
    setError(null)
  }, [])

  return {
    isSyncing,
    syncedCount,
    results,
    error,
    triggerSync,
    clearResults
  }
}
