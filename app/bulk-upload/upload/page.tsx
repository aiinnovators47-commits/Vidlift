"use client"

import React, { useRef, useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import ChannelSummary from '@/components/channel-summary'
import SharedSidebar from '@/components/shared-sidebar'
import { Upload, X, Youtube, Menu, Video } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import dynamic from 'next/dynamic'
const NotificationBell = dynamic(() => import('@/components/notification-bell'), { ssr: false })

function BulkUploadContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const typeParam = searchParams?.get('type') || ''
  const pageBackgroundClass = typeParam === 'video' ? 'bg-slate-50' : 'bg-gradient-to-br from-gray-50 to-gray-100'

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)
  const [dropActive, setDropActive] = useState(false)
  const [uploadData, setUploadData] = useState({ title: '', description: '', tags: '', category: '22', privacy: 'public', madeForKids: false, language: 'en', license: 'standard', keywords: '' })

  // Sidebar state (shared pattern with other pages)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Auth/session
  const { data: session } = useSession()
  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/')
  }
  const [uploadType, setUploadType] = useState<'short' | 'long'>('long')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagSuggestions, setTagSuggestions] = useState<Array<{tag: string, usageCount: number, viralScore: number}>>([])
  const [suggestionStats, setSuggestionStats] = useState<{totalVideosAnalyzed: number, keyword: string, fallback?: boolean} | null>(null)
  const [suggestKeyword, setSuggestKeyword] = useState('')
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [channel, setChannel] = useState<any | null>(null)
  
  // Notification system
  const [notifications, setNotifications] = useState<Array<{
    id: string
    type: 'success' | 'error' | 'info' | 'warning'
    title: string
    message: string
    timestamp: Date
    duration?: number
  }>>([])
  const [uploadStatus, setUploadStatus] = useState<{
    phase: 'idle' | 'preparing' | 'uploading' | 'processing' | 'completed' | 'failed'
    message: string
    progress: number
    uploadId?: string
  }>({ phase: 'idle', message: '', progress: 0 })
  
  // AI Content Generation states
  const [aiKeyword, setAiKeyword] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [bestVideos, setBestVideos] = useState<any[]>([])
  const [showBestVideos, setShowBestVideos] = useState(false)
  const [aiGeneratedContent, setAiGeneratedContent] = useState<{
    title: string
    description: string
    tags: string[]
    reasoning: string
  } | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('youtube_channel')
      if (raw) setChannel(JSON.parse(raw))
    } catch (e) { }
  }, [])

  useEffect(() => {
    return () => {
      try { if (previewSrc && previewSrc.startsWith('blob:')) URL.revokeObjectURL(previewSrc) } catch (e) { }
    }
  }, [previewSrc])

  // Notification management
  const addNotification = (notification: Omit<typeof notifications[0], 'id' | 'timestamp'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const newNotification = {
      ...notification,
      id,
      timestamp: new Date(),
      duration: notification.duration || 5000
    }
    setNotifications(prev => [newNotification, ...prev])
    
    // Auto-remove notification after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }
  }

  // Comprehensive diagnostics function
  const runDiagnostics = () => {
    const accessToken = localStorage.getItem('youtube_access_token')
    const refreshToken = localStorage.getItem('youtube_refresh_token')
    const channel = localStorage.getItem('youtube_channel')
    
    let issues = []
    let status = 'success'
    
    if (!accessToken) {
      issues.push('❌ No YouTube access token found')
      status = 'error'
    } else {
      issues.push('✅ YouTube access token present')
    }
    
    if (!channel) {
      issues.push('❌ No YouTube channel connected')
      status = 'error'
    } else {
      try {
        const channelData = JSON.parse(channel)
        issues.push(`✅ Channel connected: ${channelData.title}`)
      } catch (e) {
        issues.push('❌ Invalid channel data')
        status = 'error'
      }
    }
    
    if (status === 'error') {
      issues.push('🔧 Solution: Go to Settings → Connect YouTube')
    }
    
    addNotification({
      type: status as 'success' | 'error',
      title: 'System Diagnostics',
      message: issues.join('\n'),
      duration: 10000
    })
  }

  // Fetch best performing videos from channel
  const fetchBestVideos = async () => {
    if (!channel) return
    
    try {
      const accessToken = localStorage.getItem('youtube_access_token')
      if (!accessToken) return
      
      const response = await fetch(`/api/youtube/best-videos?channelId=${channel.id}&accessToken=${encodeURIComponent(accessToken)}`)
      const data = await response.json()
      
      if (data.videos) {
        setBestVideos(data.videos)
        setShowBestVideos(true)
      }
    } catch (error) {
      console.error('Failed to fetch best videos:', error)
    }
  }

  // Generate AI content based on keyword
  const generateAIContent = async () => {
    if (!aiKeyword.trim()) {
      addNotification({
        type: 'error',
        title: 'Keyword Required',
        message: 'Please enter a keyword to generate content'
      })
      return
    }
    
    setIsGenerating(true)
    
    try {
      const response = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          keyword: aiKeyword,
          channelData: channel,
          videoType: uploadType,
          bestVideos: bestVideos
        })
      })
      
      const data = await response.json()
      
      if (data.error) {
        addNotification({
          type: 'error',
          title: 'Generation Failed',
          message: data.error
        })
        return
      }
      
      setAiGeneratedContent({
        title: data.title,
        description: data.description,
        tags: data.tags || [],
        reasoning: data.reasoning || ''
      })
      
      // Auto-fill the form
      setUploadData(prev => ({
        ...prev,
        title: data.title,
        description: data.description
      }))
      
      // Add generated tags
      if (data.tags && data.tags.length > 0) {
        const newTags = [...tags, ...data.tags.filter((tag: string) => !tags.includes(tag))]
        setTags(newTags)
        setUploadData(prev => ({ ...prev, tags: newTags.join(',') }))
      }
      
      addNotification({
        type: 'success',
        title: 'Content Generated! 🎉',
        message: `AI generated professional title and description for "${aiKeyword}"`,
        duration: 5000
      })
      
      // Fetch and show best videos for context
      fetchBestVideos()
      
    } catch (error: any) {
      console.error('AI generation failed:', error)
      addNotification({
        type: 'error',
        title: 'Generation Error',
        message: 'Failed to generate content. Please try again.'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement> | any) => {
    const files: File[] = Array.from(e.target.files || [])
    if (!files || files.length === 0) return

    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
    const accepted = files.filter(f => validTypes.includes(f.type))
    if (accepted.length === 0) {
      addNotification({ type: 'error', title: 'Invalid File Type', message: 'Please select a video file (MP4, WebM, MOV, or AVI)' })
      return
    }

    // Check file sizes (max 2GB each)
    const maxSize = 2 * 1024 * 1024 * 1024 // 2GB
    const tooLarge = accepted.find(f => f.size > maxSize)
    if (tooLarge) {
      addNotification({ type: 'error', title: 'File Too Large', message: `The file ${tooLarge.name} is larger than 2GB. Please compress your video.` })
      return
    }

    // append selected files
    setSelectedFiles(prev => [...prev, ...accepted])
    const first = accepted[0]
    setSelectedFile(first)
    setUploadData((s) => ({ ...s, title: first.name.replace(/\.[^/.]+$/, '') }))

    try {
      const url = URL.createObjectURL(first)
      setPreviewSrc(url)
      addNotification({
        type: 'success',
        title: 'File Selected',
        message: `"${first.name}" is ready for upload (${(first.size / (1024 * 1024)).toFixed(1)} MB)`
      })
    } catch (e) { 
      setPreviewSrc(null)
      addNotification({
        type: 'error',
        title: 'File Error',
        message: 'Unable to preview the selected file'
      })
    }
  }

  const addTag = (t?: string | {tag: string}) => {
    const val = typeof t === 'object' ? t.tag : (t ?? tagInput).trim()
    if (!val) return
    const normalized = val.replace(/[^a-zA-Z0-9 _-]/g, '')
    if (!normalized) return
    if (tags.includes(normalized)) { setTagInput(''); return }
    setTags(prev => [...prev, normalized])
    setTagInput('')
    setUploadData(s => ({ ...s, tags: [...tags, normalized].join(',') }))
  }

  const removeTag = (t: string) => {
    setTags(prev => prev.filter(x => x !== t))
    setUploadData(s => ({ ...s, tags: tags.filter(x => x !== t).join(',') }))
  }

  const toggleHide = () => {
    setUploadData(s => ({ ...s, privacy: s.privacy === 'private' ? 'public' : 'private' }))
  }

  const fetchSuggestions = async (kw?: string) => {
    const key = (kw ?? suggestKeyword).trim()
    if (!key) return
    try {
      setSuggestLoading(true)
      const res = await fetch(`/api/tags/suggest?keyword=${encodeURIComponent(key)}`)
      const data = await res.json()
      if (Array.isArray(data.suggestions)) {
        setTagSuggestions(data.suggestions)
        setSuggestionStats({
          totalVideosAnalyzed: data.totalVideosAnalyzed || 0,
          keyword: data.keyword || key,
          fallback: data.fallback
        })
      }
    } catch (err) {
      console.error('Failed to fetch tag suggestions', err)
    } finally {
      setSuggestLoading(false)
    }
  }

  const estimateUploadTime = (sizeBytes: number, mbps = 5) => {
    const mb = sizeBytes / (1024 * 1024)
    const seconds = (mb * 8) / mbps
    if (seconds < 60) return `${Math.round(seconds)}s`
    const mins = Math.round(seconds / 60)
    return `${mins}m`
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      addNotification({
        type: 'error',
        title: 'No File Selected',
        message: 'Please select a video file before uploading'
      })
      return
    }
    
    if (!uploadData.title.trim()) {
      addNotification({
        type: 'error',
        title: 'Title Required',
        message: 'Please enter a title for your video'
      })
      return
    }
    
    const accessToken = localStorage.getItem('youtube_access_token')
    console.log('Access token available:', !!accessToken)
    console.log('Channel available:', !!channel)
    
    if (!accessToken) {
      addNotification({
        type: 'error',
        title: 'Authentication Required',
        message: 'Please connect your YouTube channel first. Go to Settings → Connect YouTube.',
        duration: 8000
      })
      return
    }

    const uploadId = Date.now().toString()
    setIsUploading(true)
    setUploadProgress(0)
    setUploadStatus({ phase: 'preparing', message: 'Preparing upload...', progress: 0, uploadId })
    
    addNotification({
      type: 'info',
      title: 'Upload Started',
      message: `Starting upload of "${uploadData.title}"`,
      duration: 3000
    })

    try {
      await new Promise<void>((resolve, reject) => {
        try {
          const fd = new FormData()
          fd.append('video', selectedFile)
          fd.append('title', uploadData.title)
          fd.append('description', uploadData.description || '')
          fd.append('tags', tags.join(',') || '')
          fd.append('privacy', uploadData.privacy || 'unlisted')
          fd.append('madeForKids', String(uploadData.madeForKids || false))
          fd.append('category', uploadData.category || '22')
          fd.append('language', uploadData.language || 'en')
          fd.append('license', uploadData.license || 'standard')
          fd.append('access_token', accessToken)
          const channelIds = channel ? [channel.id] : []
          fd.append('channelIds', JSON.stringify(channelIds))

          const xhr = new XMLHttpRequest()
          xhr.open('POST', '/api/youtube/upload')
          
          xhr.upload.onloadstart = () => {
            setUploadStatus({ phase: 'uploading', message: 'Uploading video...', progress: 0, uploadId })
          }
          
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100)
              setUploadProgress(pct)
              setUploadStatus({ 
                phase: 'uploading', 
                message: `Uploading... ${pct}%`, 
                progress: pct, 
                uploadId 
              })
              
              // Progress notifications at key milestones
              if (pct === 25 || pct === 50 || pct === 75) {
                addNotification({
                  type: 'info',
                  title: 'Upload Progress',
                  message: `${pct}% uploaded - ${estimateUploadTime(selectedFile.size - (e.loaded), 5)} remaining`,
                  duration: 2000
                })
              }
            }
          }
          
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                setUploadStatus({ phase: 'processing', message: 'Processing video...', progress: 100, uploadId })
                const data = JSON.parse(xhr.responseText)
                console.log('Upload response:', data)
                if (data.success) {
                  setUploadStatus({ phase: 'completed', message: 'Upload completed!', progress: 100, uploadId })
                  resolve()
                  return
                }
                const errorMsg = data.error || 'Upload failed'
                const details = data.details ? ` (${JSON.stringify(data.details)})` : ''
                reject(new Error(errorMsg + details))
              } catch (err) { 
                console.error('Failed to parse response:', xhr.responseText)
                reject(new Error('Invalid response from server: ' + xhr.responseText.substring(0, 200)))
              }
            } else {
              console.error('Upload failed with status:', xhr.status, xhr.statusText, xhr.responseText)
              let errorMsg = `Upload failed with status ${xhr.status}`
              try {
                const errorData = JSON.parse(xhr.responseText)
                if (errorData.error) errorMsg = errorData.error
              } catch (e) {}
              reject(new Error(errorMsg))
            }
          }
          
          xhr.onerror = () => {
            reject(new Error('Network error during upload'))
          }
          
          xhr.ontimeout = () => {
            reject(new Error('Upload timed out'))
          }
          
          xhr.timeout = 30 * 60 * 1000 // 30 minutes timeout
          xhr.send(fd)
        } catch (err) { 
          reject(err) 
        }
      })

      // Success notification
      addNotification({
        type: 'success',
        title: 'Upload Successful! 🎉',
        message: `"${uploadData.title}" has been uploaded to YouTube`,
        duration: 8000
      })
      
      // Clear form after successful upload
      setTimeout(() => {
        setSelectedFile(null)
        setPreviewSrc(null)
        setTags([])
        setUploadData({ title: '', description: '', tags: '', category: '22', privacy: 'public', madeForKids: false, language: 'en', license: 'standard', keywords: '' })
        setUploadStatus({ phase: 'idle', message: '', progress: 0 })
      }, 2000)
      
    } catch (err: any) {
      console.error('Upload failed', err)
      setUploadStatus({ phase: 'failed', message: 'Upload failed', progress: 0, uploadId })
      
      let errorMessage = err?.message || 'An error occurred during upload. Please try again.'
      
      // Check for specific error types
      if (errorMessage.includes('Token expired') || errorMessage.includes('invalid_grant')) {
        errorMessage = 'Your YouTube connection has expired. Please reconnect your channel.'
      } else if (errorMessage.includes('Token mismatch')) {
        errorMessage = 'Channel connection issue. Please reconnect your YouTube channel.'
      } else if (errorMessage.includes('No access token')) {
        errorMessage = 'YouTube authentication missing. Please connect your channel first.'
      }
      
      addNotification({
        type: 'error',
        title: 'Upload Failed',
        message: errorMessage,
        duration: 15000
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Fixed notification bell at top-right */}
      <div className="fixed top-4 right-4 z-50">
        <NotificationBell />
      </div>

      <div className="flex">
        <SharedSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activePage="bulk-upload" isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
        <main className={`flex-1 pt-16 md:pt-18 px-3 sm:px-4 md:px-6 pb-24 md:pb-12 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-72'}`}>
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
            aria-label="Open sidebar"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="max-w-7xl mx-auto w-full">

        {/* Channel pill + Upgrade banner (same style as Smart Upload) */}
        {channel ? (
          <div className="flex justify-center mb-3 px-3 relative">
            <div className="inline-flex items-center gap-2 bg-black/70 text-white px-3 py-1 rounded-full shadow-sm max-w-full truncate">
              <img src={channel.thumbnail} alt={channel.title} className="w-6 h-6 rounded-full object-cover" />
              <span className="text-sm font-medium truncate max-w-[160px]">{channel.title}</span>

              <span className="ml-2 inline-flex items-center text-xs bg-white/10 px-2 py-0.5 rounded-full">
                <span className="font-semibold mr-1">1</span>
                <span className="text-xs">channel</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center mb-3 px-3">
            <Link href="/connect">
              <button className="inline-flex items-center gap-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-full shadow-lg transition-all duration-200">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                <span className="text-sm font-semibold">Connect Your YouTube Channel</span>
              </button>
            </Link>
          </div>
        )}

        <div className="flex justify-center mb-6 px-3">
          <div className="inline-flex items-center gap-3 rounded-full bg-white/5 border border-gray-100 px-4 py-2 text-sm text-gray-700 shadow-sm max-w-full overflow-hidden" suppressHydrationWarning>
            <svg className="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l1.5 4.5L18 8l-4 2.5L15 16l-3-2-3 2 1-5.5L6 8l4.5-1.5L12 2z" fill="currentColor"/></svg>
            <div className="flex items-center gap-3">
              <span className="font-semibold">Plan: Free</span>
              <span className="text-gray-500 hidden md:inline">• Limited features</span>
            </div>
            <Link href="/settings" className="ml-3 hidden md:inline-flex items-center px-3 py-1 rounded-full bg-gray-50 text-gray-800 text-sm font-semibold">
              <span>Manage plan</span>
            </Link>
          </div>
        </div>

        <div className="pb-8">
            <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />
            {!selectedFile ? (
              <div className="rounded-3xl bg-white p-5 sm:p-6 md:p-12 shadow-[0_40px_80px_rgba(8,15,52,0.06)] border border-gray-100 w-full sm:max-w-3xl sm:mx-auto">
                <div className="flex items-center justify-start sm:justify-center mb-3">
                  <div className="inline-flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full shadow-md text-xs md:text-sm">
                    <svg width="18" height="12" viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="block">
                      <path d="M21.6 1.3a2.7 2.7 0 0 0-1.9-1.9C17.7-0.1 11 0 11 0s-6.7-0.1-8.7.4A2.7 2.7 0 0 0 .4 2.3C0.1 4.3 0 7 0 7s0 2.7.4 4.7a2.7 2.7 0 0 0 1.9 1.9c2 0.5 8.7.5 8.7.5s6.7 0 8.7-.5a2.7 2.7 0 0 0 1.9-1.9C22 9.7 22 7 22 7s0-2.7-.4-4.7z" fill="white"/>
                      <path d="M9 9V5l4 2-4 2z" fill="#E21F26"/>
                    </svg>
                    <span className="text-sm font-semibold">YouTube</span>
                  </div>
                </div>
                <h2 className="text-left sm:text-center text-xl md:text-2xl font-semibold mb-2">Upload your video</h2>
                <p className="text-left sm:text-center text-xs md:text-sm text-gray-500 mb-4 md:mb-6">Files: MP4, MOV, WebM, or AVI — recommended ≥ 100MB</p>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDropActive(false)
                    const files = Array.from(e.dataTransfer.files)
                    const videoFile = files.find(f => f.type.startsWith('video/'))
                    if (videoFile) {
                      const event = { target: { files: [videoFile] } } as any
                      handleFileSelect(event)
                    }
                  }}
                  onDragOver={(e) => { e.preventDefault(); setDropActive(true) }}
                  onDragLeave={() => setDropActive(false)}
                  className={`w-full rounded-2xl border-2 ${dropActive ? 'border-emerald-300 bg-emerald-50 ring-2 ring-emerald-100' : 'border-dashed border-gray-200 bg-slate-50'} p-5 sm:p-6 md:p-10 flex flex-col md:flex-row md:items-center gap-4 md:gap-8 md:justify-between transition-all cursor-pointer hover:border-gray-300 hover:bg-slate-100`}
                >
                  <div className="flex items-start gap-4 sm:gap-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                      <Video className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-emerald-600" />
                    </div>
                    <div className="text-left min-w-0">
                      <div className="text-base sm:text-lg font-medium text-gray-800">Drag & drop video here</div>
                      <div className="text-sm text-gray-500 mt-1">Or <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }} className="text-emerald-700 underline underline-offset-2">select a file</button></div>

                      <div className="mt-3 md:hidden flex flex-wrap gap-2 text-xs text-gray-600">
                        <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1">MP4 / MOV / WebM / AVI</span>
                        <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1">Min 100MB</span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                        className="mt-4 md:hidden w-full inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                      >
                        Choose video
                      </button>
                    </div>
                  </div>

                  <div className="hidden md:block text-right text-xs text-gray-400 mt-4 md:mt-0">
                    <div>Accepted: MP4, WebM, MOV, AVI</div>
                    <div>Minimum: 100MB</div>
                  </div>
                </div>

                {selectedFile && previewSrc && (
                  <div className="mt-6 rounded-lg overflow-hidden bg-gray-900 w-full aspect-video max-w-3xl mx-auto">
                    <video src={previewSrc} className="w-full h-full object-cover" controls preload="metadata" />
                  </div>
                )}

              </div>
              ) : (
                // Show uploaded video cards after upload
                <div className="space-y-6 w-full sm:max-w-3xl sm:mx-auto">
                  {/* Video Card Preview */}
                  <div className="rounded-3xl bg-white p-5 sm:p-6 md:p-12 shadow-[0_40px_80px_rgba(8,15,52,0.06)] w-full">
                    <div className="text-left sm:text-center mb-6">
                      <h2 className="text-2xl font-semibold mb-1">Video Uploaded Successfully</h2>
                      <p className="text-sm text-gray-500">Configure your video details below</p>
                    </div>

                    {/* Video Info Card */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</div>
                          <div className="text-xs text-gray-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {uploadType === 'short' ? 'Short Form' : 'Long Form'}</div>
                        </div>
                        <button 
                          onClick={() => { setSelectedFile(null); setPreviewSrc(null) }} 
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {previewSrc && (
                        <div className="mt-4 rounded-lg overflow-hidden bg-gray-900 aspect-video">
                          <video 
                            src={previewSrc} 
                            className="w-full h-full object-cover" 
                            controls 
                            preload="metadata"
                          />
                        </div>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-start sm:justify-center">
                      <button 
                        onClick={() => { setSelectedFile(null); setPreviewSrc(null) }} 
                        className="w-full sm:w-auto px-4 py-3 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 font-medium"
                      >
                        Clear
                      </button>

                      <button 
                        onClick={() => fileInputRef.current?.click()} 
                        className="w-full sm:w-auto px-4 py-3 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 font-medium"
                      >
                        Change Video
                      </button>

                      <button 
                        onClick={() => {
                          // Store video data in sessionStorage for the next page
                          const videoDataToPass = {
                            fileName: selectedFile.name,
                            fileSize: selectedFile.size,
                            previewSrc: previewSrc,
                            file: selectedFile,
                            uploadType: uploadType,
                            formData: uploadData
                          }
                          sessionStorage.setItem('uploadVideoData', JSON.stringify(videoDataToPass))
                          router.push('/bulk-upload/configure')
                        }} 
                        className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 font-medium"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}

        </div>

          {/* Video Configuration Form - Only show when video is selected */}
          {selectedFile && (
            <div className="pb-8">
              <div className="space-y-8">
                {/* Video Preview & Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    {/* Video Info Section */}
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        📝 Video Information
                      </h3>
                      
                      <div className="space-y-4">
                        {/* AI Content Generator */}
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">🤖</span>
                            <h4 className="font-bold text-gray-900">AI Content Generator</h4>
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">NEW</span>
                          </div>
                          
                          <div className="flex flex-col md:flex-row gap-3">
                            <input 
                              type="text" 
                              value={aiKeyword} 
                              onChange={(e) => setAiKeyword(e.target.value)} 
                              placeholder="Enter main topic/keyword (e.g., 'cooking tips', 'react tutorial')" 
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                              onKeyPress={(e) => e.key === 'Enter' && generateAIContent()}
                            />
                            <button 
                              onClick={generateAIContent}
                              disabled={isGenerating || !aiKeyword.trim()}
                              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                                isGenerating ? 
                                  'bg-gray-300 text-gray-500 cursor-not-allowed' : 
                                  'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-md hover:shadow-lg'
                              }`}
                            >
                              {isGenerating ? (
                                <span className="flex items-center gap-2">
                                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                                  Generating...
                                </span>
                              ) : (
                                '✨ Generate Content'
                              )}
                            </button>
                          </div>
                          
                          {aiGeneratedContent && (
                            <div className="mt-3 text-xs text-purple-700 bg-purple-100 rounded-lg p-2">
                              💡 <strong>AI Strategy:</strong> {aiGeneratedContent.reasoning}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Video Title *</label>
                          <input 
                            type="text" 
                            value={uploadData.title} 
                            onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })} 
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                            placeholder="Enter an engaging title for your video..."
                          />
                          {aiGeneratedContent && uploadData.title === aiGeneratedContent.title && (
                            <div className="mt-1 text-xs text-green-600 flex items-center gap-1">
                              ✨ AI Generated - Click to customize
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                          <textarea 
                            value={uploadData.description} 
                            onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })} 
                            rows={4} 
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none" 
                            placeholder="Describe your video content, add timestamps, links..."
                          />
                          {aiGeneratedContent && uploadData.description === aiGeneratedContent.description && (
                            <div className="mt-1 text-xs text-green-600 flex items-center gap-1">
                              ✨ AI Generated - Click to customize
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                            <select 
                              value={uploadData.category} 
                              onChange={(e) => setUploadData({ ...uploadData, category: e.target.value })} 
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            >
                              <option value="22">People & Blogs</option>
                              <option value="1">Film & Animation</option>
                              <option value="2">Autos & Vehicles</option>
                              <option value="10">Music</option>
                              <option value="20">Gaming</option>
                              <option value="24">Entertainment</option>
                              <option value="27">Education</option>
                              <option value="28">Science & Technology</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Privacy</label>
                            <select 
                              value={uploadData.privacy} 
                              onChange={(e) => setUploadData({ ...uploadData, privacy: e.target.value })} 
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            >
                              <option value="private">🔒 Private</option>
                              <option value="unlisted">🔗 Unlisted</option>
                              <option value="public">🌍 Public</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Tags Management Section */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        🏷️ Tags & Keywords
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="flex flex-col md:flex-row gap-3">
                          <input 
                            value={tagInput} 
                            onChange={(e) => setTagInput(e.target.value)} 
                            placeholder="Enter a tag..." 
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            onKeyPress={(e) => e.key === 'Enter' && addTag()}
                          />
                          <button 
                            onClick={() => addTag()} 
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                          >
                            ➕ Add Tag
                          </button>
                        </div>
                        
                        {/* Current Tags Display */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Current Tags ({tags.length})</span>
                            {tags.length > 0 && (
                              <button 
                                onClick={() => setTags([])} 
                                className="text-xs text-red-600 hover:text-red-700 font-medium"
                              >
                                Clear All
                              </button>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {tags.length === 0 ? (
                              <div className="text-sm text-gray-500 italic p-4 border-2 border-dashed border-gray-300 rounded-xl w-full text-center">
                                No tags added yet. Add some tags to improve discoverability!
                              </div>
                            ) : (
                              tags.map(t => (
                                <span 
                                  key={t} 
                                  className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-blue-200 rounded-xl text-sm font-medium text-blue-700 shadow-sm hover:shadow-md transition-all"
                                >
                                  #{t}
                                  <button 
                                    onClick={() => removeTag(t)} 
                                    className="text-red-500 hover:text-red-700 font-bold text-sm"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))
                            )}
                          </div>
                        </div>

                      {/* Enhanced Viral Tag Suggestions */}
                      <div className="mt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <input 
                            value={suggestKeyword} 
                            onChange={(e) => setSuggestKeyword(e.target.value)} 
                            placeholder="Enter keyword for viral tag suggestions" 
                            className="px-3 py-2 border rounded-md flex-1" 
                            onKeyPress={(e) => e.key === 'Enter' && fetchSuggestions()}
                          />
                          <button 
                            onClick={() => fetchSuggestions()} 
                            disabled={!suggestKeyword.trim() || suggestLoading} 
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
                          >
                            {suggestLoading ? '🔄' : '🔥 Get Viral Tags'}
                          </button>
                        </div>

                        {tagSuggestions.length > 0 && (
                          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                🏆 Top 10 Viral Tags
                                {suggestionStats?.fallback && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Suggested</span>}
                              </h4>
                              {suggestionStats && !suggestionStats.fallback && (
                                <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded-full border">
                                  📊 {suggestionStats.totalVideosAnalyzed} videos analyzed
                                </span>
                              )}
                            </div>
                            
                            <div className="grid gap-2 mb-4 max-h-60 overflow-y-auto">
                              {tagSuggestions.map((suggestion, index) => {
                                const isSelected = tags.includes(suggestion.tag)
                                return (
                                  <div
                                    key={index}
                                    className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                                      isSelected 
                                        ? 'border-green-300 bg-green-50 shadow-sm' 
                                        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                                    }`}
                                    onClick={() => !isSelected && addTag(suggestion)}
                                  >
                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-sm font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                          #{index + 1}
                                        </span>
                                        <span className={`font-medium truncate ${
                                          isSelected ? 'text-green-700' : 'text-gray-800'
                                        }`}>
                                          #{suggestion.tag}
                                        </span>
                                        {isSelected && (
                                          <span className="text-green-600 text-sm">✓</span>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-3">
                                      <div className="text-right">
                                        <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                                          suggestion.viralScore >= 80 ? 'bg-red-100 text-red-700' :
                                          suggestion.viralScore >= 60 ? 'bg-orange-100 text-orange-700' :
                                          'bg-yellow-100 text-yellow-700'
                                        }`}>
                                          🔥 {suggestion.viralScore}%
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                          👥 {suggestion.usageCount.toLocaleString()}
                                        </div>
                                      </div>
                                      
                                      <div className="w-12">
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                          <div 
                                            className={`h-2 rounded-full transition-all duration-300 ${
                                              suggestion.viralScore >= 80 ? 'bg-gradient-to-r from-red-400 to-red-600' :
                                              suggestion.viralScore >= 60 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                                              'bg-gradient-to-r from-yellow-400 to-yellow-600'
                                            }`}
                                            style={{width: `${suggestion.viralScore}%`}}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                            
                            <div className="flex flex-wrap gap-2 justify-between">
                              <button
                                type="button"
                                onClick={() => {
                                  tagSuggestions.slice(0, 5).forEach(s => addTag(s))
                                }}
                                className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-1"
                              >
                                ⚡ Add Top 5
                              </button>
                              
                              <button
                                type="button"
                                onClick={() => {
                                  tagSuggestions.forEach(s => addTag(s))
                                }}
                                className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-1"
                              >
                                📋 Add All Tags
                              </button>
                            </div>
                            
                            {suggestionStats && (
                              <div className="mt-3 text-xs text-gray-500 text-center bg-white rounded-lg p-2 border">
                                {suggestionStats.fallback ? (
                                  '💡 Connect YouTube API for real-time viral tag analysis'
                                ) : (
                                  `🎯 Based on "${suggestionStats.keyword}" analysis across ${suggestionStats.totalVideosAnalyzed} trending videos`
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {tagSuggestions.length === 0 && !suggestLoading && (
                          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                            <div className="text-4xl mb-2">🎯</div>
                            <div className="text-sm text-gray-500">
                              Enter a keyword above to discover viral tags from YouTube
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                  {/* Video Preview Sidebar */}
                  <div className="space-y-6">
                    {/* Best Videos Section */}
                    {showBestVideos && bestVideos.length > 0 && (
                      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            🏆 Your Top Videos
                          </h3>
                          <button 
                            onClick={() => setShowBestVideos(false)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                          {bestVideos.slice(0, 5).map((video, index) => (
                            <div key={video.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                              <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                #{index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm text-gray-900 truncate">
                                  {video.title}
                                </h4>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                                  <span>👀 {(video.viewCount || 0).toLocaleString()}</span>
                                  <span>👍 {(video.likeCount || 0).toLocaleString()}</span>
                                  <span>💬 {(video.commentCount || 0).toLocaleString()}</span>
                                </div>
                                {video.tags && video.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {video.tags.slice(0, 3).map((tag: string) => (
                                      <span 
                                        key={tag} 
                                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                                      >
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-4 text-xs text-gray-500 text-center">
                          💡 Use these successful patterns for inspiration in your new content
                        </div>
                      </div>
                    )}

                    {/* Video Preview */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        🎥 Preview
                      </h3>
                      
                      <div className="w-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden mb-4 shadow-lg">
                        {previewSrc ? (
                          <video 
                            src={previewSrc} 
                            controls 
                            className="w-full h-48 md:h-56 object-cover" 
                            poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E"
                          />
                        ) : (
                          <div className="w-full h-48 md:h-56 flex flex-col items-center justify-center text-gray-400">
                            <Upload className="w-12 h-12 mb-2" />
                            <span className="text-sm">Video preview will appear here</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">File Info</div>
                          <div className="text-sm font-semibold text-gray-900 truncate">{selectedFile?.name || '—'}</div>
                          <div className="text-xs text-gray-500">
                            {selectedFile && `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Upload Time</div>
                          <div className="text-sm font-semibold text-blue-600">
                            ⚡ {selectedFile ? estimateUploadTime(selectedFile.size) : '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Additional Options */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        ⚙️ Options
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Keywords</label>
                          <input 
                            value={uploadData.keywords} 
                            onChange={(e) => setUploadData({ ...uploadData, keywords: e.target.value })} 
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                            placeholder="SEO keywords..."
                          />
                        </div>
                        
                        <div>
                          <div className="text-sm font-semibold text-gray-700 mb-2">Hashtags Preview</div>
                          <div className="bg-gray-50 rounded-xl p-4 min-h-[80px]">
                            <div className="flex flex-wrap gap-2">
                              {tags.length === 0 ? (
                                <div className="text-xs text-gray-400 italic">Add tags to see hashtag preview</div>
                              ) : (
                                tags.slice(0, 10).map(t => (
                                  <span key={t} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                                    #{t}
                                  </span>
                                ))
                              )}
                              {tags.length > 10 && (
                                <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded-lg text-xs">
                                  +{tags.length - 10} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Upload Progress */}
                {(isUploading || uploadStatus.phase !== 'idle') && (
                  <div className={`rounded-2xl p-6 border transition-all duration-500 ${
                    uploadStatus.phase === 'completed' ? 'bg-green-50 border-green-200' :
                    uploadStatus.phase === 'failed' ? 'bg-red-50 border-red-200' :
                    'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          uploadStatus.phase === 'completed' ? 'bg-green-500' :
                          uploadStatus.phase === 'failed' ? 'bg-red-500' :
                          'bg-blue-500'
                        }`}>
                          {uploadStatus.phase === 'completed' ? (
                            <span className="text-white text-lg">✓</span>
                          ) : uploadStatus.phase === 'failed' ? (
                            <span className="text-white text-lg">✕</span>
                          ) : (
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                          )}
                        </div>
                        <div>
                          <h3 className={`text-lg font-bold ${
                            uploadStatus.phase === 'completed' ? 'text-green-900' :
                            uploadStatus.phase === 'failed' ? 'text-red-900' :
                            'text-blue-900'
                          }`}>
                            {uploadStatus.phase === 'preparing' ? '🔄 Preparing Upload...' :
                             uploadStatus.phase === 'uploading' ? '📤 Uploading Video...' :
                             uploadStatus.phase === 'processing' ? '⚙️ Processing...' :
                             uploadStatus.phase === 'completed' ? '✅ Upload Complete!' :
                             uploadStatus.phase === 'failed' ? '❌ Upload Failed' : 'Ready'}
                          </h3>
                          <p className={`text-sm ${
                            uploadStatus.phase === 'completed' ? 'text-green-700' :
                            uploadStatus.phase === 'failed' ? 'text-red-700' :
                            'text-blue-700'
                          }`}>
                            {uploadStatus.message}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-2xl font-bold ${
                          uploadStatus.phase === 'completed' ? 'text-green-700' :
                          uploadStatus.phase === 'failed' ? 'text-red-700' :
                          'text-blue-700'
                        }`}>
                          {uploadProgress}%
                        </span>
                        {selectedFile && uploadStatus.phase === 'uploading' && (
                          <div className="text-xs text-gray-600 mt-1">
                            {(selectedFile.size * uploadProgress / 100 / (1024 * 1024)).toFixed(1)}MB / {(selectedFile.size / (1024 * 1024)).toFixed(1)}MB
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className={`w-full rounded-full h-4 mb-3 ${
                      uploadStatus.phase === 'completed' ? 'bg-green-200' :
                      uploadStatus.phase === 'failed' ? 'bg-red-200' :
                      'bg-blue-200'
                    }`}>
                      <div 
                        className={`h-4 rounded-full transition-all duration-300 ease-out ${
                          uploadStatus.phase === 'completed' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                          uploadStatus.phase === 'failed' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                          'bg-gradient-to-r from-blue-500 to-blue-600'
                        }`}
                        style={{width: `${uploadProgress}%`}}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className={`${
                        uploadStatus.phase === 'completed' ? 'text-green-600' :
                        uploadStatus.phase === 'failed' ? 'text-red-600' :
                        'text-blue-600'
                      }`}>
                        {uploadStatus.phase === 'uploading' ? (
                          selectedFile ? `ETA: ${estimateUploadTime(selectedFile.size * (100 - uploadProgress) / 100)}` : 'Calculating...'
                        ) : uploadStatus.phase === 'completed' ? (
                          'Your video is now live on YouTube!'
                        ) : uploadStatus.phase === 'failed' ? (
                          'Upload failed. Please try again.'
                        ) : (
                          'Please don\'t close this page during upload...'
                        )}
                      </div>
                      
                      {uploadStatus.phase === 'failed' && (
                        <button
                          onClick={() => {
                            setUploadStatus({ phase: 'idle', message: '', progress: 0 })
                            setUploadProgress(0)
                          }}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-xs font-medium"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                      <button 
                        onClick={() => { 
                          setSelectedFile(null)
                          setPreviewSrc(null)
                          setTags([])
                          setUploadData({ title: '', description: '', tags: '', category: '22', privacy: 'public', madeForKids: false, language: 'en', license: 'standard', keywords: '' })
                        }} 
                        className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all w-full md:w-auto"
                        disabled={isUploading}
                      >
                        🗑️ Clear All
                      </button>
                      <button 
                        onClick={() => { 
                          if (!selectedFile) { 
                            alert('No file selected')
                            return 
                          } 
                          alert('Draft saved locally! You can continue editing later.')
                        }} 
                        className="px-6 py-3 border-2 border-blue-300 text-blue-700 rounded-xl font-semibold hover:bg-blue-50 transition-all w-full md:w-auto"
                        disabled={!selectedFile || isUploading}
                      >
                        💾 Save Draft
                      </button>
                    </div>

                    <button
                      disabled={!selectedFile || !uploadData.title.trim() || isUploading}
                      onClick={async () => {
                        await setUploadData(s => ({ ...s, tags: tags.join(','), keywords: s.keywords }))
                        handleUpload()
                      }}
                      className={`px-8 py-4 rounded-xl font-bold text-lg transition-all transform w-full md:w-auto ${
                        !selectedFile || !uploadData.title.trim() || isUploading
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl hover:scale-[1.02]'
                      }`}
                    >
                      {isUploading ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                          Uploading... {uploadProgress}%
                        </span>
                      ) : (
                        '🚀 Upload to YouTube'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
    </div>
  )
}

export default function BulkUploadFullPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <BulkUploadContent />
    </Suspense>
  )
}
