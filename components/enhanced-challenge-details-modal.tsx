"use client"

import { useState } from 'react'
import { Trash2, AlertCircle, Edit, Share2, CheckCircle, Flame, Trophy, Calendar } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Challenge } from '@/types/challenge'

interface EnhancedChallengeDetailsModalProps {
  challenge: Challenge | null
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onVideoClick?: () => void
}

export default function EnhancedChallengeDetailsModal({
  challenge,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onVideoClick
}: EnhancedChallengeDetailsModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!challenge) return null

  const progressPercentage = challenge.completion_percentage || 0
  const statusColor =
    challenge.status === 'completed'
      ? 'text-emerald-400'
      : challenge.status === 'active'
      ? 'text-cyan-400'
      : 'text-slate-400'

  const statusBg =
    challenge.status === 'completed'
      ? 'bg-emerald-900/20 text-emerald-400'
      : challenge.status === 'active'
      ? 'bg-cyan-900/20 text-cyan-400'
      : 'bg-slate-700/20 text-slate-400'

  const daysActive = Math.floor(
    (new Date().getTime() - new Date(challenge.created_at).getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-screen overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl text-white">{challenge.challenge_title}</DialogTitle>
              <DialogDescription className="text-slate-400 mt-2">
                {challenge.challenge_description}
              </DialogDescription>
            </div>
            <div className="flex gap-2 ml-4">
              <Button
                size="sm"
                variant="outline"
                className="bg-slate-700 border-slate-600 hover:bg-slate-600"
                onClick={onEdit}
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Row */}
          <div className="flex flex-wrap gap-4 items-center">
            <Badge className={statusBg}>
              {challenge.status === 'completed' ? '✓ Completed' : challenge.status === 'active' ? '● Active' : 'Paused'}
            </Badge>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Calendar className="w-4 h-4" />
              <span>{daysActive} days active</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-amber-400 font-semibold">
              <Flame className="w-4 h-4" />
              <span>{challenge.streak_count} day streak</span>
            </div>
          </div>

          {/* Progress Section */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-cyan-400" />
                Challenge Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold">{progressPercentage}% Complete</span>
                  <span className="text-slate-400 text-sm">{challenge.points_earned} points earned</span>
                </div>
                <Progress value={progressPercentage} className="h-3" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-slate-700/50 border border-slate-600">
                  <p className="text-slate-400 text-xs font-semibold uppercase mb-1">Duration</p>
                  <p className="text-lg font-bold text-white">{challenge.duration_months} months</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-700/50 border border-slate-600">
                  <p className="text-slate-400 text-xs font-semibold uppercase mb-1">Upload Cadence</p>
                  <p className="text-lg font-bold text-white">Every {challenge.cadence_every_days} days</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-700/50 border border-slate-600">
                  <p className="text-slate-400 text-xs font-semibold uppercase mb-1">Videos Per Upload</p>
                  <p className="text-lg font-bold text-white">{challenge.videos_per_cadence}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-slate-400 text-xs font-semibold uppercase mb-2">Completion</p>
                  <p className="text-3xl font-bold text-emerald-400">{challenge.completion_percentage}%</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-slate-400 text-xs font-semibold uppercase mb-2">Longest Streak</p>
                  <p className="text-3xl font-bold text-amber-400">{challenge.longest_streak}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-slate-400 text-xs font-semibold uppercase mb-2">Missed Days</p>
                  <p className="text-3xl font-bold text-red-400">{challenge.missed_days}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-slate-400 text-xs font-semibold uppercase mb-2">Points</p>
                  <p className="text-3xl font-bold text-cyan-400">{challenge.points_earned}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Details Card */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle>Challenge Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase mb-1">Start Date</p>
                  <p className="text-white font-semibold">{new Date(challenge.started_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase mb-1">Next Upload</p>
                  <p className="text-white font-semibold">{new Date(challenge.next_upload_deadline).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase mb-1">Video Type</p>
                  <p className="text-white font-semibold capitalize">{challenge.video_type}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase mb-1">Category</p>
                  <p className="text-white font-semibold capitalize">{challenge.category_niche}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase mb-1">Timezone</p>
                  <p className="text-white font-semibold">{challenge.timezone}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase mb-1">Created</p>
                  <p className="text-white font-semibold">{new Date(challenge.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-600 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Email Notifications</span>
                  <Badge variant={challenge.email_notifications_enabled ? 'default' : 'secondary'}>
                    {challenge.email_notifications_enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Leaderboard Visible</span>
                  <Badge variant={challenge.leaderboard_visible ? 'default' : 'secondary'}>
                    {challenge.leaderboard_visible ? 'Public' : 'Private'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {onVideoClick && (
              <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700">
                View Videos
              </Button>
            )}
            <Button variant="outline" className="flex-1 border-slate-600" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              Delete Challenge?
            </DialogTitle>
            <DialogDescription>
              This will permanently delete the challenge "{challenge.challenge_title}" and all its associated data.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 mb-4">
            <p className="text-red-300 text-sm">
              <strong>Warning:</strong> All videos, uploads, and statistics for this challenge will be deleted.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-slate-600"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => {
                setShowDeleteConfirm(false)
                onClose()
                onDelete()
              }}
            >
              Delete Challenge
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
