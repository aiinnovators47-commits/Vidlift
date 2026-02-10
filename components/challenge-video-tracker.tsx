"use client"

import { useState, useEffect } from 'react'
import { Video, Calendar, Eye, Heart, MessageCircle, Trash2, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

interface ChallengeVideo {
  id: string
  challenge_id: string
  video_id: string
  video_title: string
  video_url: string
  upload_date: string
  scheduled_date: string
  on_time_status: boolean
  points_earned: number
  video_duration: number
  video_views: number
  video_likes: number
  video_comments: number
  created_at: string
}

interface ChallengeVideoTrackerProps {
  challengeId: string
  challengeTitle: string
  videos: ChallengeVideo[]
  onVideoDelete: (videoId: string) => void
  isLoading?: boolean
}

export default function ChallengeVideoTracker({
  challengeId,
  challengeTitle,
  videos,
  onVideoDelete,
  isLoading = false
}: ChallengeVideoTrackerProps) {
  const [selectedVideo, setSelectedVideo] = useState<ChallengeVideo | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const totalViews = videos.reduce((sum, v) => sum + v.video_views, 0)
  const totalLikes = videos.reduce((sum, v) => sum + v.video_likes, 0)
  const totalComments = videos.reduce((sum, v) => sum + v.video_comments, 0)
  const totalPoints = videos.reduce((sum, v) => sum + v.points_earned, 0)
  const onTimeCount = videos.filter(v => v.on_time_status).length

  const openDetail = (video: ChallengeVideo) => {
    setSelectedVideo(video)
    setShowDetailModal(true)
  }

  const handleDeleteVideo = async (videoId: string) => {
    try {
      const response = await fetch(`/api/challenges/videos/${videoId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete video')
      }

      onVideoDelete(videoId)
      setShowDeleteConfirm(null)
    } catch (error: any) {
      console.error('Error deleting video:', error)
      alert(`Failed to delete video: ${error.message}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-4">
            <div className="text-center">
              <Video className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{videos.length}</div>
              <p className="text-xs text-slate-400">Videos</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-4">
            <div className="text-center">
              <Eye className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{(totalViews / 1000).toFixed(1)}K</div>
              <p className="text-xs text-slate-400">Total Views</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-4">
            <div className="text-center">
              <Heart className="w-5 h-5 text-red-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{(totalLikes / 1000).toFixed(1)}K</div>
              <p className="text-xs text-slate-400">Total Likes</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-4">
            <div className="text-center">
              <MessageCircle className="w-5 h-5 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{(totalComments / 1000).toFixed(1)}K</div>
              <p className="text-xs text-slate-400">Comments</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-4">
            <div className="text-center">
              <CheckCircle className="w-5 h-5 text-orange-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{totalPoints}</div>
              <p className="text-xs text-slate-400">Points Earned</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Videos List */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-cyan-400" />
            Challenge Videos ({videos.length})
          </CardTitle>
          <CardDescription>Track all uploads for {challengeTitle}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-spin" />
              <p className="text-slate-400">Loading videos...</p>
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-8">
              <Video className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
              <p className="text-slate-400">No videos uploaded yet</p>
              <p className="text-slate-500 text-sm">Start uploading videos to track your progress</p>
            </div>
          ) : (
            <div className="space-y-3">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="flex items-start justify-between p-4 rounded-lg bg-slate-700/30 border border-slate-600 hover:border-slate-500 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-slate-600 overflow-hidden">
                        <img
                          src={`https://img.youtube.com/vi/${video.video_id}/default.jpg`}
                          alt={video.video_title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate mb-1">{video.video_title}</h3>
                        <div className="flex flex-wrap gap-2 items-center mb-2">
                          <Badge variant={video.on_time_status ? 'default' : 'secondary'}>
                            {video.on_time_status ? '✓ On Time' : '⚠ Late'}
                          </Badge>
                          <span className="text-xs text-slate-400">{new Date(video.upload_date).toLocaleDateString()}</span>
                          <span className="text-xs text-amber-400 font-semibold">+{video.points_earned} pts</span>
                        </div>
                        <div className="flex gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" /> {video.video_views.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" /> {video.video_likes.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" /> {video.video_comments.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-slate-600 border-slate-500 hover:bg-slate-500"
                      onClick={() => openDetail(video)}
                    >
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-red-900/30 border-red-700 hover:bg-red-900/50 text-red-400"
                      onClick={() => setShowDeleteConfirm(video.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Details Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Video Details</DialogTitle>
          </DialogHeader>
          {selectedVideo && (
            <div className="space-y-6">
              {/* Video Preview */}
              <div className="aspect-video rounded-lg overflow-hidden bg-black">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${selectedVideo.video_id}`}
                  title={selectedVideo.video_title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>

              {/* Video Info */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedVideo.video_title}</h2>
                  <a
                    href={selectedVideo.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 text-sm break-all"
                  >
                    {selectedVideo.video_url}
                  </a>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
                    <p className="text-slate-400 text-xs font-semibold uppercase mb-1">Views</p>
                    <p className="text-xl font-bold text-cyan-400">{selectedVideo.video_views.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
                    <p className="text-slate-400 text-xs font-semibold uppercase mb-1">Likes</p>
                    <p className="text-xl font-bold text-red-400">{selectedVideo.video_likes.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
                    <p className="text-slate-400 text-xs font-semibold uppercase mb-1">Comments</p>
                    <p className="text-xl font-bold text-blue-400">{selectedVideo.video_comments.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
                    <p className="text-slate-400 text-xs font-semibold uppercase mb-1">Points</p>
                    <p className="text-xl font-bold text-amber-400">+{selectedVideo.points_earned}</p>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
                    <p className="text-slate-400 text-xs font-semibold uppercase mb-1">Upload Date</p>
                    <p className="text-white font-semibold">{new Date(selectedVideo.upload_date).toLocaleDateString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
                    <p className="text-slate-400 text-xs font-semibold uppercase mb-1">Status</p>
                    <Badge variant={selectedVideo.on_time_status ? 'default' : 'secondary'}>
                      {selectedVideo.on_time_status ? '✓ On Time' : '⚠ Late'}
                    </Badge>
                  </div>
                </div>

                {/* Duration */}
                <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
                  <p className="text-slate-400 text-xs font-semibold uppercase mb-1">Duration</p>
                  <p className="text-white font-semibold">{Math.floor(selectedVideo.video_duration / 60)}:{String(selectedVideo.video_duration % 60).padStart(2, '0')} minutes</p>
                </div>
              </div>

              {/* Delete Button */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-slate-600 hover:bg-slate-800"
                  onClick={() => setShowDetailModal(false)}
                >
                  Close
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    setShowDetailModal(false)
                    setShowDeleteConfirm(selectedVideo.id)
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Video
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              Delete Video?
            </DialogTitle>
            <DialogDescription>This action cannot be undone. The video record will be permanently deleted.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-slate-600"
              onClick={() => setShowDeleteConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => showDeleteConfirm && handleDeleteVideo(showDeleteConfirm)}
            >
              Delete Video
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
