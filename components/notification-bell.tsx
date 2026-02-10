"use client"

import { Bell, X, Check, ChevronRight, Clock, AlertTriangle, Sparkles, Trophy, Info, Upload, Star, Zap, Flame, Crown, Medal, Target, Calendar } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

function timeAgo(dateString?: string | null) {
  if (!dateString) return ''
  const now = Date.now()
  const d = new Date(dateString).getTime()
  const diff = Math.max(0, Math.floor((now - d) / 1000)) // seconds

  if (diff < 60) return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  if (diff < 60 * 86400) return `${Math.floor(diff / 86400)}d`
  return new Date(dateString).toLocaleDateString()
}

type NotificationItem = {
  id: string
  notification_type: string
  email_content?: any
  ui_read?: boolean
  created_at?: string
  ui_url?: string
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      const data = await res.json()
      if (res.ok) {
        setNotifications(data.notifications || [])
      } else {
        console.error('Failed to fetch notifications', data)
      }
    } catch (e) {
      console.error('fetch notifications error', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // initial load
    load()
    // poll every 60s for new notifications
    const t = setInterval(load, 60000)
    return () => clearInterval(t)
  }, [])

  const unreadCount = notifications.filter(n => !n.ui_read).length

  const markRead = async (id: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id], markRead: true })
      })
      const data = await res.json()
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, ui_read: true } : n))
      } else console.error('mark read failed', data)
    } catch (e) {
      console.error(e)
    }
  }

  const markAllRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true })
      })
      const data = await res.json()
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, ui_read: true })))
      } else console.error('mark all failed', data)
    } catch (e) { console.error(e) }
  }

  const handleOpenChange = (v: boolean) => {
    setOpen(v)
    if (v) load()
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button aria-label="Notifications" className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5 text-gray-700" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white text-xs font-semibold">{unreadCount}</span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-[min(420px,calc(100vw-32px))] p-3">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold">Notifications</h4>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={markAllRead}>Mark all</Button>
            <button onClick={() => setOpen(false)} className="p-1 rounded-full hover:bg-gray-100"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="max-h-[48vh] overflow-y-auto divide-y divide-gray-100">
          {loading && <div className="text-sm text-gray-500">Loading...</div>}

          {!loading && notifications.length === 0 && (
            <div className="py-8 text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                <Bell className="w-6 h-6 text-slate-400" />
              </div>
              <div className="text-sm text-gray-600">You're all caught up — no notifications</div>
              <div className="mt-4"><Link href="/notifications" className="text-sm text-blue-600">View settings</Link></div>
            </div>
          )}

          {notifications.map((n) => {
            const type = n.notification_type || 'info'
            const title = n.email_content?.challengeTitle || (n.email_content?.message || type)
            const excerpt = n.email_content?.message || (n.email_content?.challengeTitle ? `Challenge: ${n.email_content.challengeTitle}` : '')
                      
            // Enhanced icon mapping with achievement types
            const iconMap = {
              welcome: { bg: 'bg-green-50', fg: 'text-green-600', Icon: () => <Check className="w-4 h-4" /> },
              reminder: { bg: 'bg-blue-50', fg: 'text-blue-600', Icon: () => <Clock className="w-4 h-4" /> },
              missed: { bg: 'bg-red-50', fg: 'text-red-600', Icon: () => <AlertTriangle className="w-4 h-4" /> },
              streak: { bg: 'bg-amber-50', fg: 'text-amber-600', Icon: () => <Sparkles className="w-4 h-4" /> },
              completion: { bg: 'bg-indigo-50', fg: 'text-indigo-600', Icon: () => <Trophy className="w-4 h-4" /> },
              upload_success: { bg: 'bg-green-50', fg: 'text-green-600', Icon: () => <Upload className="w-4 h-4" /> },
              achievement_unlocked: { bg: 'bg-purple-50', fg: 'text-purple-600', Icon: () => <Star className="w-4 h-4" /> },
              early_bird: { bg: 'bg-teal-50', fg: 'text-teal-600', Icon: () => <Zap className="w-4 h-4" /> },
              streak_milestone: { bg: 'bg-orange-50', fg: 'text-orange-600', Icon: () => <Flame className="w-4 h-4" /> },
              challenge_master: { bg: 'bg-purple-50', fg: 'text-purple-600', Icon: () => <Crown className="w-4 h-4" /> },
              upload_milestone: { bg: 'bg-indigo-50', fg: 'text-indigo-600', Icon: () => <Medal className="w-4 h-4" /> },
              first_upload: { bg: 'bg-blue-50', fg: 'text-blue-600', Icon: () => <Target className="w-4 h-4" /> },
              info: { bg: 'bg-slate-50', fg: 'text-slate-600', Icon: () => <Info className="w-4 h-4" /> }
            }
          
            const iconConfig = iconMap[type] || iconMap.info

            return (
              <div key={n.id} className={`flex items-start gap-4 p-4 rounded-lg border border-gray-100 shadow-sm transition-shadow ${n.ui_read ? 'bg-gray-50 opacity-80' : 'bg-white hover:shadow-md'}`}>
                <div className={`flex items-center justify-center ${iconConfig.bg} rounded-lg w-12 h-12 shrink-0 border ${n.ui_read ? 'border-transparent' : 'border-gray-100'}`}>
                  <span className={`${iconConfig.fg}`}>
                    <iconConfig.Icon />
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="truncate">
                      <div className="text-sm font-semibold text-gray-900 truncate">{title}</div>
                      {excerpt && <div className="text-xs text-gray-500 truncate mt-1">{excerpt}</div>}
                    </div>
                    <div className="text-xs text-gray-400 ml-2 whitespace-nowrap">{timeAgo(n.created_at)}</div>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    {!n.ui_read && (
                      <button aria-label="Mark as read" title="Mark as read" onClick={() => markRead(n.id)} className="inline-flex items-center gap-2 text-sm text-blue-600 font-medium">
                        <Check className="w-4 h-4" />
                        <span className="hidden sm:inline">Mark</span>
                      </button>
                    )}

                    <button aria-label="Open notification" title="Open" onClick={() => { setOpen(false); if (n.ui_url) router.push(n.ui_url) }} className="ml-auto inline-flex items-center gap-2 text-sm text-gray-600 font-medium">
                      <span className="hidden sm:inline">Open</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-3">
          <Link href="/notifications" className="w-full block text-center text-sm text-blue-600">See all notifications</Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
