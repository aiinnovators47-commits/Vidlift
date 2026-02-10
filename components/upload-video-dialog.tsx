"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Upload, CheckCircle, Loader2 } from 'lucide-react'
import { Challenge } from '@/types/challenge'

interface UploadVideoDialogProps {
  isOpen: boolean
  onClose: () => void
  challenge: Challenge
  onSuccess?: () => void
}

export default function UploadVideoDialog({ isOpen, onClose, challenge, onSuccess }: UploadVideoDialogProps) {
  const { toast } = useToast()
  const [videoId, setVideoId] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)

  const extractVideoId = (url: string) => {
    // Extract YouTube video ID from various URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/  // Direct video ID
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }
    return null
  }

  const handleUrlChange = (url: string) => {
    setVideoUrl(url)
    const id = extractVideoId(url)
    if (id) {
      setVideoId(id)
    }
  }

  const handleSubmit = async () => {
    if (!videoId && !videoUrl) {
      toast({
        title: 'Missing Information',
        description: 'Please enter a YouTube video URL or ID',
        variant: 'destructive'
      })
      return
    }

    const finalVideoId = videoId || extractVideoId(videoUrl)
    if (!finalVideoId) {
      toast({
        title: 'Invalid URL',
        description: 'Could not extract video ID from the URL',
        variant: 'destructive'
      })
      return
    }

    try {
      setLoading(true)
      
      // Record the upload
      const res = await fetch('/api/challenge-uploads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          challengeId: challenge.id,
          videoId: finalVideoId,
          videoUrl: `https://www.youtube.com/watch?v=${finalVideoId}`,
          uploadDate: new Date().toISOString(),
          scheduledDate: challenge.nextUploadDeadline
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to record upload')
      }

      setUploadResult(data)
      setSuccess(true)
      
      toast({
        title: data.message || 'Upload Recorded!',
        description: `You earned ${data.pointsEarned} points! ${data.isOnTime ? '🎉 On-time bonus included!' : ''}`,
      })

      // Wait a moment to show success, then close
      setTimeout(() => {
        onClose()
        setSuccess(false)
        setVideoId('')
        setVideoUrl('')
        setUploadResult(null)
        if (onSuccess) onSuccess()
      }, 2000)

    } catch (err: any) {
      console.error('Upload error:', err)
      toast({
        title: 'Upload Failed',
        description: err.message || 'Failed to record your upload. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            Record Video Upload
          </DialogTitle>
          <DialogDescription>
            Enter your YouTube video URL to track your challenge progress
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-green-600 mb-2">Upload Recorded!</h3>
              <p className="text-gray-600">
                You earned <span className="font-bold text-purple-600">{uploadResult?.pointsEarned} points</span>
              </p>
              {uploadResult?.isOnTime && (
                <p className="text-sm text-green-600 mt-1">🎉 On-time bonus included!</p>
              )}
              {uploadResult?.newStreak > 0 && (
                <p className="text-sm text-orange-600 mt-1">
                  🔥 {uploadResult.newStreak}-day streak!
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="videoUrl">YouTube Video URL or ID</Label>
              <Input
                id="videoUrl"
                placeholder="https://www.youtube.com/watch?v=... or video ID"
                value={videoUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                Paste your YouTube video URL or just the video ID
              </p>
            </div>

            {videoId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Video ID:</strong> {videoId}
                </p>
                <a 
                  href={`https://www.youtube.com/watch?v=${videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  Preview video →
                </a>
              </div>
            )}

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
              <p className="font-semibold text-gray-700 mb-1">Points Breakdown:</p>
              <ul className="text-gray-600 space-y-1">
                <li>• Base points: <span className="font-semibold">100</span></li>
                <li>• On-time bonus: <span className="font-semibold">+50</span></li>
                {(challenge?.streakCount || 0) > 0 && (
                  <li>• Streak bonus: <span className="font-semibold">+{Math.min((challenge?.streakCount || 0) * 5, 100)}</span></li>
                )}
                <li className="pt-1 border-t mt-2 font-semibold text-purple-600">
                  Total possible: {100 + 50 + ((challenge?.streakCount || 0) ? Math.min((challenge?.streakCount || 0) * 5, 100) : 0)}
                </li>
              </ul>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !videoId}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Recording...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Record Upload
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
