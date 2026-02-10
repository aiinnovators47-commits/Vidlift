"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Calendar, Trophy, Play, ExternalLink, RefreshCw } from 'lucide-react'

interface Upload {
  id: string
  videoId: string
  videoTitle: string
  videoUrl: string
  uploadDate: string
  scheduledDate: string
  onTimeStatus: boolean
  pointsEarned: number
}

interface UploadListProps {
  challengeId: string
  onDataChange?: (data: any) => void
}

export default function UploadList({ challengeId, onDataChange }: UploadListProps) {
  const [uploads, setUploads] = useState<Upload[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadUploads()
  }, [challengeId])

  const loadUploads = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/challenges/uploads?challengeId=${challengeId}`)
      if (response.ok) {
        const data = await response.json()
        setUploads(data.uploads || [])
        setStats(data.stats)
        onDataChange?.(data)
        console.log('✅ Loaded uploads:', data.uploads.length)
      }
    } catch (error) {
      console.error('Failed to load uploads:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadUploads()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin mr-2 w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
            <p className="text-gray-600">Loading uploads...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.totalUploads}</p>
                <p className="text-sm text-gray-600">Total Uploads</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.onTimeCount}</p>
                <p className="text-sm text-gray-600">On Time</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{stats.lateCount}</p>
                <p className="text-sm text-gray-600">Late</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{stats.totalPoints}</p>
                <p className="text-sm text-gray-600">Total Points</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Uploads List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Uploads</CardTitle>
              <CardDescription>All videos uploaded for this challenge</CardDescription>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {uploads.length === 0 ? (
            <div className="text-center py-8">
              <Play className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-600">No uploads yet</p>
              <p className="text-sm text-gray-500">Your uploads will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {uploads.map(upload => (
                <div
                  key={upload.id}
                  className={`p-4 border rounded-lg transition-all ${
                    upload.onTimeStatus
                      ? 'border-green-200 bg-green-50 hover:shadow-md'
                      : 'border-orange-200 bg-orange-50 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <div className="flex-shrink-0">
                      <img
                        src={`https://img.youtube.com/vi/${upload.videoId}/default.jpg`}
                        alt={upload.videoTitle}
                        className="w-20 h-20 rounded object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-2">
                          {upload.videoTitle}
                        </h3>
                        <div className="flex gap-2 flex-shrink-0">
                          {upload.onTimeStatus ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              On Time
                            </Badge>
                          ) : (
                            <Badge className="bg-orange-100 text-orange-800">
                              <Calendar className="w-3 h-3 mr-1" />
                              Late
                            </Badge>
                          )}
                          <Badge className="bg-purple-100 text-purple-800">
                            <Trophy className="w-3 h-3 mr-1" />
                            +{upload.pointsEarned}
                          </Badge>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                        <div>
                          <p className="text-xs font-semibold text-gray-500">Uploaded</p>
                          <p>{new Date(upload.uploadDate).toLocaleDateString()} {new Date(upload.uploadDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500">Deadline</p>
                          <p>{new Date(upload.scheduledDate).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {/* Video Link */}
                      <a
                        href={upload.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Watch on YouTube
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
