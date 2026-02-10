"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation'
import {
    Home,
    FileText,
    Video,
    Upload,
    GitCompare,
    Layers,
    Sparkles,
    ChevronDown,
    ChevronsRight,
    ChevronsLeft,
    Youtube,
    Play,
    Plus,
    Settings,
    X,
    Trophy
} from "lucide-react"
import { CrenovaLogo } from "@/components/crenova-logo"

interface SharedSidebarProps {
    sidebarOpen: boolean
    setSidebarOpen: (open: boolean) => void
    activePage?: string
    isCollapsed?: boolean
    setIsCollapsed?: (collapsed: boolean) => void
}

export default function SharedSidebar({ sidebarOpen, setSidebarOpen, activePage: activePageProp, isCollapsed = false, setIsCollapsed }: SharedSidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const [youtubeChannel, setYoutubeChannel] = useState<any>(null)
    const [showChannelDropdown, setShowChannelDropdown] = useState(false)
    const [showConnectModal, setShowConnectModal] = useState(false)
    const [additionalChannels, setAdditionalChannels] = useState<any[]>([])
    const [isConnecting, setIsConnecting] = useState(false)
    const [activeChannelId, setActiveChannelId] = useState<string | null>(null)
    const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)
    const [showSaveButton, setShowSaveButton] = useState(false)
    const [showAccountCard, setShowAccountCard] = useState(false)
    const { data: session } = useSession()
    const [userCredits, setUserCredits] = useState<number | null>(null)
    const [analyticsData, setAnalyticsData] = useState({
        views: 0,
        subscribers: 0,
        watchTime: 0,
        growth: 0
    })

    // Load YouTube channel data from database
    useEffect(() => {
        if (typeof window === 'undefined') return

        const loadChannelData = async () => {
            try {
                const res = await fetch('/api/channels')
                if (res.ok) {
                    const data = await res.json()
                    if (data?.channels && Array.isArray(data.channels)) {
                        const primary = data.channels.find((ch: any) => ch.is_primary)
                        if (primary) {
                            const channel = {
                                id: primary.channel_id,
                                title: primary.title,
                                description: primary.description,
                                thumbnail: primary.thumbnail,
                                subscriberCount: primary.subscriber_count?.toString() || '0',
                                videoCount: primary.video_count?.toString() || '0',
                                viewCount: primary.view_count?.toString() || '0',
                            }
                            setYoutubeChannel(channel)
                            // set basic counts immediately
                            setAnalyticsData({
                                views: parseInt(channel.viewCount) || 0,
                                subscribers: parseInt(channel.subscriberCount) || 0,
                                watchTime: 0,
                                growth: 18
                            })

                            // Fetch real analytics summary (watch time in minutes -> convert to hours)
                            ;(async () => {
                                try {
                                    const res = await fetch(`/api/youtube/analytics/summary?channelId=${channel.id}`)
                                    if (!res.ok) return
                                    const data = await res.json()
                                    const totalWatchMinutes = Number(data?.summary?.totalWatchMinutes || 0)
                                    setAnalyticsData((prev) => ({
                                        ...prev,
                                        watchTime: Math.round(totalWatchMinutes / 60)
                                    }))
                                } catch (error) {
                                    console.error('Failed to fetch sidebar analytics summary:', error)
                                }
                            })()

                            // Set active channel ID
                            setActiveChannelId(channel.id)

                            // Load additional channels from database
                            const additionalChannels = data.channels
                                .filter((ch: any) => !ch.is_primary)
                                .map((c: any) => ({
                                    id: c.channel_id,
                                    title: c.title,
                                    thumbnail: c.thumbnail,
                                    subscriberCount: c.subscriber_count?.toString() || '0',
                                    videoCount: c.video_count?.toString() || '0',
                                    viewCount: c.view_count?.toString() || '0'
                                }))
                            setAdditionalChannels(additionalChannels)
                            console.log('Loaded channels from DB:', { primary: channel.title, additional: additionalChannels.length })
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to load channel data from database:', error)
            }
        }

        loadChannelData()
    }, [])

    // Load user credits
    useEffect(() => {
        if (typeof window === 'undefined' || !session?.user?.email) return

        const loadCredits = async () => {
            try {
                const res = await fetch('/api/credits')
                if (res.ok) {
                    const data = await res.json()
                    setUserCredits(data.credits)
                }
            } catch (error) {
                console.error('Failed to load credits:', error)
            }
        }

        loadCredits()

        // Listen for credit updates
        const handleCreditUpdate = (event: CustomEvent) => {
            setUserCredits(event.detail.credits)
        }
        window.addEventListener('creditsUpdated', handleCreditUpdate as EventListener)
        
        return () => {
            window.removeEventListener('creditsUpdated', handleCreditUpdate as EventListener)
        }
    }, [session])

    const disconnectChannel = async () => {
        if (!confirm('Disconnect your primary channel? This will remove all connected channels.')) return

        try {
            // Delete all channels from database
            const res = await fetch('/api/channels', { method: 'DELETE' })
            if (res.ok) {
                // Delete all tokens from database (don't store in localStorage)
                try {
                  await fetch('/api/tokens', { 
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ channelId: youtubeChannel?.id })
                  })
                } catch (tokenErr) {
                  console.error('Failed to delete tokens:', tokenErr)
                }

                setYoutubeChannel(null)
                setAdditionalChannels([])
                setShowChannelDropdown(false)
                // Redirect to connect page
                window.location.href = '/connect'
            } else {
                alert('Failed to disconnect channels. Please try again.')
            }
        } catch (error) {
            console.error('Failed to disconnect channel:', error)
            alert('Failed to disconnect channels. Please try again.')
        }
    }

    const connectMoreChannels = () => {
        setShowChannelDropdown(false)
        if (youtubeChannel) {
            // Open modal for additional channel connection
            setShowConnectModal(true)
        } else {
            // First channel connection - go to connect page
            window.location.href = '/connect'
        }
    }

    const startYouTubeAuth = () => {
        setIsConnecting(true)
        // Set return page to indicate this is for additional channels
        if (typeof window !== 'undefined') {
            localStorage.setItem('oauth_return_page', 'sidebar')
        }
        // Create a popup window for YouTube authentication
        const popup = window.open(
            '/api/youtube/auth?popup=true',
            'youtube-auth',
            'width=500,height=600,scrollbars=yes,resizable=yes'
        )
        
        // Listen for messages from the popup
        const messageListener = async (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return
            
            if (event.data.type === 'YOUTUBE_AUTH_SUCCESS') {
                const { channel, token, refreshToken } = event.data
                
                if (typeof window === 'undefined') return
                
                // Check if this channel is already connected (primary or additional)
                const existingChannels = JSON.parse(localStorage.getItem('additional_youtube_channels') || '[]')
                const isPrimaryChannel = youtubeChannel && youtubeChannel.id === channel.id
                const isAlreadyAdditional = existingChannels.some((ch: any) => ch.id === channel.id)
                
                if (isPrimaryChannel || isAlreadyAdditional) {
                    alert(`Channel "${channel.title}" is already connected!`)
                    setIsConnecting(false)
                    popup?.close()
                    return
                }
                
                // Save additional channel (don't replace primary)
                const updatedChannels = [...existingChannels, channel]
                // Clean up temp tokens only - no localStorage for channels
                // Channels will be fetched from Supabase
                
                // Clear the oauth return page to prevent connect page processing
                localStorage.removeItem('oauth_return_page')
                
                // Store token in Supabase for additional channel
                if (token) {
                  try {
                    const tokenRes = await fetch('/api/tokens', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        channelId: channel.id,
                        accessToken: token,
                        refreshToken: refreshToken || null,
                        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
                      })
                    })
                    const tokenData = await tokenRes.json()
                    console.log('✅ Token stored in Supabase for additional channel:', tokenData)
                  } catch (tokenErr) {
                    console.error('❌ Failed to store token:', tokenErr)
                  }
                }
                
                // Store channel in database
                try {
                  const storeRes = await fetch('/api/channels', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      channelId: channel.id,
                      title: channel.title,
                      description: channel.description,
                      thumbnail: channel.thumbnail,
                      subscriberCount: channel.subscriberCount,
                      videoCount: channel.videoCount,
                      viewCount: channel.viewCount,
                      isPrimary: false
                    })
                  })
                  const storeData = await storeRes.json()
                  if (!storeRes.ok) {
                    console.error('❌ API Error:', storeRes.status, storeData)
                    alert('Failed to save channel: ' + (storeData.error || 'Unknown error'))
                  } else {
                    console.log('✅ Channel stored in database:', storeData)
                  }
                } catch (dbErr) {
                  console.error('❌ Failed to store channel in database:', dbErr)
                  alert('Failed to save channel: ' + (dbErr as any).message)
                }
                
                // Update state
                setAdditionalChannels(updatedChannels)
                setIsConnecting(false)
                setShowConnectModal(false)
                popup?.close()
                
                // Show success message
                alert(`Successfully connected ${channel.title} as additional channel!`)
                console.log('Additional channels updated:', updatedChannels)
            } else if (event.data.type === 'YOUTUBE_AUTH_ERROR') {
                setIsConnecting(false)
                alert('Failed to connect channel. Please try again.')
                popup?.close()
            }
        }

        window.addEventListener('message', messageListener)
        
        // Check if popup is closed manually
        const checkClosed = setInterval(() => {
            if (popup?.closed) {
                clearInterval(checkClosed)
                setIsConnecting(false)
                window.removeEventListener('message', messageListener)
            }
        }, 1000)

        // Cleanup after 5 minutes
        setTimeout(() => {
            clearInterval(checkClosed)
            setIsConnecting(false)
            window.removeEventListener('message', messageListener)
            if (popup && !popup.closed) {
                popup.close()
            }
        }, 300000)
    }

    const navLinks = [
        { icon: Home, label: 'Dashboard', href: '/dashboard', id: 'dashboard', badge: null, description: 'Overview of channel analytics & insights' },
        { icon: Sparkles, label: 'SEO Tags', href: '/title-search', id: 'title-search', badge: 'NEW', description: 'Generate SEO-friendly titles, tags & descriptions' },
        { icon: FileText, label: 'Vid-Info', href: '/vid-info', id: 'vid-info', badge: null, description: 'View and edit video metadata' },
        { icon: Trophy, label: 'Start Challenges', href: '/challenge', id: 'challenge', badge: null, description: 'Start your YouTube consistency challenge' },
        { icon: GitCompare, label: 'Compare', href: '/compare', id: 'compare', badge: null, description: 'Compare channel performance' },
    ]

    // Prefetch all navigation routes on mount for instant navigation
    useEffect(() => {
        const prefetchRoutes = async () => {
            // Core navigation routes - prefetch immediately
            const coreRoutes = [
                '/dashboard',
                '/challenge',
                '/compare',
                '/vid-info',
                '/profile',
                '/analytics',
                '/title-search',
                '/description-generator'
            ]
            
            coreRoutes.forEach(route => {
                try {
                    router.prefetch(route)
                } catch (e) {
                    // Ignore prefetch errors
                }
            })
            
            // Secondary routes - prefetch with slight delay
            setTimeout(() => {
                const secondaryRoutes = [
                    '/ai-tools',
                    '/find-tag',
                    '/settings',
                    '/ai-tools/text-to-image',
                    '/ai-tools/image-to-image',
                    '/shorts-generator'
                ]
                
                secondaryRoutes.forEach(route => {
                    try {
                        router.prefetch(route)
                    } catch (e) {
                        // Ignore
                    }
                })
            }, 300)
        }
        
        // Start prefetching immediately for better performance
        prefetchRoutes()
        
        // Also use idle callback for non-critical prefetching
        if ('requestIdleCallback' in window) {
            (window as any).requestIdleCallback(() => {
                // Prefetch less critical routes during idle time
                try {
                    router.prefetch('/achievements')
                    router.prefetch('/pricing')
                } catch (e) {
                    // Ignore
                }
            }, { timeout: 3000 })
        }
    }, [router])

    const formatNumber = (num: number): string => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
        if (num >= 1000) return (num / 1000).toFixed(1) + "K"
        return num.toString()
    }

    // Determine active page from pathname if not provided
    const activePage = activePageProp || pathname.split('/')[1] || 'dashboard'

    // Tooltip for collapsed sidebar icons (includes description)
    const [tooltip, setTooltip] = useState<{label: string, description?: string, top: number, left: number} | null>(null)

    const handleMouseEnter = (e: any, label: string, description?: string) => {
        if (!isCollapsed) return
        if (typeof window === 'undefined' || window.innerWidth < 768) return
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        // position next to the icon and center vertically
        setTooltip({ label, description, top: rect.top + rect.height / 2, left: rect.right + 12 })
    }

    const handleMouseLeave = () => setTooltip(null)

    return (
        <>
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 md:hidden z-30 top-16"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}
            
            {/* Dropdown Overlay */}
            {showChannelDropdown && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowChannelDropdown(false)}
                ></div>
            )}
            
            {/* Modal Overlay */}
            {showConnectModal && (
                <div
                    className="fixed inset-0 bg-black/50 z-50"
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !isConnecting) {
                            setShowConnectModal(false)
                        }
                    }}
                ></div>
            )}

            {/* Pinterest-style Sidebar */}
            <aside
                className={`fixed left-0 top-0 bottom-0 flex flex-col shrink-0 bg-white border-r border-gray-100 shadow-xl transform transition-all duration-300 z-50 h-screen ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                } md:translate-x-0 ${isCollapsed ? 'md:w-20' : 'md:w-64'} w-[80%] max-w-[320px]`}
            >
                {/* Logo Header at Top */}
                <div className={`flex items-center justify-between ${isCollapsed ? 'md:justify-center md:px-2 md:py-4' : 'md:p-4'} p-4 border-b border-gray-100`}>
                    {/* Logo Icon Only (show when collapsed on desktop) */}
                    <div className={`hidden ${isCollapsed ? 'md:flex' : 'md:hidden'} w-10 h-10 rounded-lg bg-gradient-to-br from-gray-800 to-black flex items-center justify-center shadow-md transition-all duration-300 border border-gray-700 cursor-pointer`}>
                      <CrenovaLogo />
                    </div>

                    {/* Logo with Text (show when expanded on desktop and on mobile) */}
                    <div className={`${isCollapsed ? 'md:hidden' : 'md:flex'} flex items-center gap-3 cursor-pointer`}>
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-800 to-black flex items-center justify-center shadow-md transition-all duration-300 border border-gray-700">
                          <CrenovaLogo />
                        </div>
                        <div>
                            <div className="text-base font-bold text-gray-900 tracking-tight">Yt-AI</div>
                            <div className="text-xs text-gray-500 font-medium">Creator Hub</div>
                        </div>
                    </div>

                    {/* Close button for mobile */}
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      aria-label="Close sidebar"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                </div>

                {/* Pinterest-style Navigation Links */}
                <nav className={`flex-1 overflow-y-auto no-scrollbar ${isCollapsed ? 'md:px-1 md:py-3' : 'md:p-3'} p-3 space-y-1`}>
                    {navLinks.map((link) => (
                        <Link
                            key={link.id}
                            href={link.href}
                            prefetch={true}
                            onMouseEnter={(e) => { handleMouseEnter(e, link.label); try { router.prefetch(link.href); } catch(e) {} }}
                            onFocus={(e) => { handleMouseEnter(e, link.label); try { router.prefetch(link.href); } catch(e) {} }}
                            className={`flex items-center gap-3 ${isCollapsed ? 'md:justify-center md:px-2 md:py-2' : 'md:px-3 md:py-2'} px-3 py-2 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-200 focus:ring-offset-1 ${
                                activePage === link.id
                                    ? 'bg-gray-800 text-white shadow-sm'
                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                            }`}
                            title={link.label}
                            onMouseLeave={handleMouseLeave}
                            onBlur={handleMouseLeave}
                        >
                            <div className={`w-10 h-10 flex items-center justify-center rounded-lg flex-shrink-0 transition-all ${activePage === link.id ? 'bg-gray-800 text-white shadow-md' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                                <link.icon className="w-5 h-5" />
                            </div>
                            <span className={`flex-1 text-sm font-medium ${isCollapsed ? 'md:hidden' : ''}`}>{link.label}</span>
                            <span className={`${!isCollapsed && link.badge ? '' : 'hidden'} px-2 py-0.5 text-xs font-bold rounded-full ${
                                activePage === link.id ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-300'
                            }`}>
                                {link.badge}
                            </span>
                        </Link>
                    ))}
                </nav>

                {/* Pinterest-style Account / User Card Toggle */}
                <div className="p-3 border-t border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowAccountCard(!showAccountCard)}
                      className={`flex items-center w-full gap-3 p-3 rounded-xl transition-colors ${isCollapsed ? 'justify-center' : ''} hover:bg-gray-800`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center shadow-sm text-white font-bold flex-shrink-0">
                        <span className="text-sm font-semibold">{(session?.user?.name || session?.user?.email || 'U')[0]?.toUpperCase()}</span>
                      </div>
                      <div className={`flex-1 text-left ${isCollapsed ? 'md:hidden' : ''}`}>
                        <p className="text-sm font-semibold text-gray-900 truncate">{session?.user?.name || session?.user?.email || 'Account'}</p>
                        <p className="text-xs text-gray-600 font-medium">View profile</p>
                      </div>
                    </button>
                  </div>

                </div>

                {/* Pinterest-style Collapse Button at Bottom */}
                <div className="hidden md:block p-3 border-t border-gray-100 bg-gray-50">
                  <button
                    onClick={() => setIsCollapsed?.(!isCollapsed)}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl hover:bg-gray-800 transition-colors text-gray-300 font-medium"
                    aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  >
                    {isCollapsed ? (
                      <>
                        <ChevronsRight className="w-5 h-5 text-red-600" />
                      </>
                    ) : (
                      <>
                        <span className="text-sm text-red-700 font-medium">Collapse</span>
                        <ChevronsLeft className="w-5 h-5 text-red-600" />
                      </>
                    )}
                  </button>
                </div>

                {/* Tooltip for collapsed icons */}
                {tooltip && (
                    <div style={{ position: 'fixed', top: tooltip.top, left: tooltip.left, transform: 'translateY(-50%)' }} className="z-50">
                        <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap">
                            <div className="font-semibold text-xs">{tooltip.label}</div>
                        </div>
                    </div>
                )}
            </aside>

            {/* Account Card - Outside Sidebar */}
            {showAccountCard && (
                <>
                  {/* Backdrop overlay */}
                  <div 
                    className="fixed inset-0 bg-black/20 z-40"
                    onClick={() => setShowAccountCard(false)}
                  />
                  
                  {/* Pinterest-style Account Card */}
                  <div 
                    className={`fixed bottom-4 ${isCollapsed ? 'left-24' : 'left-72'} z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300`}
                    style={{ maxHeight: 'calc(100vh - 2rem)' }}
                  >
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-b from-gray-800 to-black border-b border-gray-700 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-white font-semibold text-lg shadow-md">
                        { (session?.user?.name || session?.user?.email || 'U')[0]?.toUpperCase() }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{session?.user?.name || 'Creator'}</p>
                        <p className="text-xs text-gray-500 truncate">{session?.user?.email || '—'}</p>
                      </div>
                      <button 
                        onClick={() => setShowAccountCard(false)}
                        className="p-1 hover:bg-gray-700 rounded-full transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>

                    {/* Pinterest-style Credits Display */}
                    <div className="px-4 py-3 bg-gradient-to-r from-gray-800 to-black border-b border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center shadow-sm">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-medium">Credits</p>
                            <p className="text-lg font-bold text-gray-900">
                              {userCredits !== null ? userCredits : '...'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => { setShowAccountCard(false); router.push('/pricing') }}
                          className="px-3 py-1.5 bg-gradient-to-r from-gray-800 to-black hover:from-gray-700 hover:to-gray-900 text-white text-xs font-medium rounded-lg shadow-sm transition-all"
                        >
                          Get More
                        </button>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="p-3 space-y-1">
                      <Link href="/profile" onClick={() => setShowAccountCard(false)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-800 transition-colors text-left">
                        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.73 6.879 1.98M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        <span className="text-sm font-medium text-gray-900">Profile</span>
                      </Link>

                      <Link href="/settings" onClick={() => setShowAccountCard(false)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-colors text-left">
                        <Settings className="w-5 h-5 text-gray-700" />
                        <span className="text-sm font-medium text-gray-900">Settings</span>
                      </Link>

                      <button onClick={() => { signOut({ redirect: false }); setShowAccountCard(false); window.location.href = '/' }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-colors text-left text-red-600">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M17 16l4-4m0 0l-4-4m4 4H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <span className="text-sm font-medium">Sign out</span>
                      </button>
                    </div>
                  </div>
                </>
            )}

            {/* Connect Modal */}
            {showConnectModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200">
                        <div className="p-6">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Channel Management</h2>
                                    <p className="text-sm text-gray-600 mt-1">Switch channels or connect new ones</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowConnectModal(false)
                                        setSelectedChannelId(null)
                                        setShowSaveButton(false)
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    disabled={isConnecting}
                                >
                                    <X className="text-gray-500" />
                                </button>
                            </div>

                            {/* Active Channel Status */}
                            <div className="mb-6 p-3 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <div className="flex items-center gap-3">
                                        {(activeChannelId === youtubeChannel?.id ? youtubeChannel : additionalChannels.find(ch => ch.id === activeChannelId))?.thumbnail && (
                                            <img
                                                src={(activeChannelId === youtubeChannel?.id ? youtubeChannel : additionalChannels.find(ch => ch.id === activeChannelId))?.thumbnail}
                                                alt={(activeChannelId === youtubeChannel?.id ? youtubeChannel : additionalChannels.find(ch => ch.id === activeChannelId))?.title}
                                                className="w-8 h-8 rounded-full border-2 border-white shadow-lg"
                                            />
                                        )}
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">
                                                Currently Active: <span className="text-green-600">
                                                    {(activeChannelId === youtubeChannel?.id ? youtubeChannel?.title : additionalChannels.find(ch => ch.id === activeChannelId)?.title) || 'None'}
                                                </span>
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                {activeChannelId === youtubeChannel?.id ? 'Primary' : 'Additional'} • All actions are performed on this channel
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Connected Channels List */}
                            {(youtubeChannel || additionalChannels.length > 0) && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Switch Channel</h3>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {/* Primary Channel */}
                                        {youtubeChannel && (
                                            <button
                                                onClick={() => {
                                                    setSelectedChannelId(youtubeChannel.id)
                                                    setShowSaveButton(youtubeChannel.id !== activeChannelId)
                                                }}
                                                className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                                                    selectedChannelId === youtubeChannel.id
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : activeChannelId === youtubeChannel.id
                                                        ? 'border-green-500 bg-green-50'
                                                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={youtubeChannel.thumbnail}
                                                        alt={youtubeChannel.title}
                                                        className="w-10 h-10 rounded-full"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-gray-900 truncate">{youtubeChannel.title}</p>
                                                        <p className={`text-xs font-bold ${
                                                            activeChannelId === youtubeChannel.id
                                                                ? 'text-green-600'
                                                                : selectedChannelId === youtubeChannel.id
                                                                ? 'text-blue-600'
                                                                : 'text-gray-600'
                                                        }`}>
                                                            🔵 Primary Channel {activeChannelId === youtubeChannel.id ? '• Active' : selectedChannelId === youtubeChannel.id ? '• Selected' : ''}
                                                        </p>
                                                    </div>
                                                    {selectedChannelId === youtubeChannel.id && (
                                                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                    {activeChannelId === youtubeChannel.id && selectedChannelId !== youtubeChannel.id && (
                                                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                                            <div className="w-2 h-2 bg-white rounded-full"></div>
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        )}

                                        {/* Additional Channels */}
                                        {additionalChannels.map((channel) => (
                                            <button
                                                key={channel.id}
                                                onClick={() => {
                                                    setSelectedChannelId(channel.id)
                                                    setShowSaveButton(channel.id !== activeChannelId)
                                                }}
                                                className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                                                    selectedChannelId === channel.id
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : activeChannelId === channel.id
                                                        ? 'border-green-500 bg-green-50'
                                                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={channel.thumbnail}
                                                        alt={channel.title}
                                                        className="w-10 h-10 rounded-full"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-gray-900 truncate">{channel.title}</p>
                                                        <p className={`text-xs font-bold ${
                                                            activeChannelId === channel.id
                                                                ? 'text-green-600'
                                                                : selectedChannelId === channel.id
                                                                ? 'text-blue-600'
                                                                : 'text-gray-600'
                                                        }`}>
                                                            ⚪ Additional Channel {activeChannelId === channel.id ? '• Active' : selectedChannelId === channel.id ? '• Selected' : ''}
                                                        </p>
                                                    </div>
                                                    {selectedChannelId === channel.id && (
                                                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                    {activeChannelId === channel.id && selectedChannelId !== channel.id && (
                                                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                                            <div className="w-2 h-2 bg-white rounded-full"></div>
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Save Button (shown only when switching channels) */}
                            {showSaveButton && selectedChannelId && (
                                <div className="mb-6 p-4 bg-white/50 border-2 border-blue-300 rounded-xl shadow-sm">
                                    <div className="text-center">
                                        <div className="mb-3">
                                            <p className="font-bold text-blue-900 text-sm mb-1">Ready to switch channels?</p>
                                            <p className="text-xs text-blue-700">
                                                Switch to: <span className="font-semibold">
                                                    {selectedChannelId === youtubeChannel?.id 
                                                        ? `${youtubeChannel?.title} (Primary)` 
                                                        : `${additionalChannels.find(ch => ch.id === selectedChannelId)?.title} (Additional)`
                                                    }
                                                </span>
                                            </p>
                                            <p className="text-xs text-blue-600 mt-1">
                                                ⚡ This will change the active channel across all pages instantly
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedChannelId(null)
                                                    setShowSaveButton(false)
                                                }}
                                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-3 rounded-lg transition-colors text-sm"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (selectedChannelId) {
                                                        // Update active channel (this maintains primary/additional structure)
                                                        setActiveChannelId(selectedChannelId)
                                                        localStorage.setItem('active_youtube_channel_id', selectedChannelId)
                                                        
                                                        // Dispatch real-time event for other components
                                                        window.dispatchEvent(new CustomEvent('channelSwitched', {
                                                            detail: { 
                                                                channelId: selectedChannelId, 
                                                                timestamp: Date.now(),
                                                                isPrimary: selectedChannelId === youtubeChannel?.id
                                                            }
                                                        }))
                                                        
                                                        // Reset states
                                                        setSelectedChannelId(null)
                                                        setShowSaveButton(false)
                                                        setShowConnectModal(false)
                                                        
                                                        // Show success message with clear indication
                                                        const channelName = selectedChannelId === youtubeChannel?.id 
                                                            ? youtubeChannel?.title 
                                                            : additionalChannels.find(ch => ch.id === selectedChannelId)?.title
                                                        const channelType = selectedChannelId === youtubeChannel?.id ? 'Primary' : 'Additional'
                                                        alert(`✅ Successfully switched to ${channelName} (${channelType} Channel)!\n\nThis channel is now active across all pages.`)
                                                    }
                                                }}
                                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg transition-colors duration-200 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                                            >
                                                ✨ Save & Switch
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Connect New Channel Section */}
                            <div className="border-t pt-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Connect New Channel</h3>
                                <div className="space-y-4">
                                <button
                                    onClick={startYouTubeAuth}
                                    disabled={isConnecting}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-400"
                                >
                                    {isConnecting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Connecting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M23.498 6.186a2.999 2.999 0 0 0-2.109-2.109C19.647 3.5 12 3.5 12 3.5s-7.647 0-9.389.577A2.999 2.999 0 0 0 .502 6.186C.002 7.929.002 12.002.002 12.002s0 4.073.5 5.816a2.999 2.999 0 0 0 2.109 2.109C4.353 20.5 12 20.5 12 20.5s7.647 0 9.389-.573a2.999 2.999 0 0 0 2.109-2.109c.5-1.743.5-5.816.5-5.816s0-4.073-.5-5.816z"/>
                                                <path fill="white" d="M9.748 15.348L15.5 12l-5.752-3.348v6.696z"/>
                                            </svg>
                                            <span>Connect YouTube Channel</span>
                                        </>
                                    )}
                                </button>
                                
                                    <button
                                        onClick={() => {
                                            setShowConnectModal(false)
                                            setSelectedChannelId(null)
                                            setShowSaveButton(false)
                                        }}
                                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg transition-colors"
                                        disabled={isConnecting}
                                    >
                                        Cancel
                                    </button>
                                </div>

                                {/* Info */}
                                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                <div className="flex gap-2">
                                    <svg className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="text-xs text-blue-800">
                                        <p className="font-medium mb-1">Multiple Channel Benefits:</p>
                                        <ul className="space-y-1 text-blue-700">
                                            <li>• Manage multiple channels from one dashboard</li>
                                            <li>• Switch between channels easily</li>
                                            <li>• Upload content to any connected channel</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}