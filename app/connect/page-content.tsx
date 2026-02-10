"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Play, ChevronRight, Lock, Loader2, Youtube, CheckCircle, User, LogOut, RefreshCw, AlertCircle, X, Sparkles } from "lucide-react"
import { Header } from "@/components/header"
import Image from "next/image"
import { savePrimaryChannelToLocalStorage, saveAllChannelsToLocalStorage } from '@/lib/channelStorage'

interface YouTubeChannel {
  id: string
  title: string
  description: string
  customUrl?: string
  thumbnail: string
  subscriberCount: string
  videoCount: string
  viewCount: string
  publishedAt: string
}

interface RecentActivity {
  id: string
  type: 'connect' | 'refresh' | 'disconnect' | 'oauth'
  channelName: string
  channelId: string
  timestamp: number
  details?: string
}

export default function ConnectPage() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(false)
  const [youtubeChannel, setYoutubeChannel] = useState<YouTubeChannel | null>(null)
  const [youtubeToken, setYoutubeToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // New states for the updated flow
  const [isStartingAuth, setIsStartingAuth] = useState(false)
  const [isLoadingChannelData, setIsLoadingChannelData] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisDone, setAnalysisDone] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const analysisInterval = useRef<number | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [showRedirectLoader, setShowRedirectLoader] = useState(false)
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [additionalChannels, setAdditionalChannels] = useState<YouTubeChannel[]>([])
  const [availableChannels, setAvailableChannels] = useState<YouTubeChannel[]>([])
  const [showChannelSelector, setShowChannelSelector] = useState(false)
  const [isSelectingChannel, setIsSelectingChannel] = useState(false)

  // Load all data from localStorage on mount
  useEffect(() => {
    loadMainChannel()
    loadRecentActivities()
    loadAdditionalChannels()
    cleanupTempData()
  }, [])

  // Auto-redirect to dashboard if already connected
  useEffect(() => {
    // Redirect only when explicitly requested (isRedirecting becomes true)
    if (status === 'authenticated' && youtubeChannel && isRedirecting) {
      router.push('/dashboard')
    }
  }, [status, youtubeChannel, isRedirecting, router])

  const loadMainChannel = async () => {
    try {
      // Fetch from database
      const res = await fetch('/api/channels')
      if (res.ok) {
        const data = await res.json()
        if (data?.channels && Array.isArray(data.channels)) {
          // Save all channels to localStorage for instant future access
          saveAllChannelsToLocalStorage(data.channels)
          
          const primary = data.channels.find((ch: any) => ch.is_primary)
          if (primary) {
            // Also save primary channel specifically
            savePrimaryChannelToLocalStorage(primary)
            
            const main = {
              id: primary.channel_id,
              title: primary.title,
              description: primary.description,
              thumbnail: primary.thumbnail,
              subscriberCount: primary.subscriber_count?.toString() || '0',
              videoCount: primary.video_count?.toString() || '0',
              viewCount: primary.view_count?.toString() || '0',
            }
            setYoutubeChannel(main as YouTubeChannel)
            console.log('✅ Loaded main channel from database and cached:', main.title)
          }
        }
      }

      // Also load the token (keep in localStorage for security)
      const token = localStorage.getItem('youtube_access_token')
      if (token) {
        setYoutubeToken(token)
      }
    } catch (error) {
      console.error('Failed to load main channel:', error)
    }
  }

  const cleanupTempData = () => {
    // Debug: Check what's in localStorage (only tokens and activities)
    console.log('=== localStorage Debug ===')
    console.log('Access token:', localStorage.getItem('youtube_access_token') ? 'EXISTS' : 'MISSING')
    console.log('Temp token:', localStorage.getItem('temp_youtube_access_token') ? 'EXISTS (SHOULD BE CLEANED)' : 'NONE')
    console.log('Recent activities:', localStorage.getItem('youtube_recent_activities') ? 'EXISTS' : 'NONE')
    console.log('========================')

    // Clean up any orphaned temp tokens (older than 10 minutes)
    const tempTokenTime = localStorage.getItem('temp_token_timestamp')
    if (tempTokenTime) {
      const age = Date.now() - parseInt(tempTokenTime)
      if (age > 10 * 60 * 1000) { // 10 minutes
        localStorage.removeItem('temp_youtube_access_token')
        localStorage.removeItem('temp_youtube_refresh_token')
        localStorage.removeItem('temp_token_timestamp')
        console.log('✅ Cleaned up expired temp tokens')
      } else {
        console.log('⚠️ Temp tokens exist but are still valid (less than 10 minutes old)')
      }
    }

    // Force cleanup of temp data if no timestamp exists but temp tokens do
    if (!tempTokenTime && localStorage.getItem('temp_youtube_access_token')) {
      console.log('⚠️ Found temp tokens without timestamp - cleaning up')
      localStorage.removeItem('temp_youtube_access_token')
      localStorage.removeItem('temp_youtube_refresh_token')
    }
  }

  const loadRecentActivities = () => {
    try {
      const stored = localStorage.getItem('youtube_recent_activities')
      if (stored) {
        const activities = JSON.parse(stored)
        // Sort by timestamp descending (newest first) and take last 5
        setRecentActivities(activities.sort((a: RecentActivity, b: RecentActivity) => b.timestamp - a.timestamp).slice(0, 5))
      }
    } catch (error) {
      console.error('Failed to load recent activities:', error)
    }
  }

  const loadAdditionalChannels = async () => {
    try {
      // Fetch from server
      try {
        const res = await fetch('/api/channels')
        if (res.ok) {
          const data = await res.json()
          if (data?.channels && Array.isArray(data.channels)) {
            // Map to expected structure (no localStorage storage)
            const channels = data.channels.map((c: any) => ({
              id: c.channel_id,
              title: c.title,
              description: c.description,
              thumbnail: c.thumbnail,
              subscriberCount: c.subscriber_count?.toString() || '0',
              videoCount: c.video_count?.toString() || '0',
              viewCount: c.view_count?.toString() || '0',
            }))
            setAdditionalChannels(channels)

            // If there is a primary channel returned by server, make sure main is set
            const primary = data.channels.find((ch: any) => ch.is_primary)
            if (primary) {
              const main = {
                id: primary.channel_id,
                title: primary.title,
                description: primary.description,
                thumbnail: primary.thumbnail,
                subscriberCount: primary.subscriber_count?.toString() || '0',
                videoCount: primary.video_count?.toString() || '0',
                viewCount: primary.view_count?.toString() || '0',
              }
              setYoutubeChannel(main as YouTubeChannel)
            }

            return
          }
        }
      } catch (err) {
        console.warn('Could not fetch channels from server', err)
      }

      // No localStorage fallback - only use database
    } catch (error) {
      console.error('Failed to load additional channels:', error)
    }
  }

  const addActivity = (type: RecentActivity['type'], channelName: string, channelId: string, details?: string) => {
    try {
      const stored = localStorage.getItem('youtube_recent_activities')
      const activities: RecentActivity[] = stored ? JSON.parse(stored) : []

      const newActivity: RecentActivity = {
        id: Date.now().toString(),
        type,
        channelName,
        channelId,
        timestamp: Date.now(),
        details
      }

      activities.unshift(newActivity) // Add to beginning

      // Keep only last 20 activities
      const trimmed = activities.slice(0, 20)

      localStorage.setItem('youtube_recent_activities', JSON.stringify(trimmed))
      loadRecentActivities()
    } catch (error) {
      console.error('Failed to save activity:', error)
    }
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/signup"
    }

    // Check for error parameter
    const errorParam = searchParams.get("error")
    if (errorParam) {
      let errorMessage = "Failed to connect to YouTube. Please try again."

      switch (errorParam) {
        case "access_denied":
          errorMessage = "Access denied. Please grant permission to connect your YouTube channel."
          break
        case "invalid_client":
          errorMessage = "Invalid client configuration. Please contact support."
          break
        case "missing_client_id":
          errorMessage = "Missing client ID. Please contact support."
          break
        case "missing_credentials":
          errorMessage = "Missing credentials. Please contact support."
          break
        case "token_failed":
          errorMessage = "Failed to obtain access token. Please try again."
          break
        case "auth_failed":
          errorMessage = "Authentication failed. Please try again."
          break
        default:
          errorMessage = errorParam || errorMessage
      }

      setError(errorMessage)
    }

    // Check if YouTube token is in URL
    const token = searchParams.get("youtube_token")
    const refreshToken = searchParams.get("refresh_token")

    if (token) {
      console.log("Received YouTube token from OAuth flow - showing channel selector")
      setYoutubeToken(token)
      setIsAuthLoading(false)

      // Store token temporarily
      if (refreshToken) {
        sessionStorage.setItem("temp_refresh_token", refreshToken)
      }
      sessionStorage.setItem("temp_access_token", token)

      // Fetch available channels to show selector
      fetchAvailableChannels(token)
    } else {
      // Try to load from localStorage
      const storedToken = localStorage.getItem("youtube_access_token")
      if (storedToken) {
        console.log("Using stored YouTube token")
        setYoutubeToken(storedToken)
        fetchYouTubeChannel(storedToken)
      }
    }
  }, [status, searchParams])

  // Auto-start analysis the first time a channel is detected in this session
  useEffect(() => {
    try {
      if (youtubeChannel && !analysisDone && !isAnalyzing && !isSelectingChannel && !isLoadingChannelData) {
        const analysisStarted = sessionStorage.getItem('analysis_started')
        if (!analysisStarted) {
          console.log('✅ Triggering auto-analysis for channel:', youtubeChannel.title)
          // Mark as started to prevent duplicate triggers
          sessionStorage.setItem('analysis_started', '1')
          // Give a beat for the UI to settle then start (3 second animation)
          setTimeout(() => startAnalysis(3000), 800)
        }
      }
    } catch (e) { 
      console.error('Error in auto-analysis:', e)
    }
  }, [youtubeChannel, analysisDone, isAnalyzing, isSelectingChannel, isLoadingChannelData])

  // When analysis completes, briefly show success then auto-redirect to dashboard
  useEffect(() => {
    if (analysisDone && youtubeChannel) {
      console.log('✅ Analysis complete! Showing connected page before redirect...')
      // Show the connected page state for 2 seconds, then start redirect animation
      const redirectTimer = setTimeout(() => {
        console.log('📊 Showing redirect animation loader...')
        setShowRedirectLoader(true)
      }, 2000)
      
      return () => clearTimeout(redirectTimer)
    }
  }, [analysisDone, youtubeChannel])

  const fetchAvailableChannels = async (accessToken: string) => {
    try {
      console.log("Fetching available channels from account...")
      const response = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true&maxResults=25`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.items && data.items.length > 0) {
          const channels: YouTubeChannel[] = data.items.map((channel: any) => ({
            id: channel.id,
            title: channel.snippet.title,
            description: channel.snippet.description,
            thumbnail: channel.snippet.thumbnails?.default?.url || channel.snippet.thumbnails?.medium?.url,
            subscriberCount: channel.statistics?.subscriberCount || '0',
            videoCount: channel.statistics?.videoCount || '0',
            viewCount: channel.statistics?.viewCount || '0',
            publishedAt: channel.snippet.publishedAt
          }))
          
          setAvailableChannels(channels)
          
          // If only one channel, auto-select it
          if (channels.length === 1) {
            console.log("Single channel found, auto-selecting:", channels[0].title)
            await selectChannel(channels[0], accessToken)
          } else {
            // Show selector if multiple channels
            setShowChannelSelector(true)
          }
          return channels
        }
      }
    } catch (error) {
      console.error('Failed to fetch available channels:', error)
      setError('Failed to fetch your channels. Please try again.')
    }
  }

  const selectChannel = async (channel: YouTubeChannel, accessToken: string) => {
    try {
      setIsSelectingChannel(true)
      setShowChannelSelector(false)
      setIsLoadingChannelData(true)
      
      console.log("Selected channel:", channel.title)
      
      // Save token temporarily
      sessionStorage.setItem("temp_access_token", accessToken)
      
      // Save channel to localStorage for instant access
      try {
        localStorage.setItem('youtube_access_token', accessToken)
        localStorage.setItem('youtube_channel', JSON.stringify(channel))
      } catch (e) {
        console.warn('Could not persist channel locally', e)
      }

      // Save to database
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
            isPrimary: true
          })
        })
        const storeData = await storeRes.json()
        console.log('✅ Channel saved to database:', storeData)
      } catch (dbErr) {
        console.error('❌ Failed to store channel in DB:', dbErr)
      }

      addActivity('connect', channel.title, channel.id, 'Channel selected and connected via OAuth')
      
      // Set channel and token - this will trigger the auto-analysis useEffect
      setYoutubeToken(accessToken)
      setYoutubeChannel(channel)
      
      // Clear states after a delay
      setTimeout(() => {
        setIsLoadingChannelData(false)
        setIsSelectingChannel(false)
      }, 1000)
      
    } catch (error) {
      console.error('Failed to select channel:', error)
      setError('Failed to select channel. Please try again.')
      setIsSelectingChannel(false)
      setIsLoadingChannelData(false)
    }
  }

  const fetchYouTubeChannel = async (accessToken: string) => {
    try {
      setIsLoading(true)
      setError(null)
      console.log("Fetching YouTube channel with token:", accessToken.substring(0, 10) + "...")

      const response = await fetch(`/api/youtube/channel?access_token=${accessToken}`)
      const data = await response.json()
      console.log("Channel API response:", data)

      if (data.success && data.channel) {
        const newChannel = data.channel

        // Check where the OAuth was initiated from
        const returnPage = localStorage.getItem("oauth_return_page")

        if (returnPage === "content" || returnPage === "sidebar" || returnPage === "dashboard") {
          // Content/sidebar/dashboard page - add to additional channels array (don't replace main)
          const existingMainChannel = localStorage.getItem("youtube_channel")

          if (existingMainChannel) {
            const mainChannel = JSON.parse(existingMainChannel)

            // Get existing additional channels
            const additionalChannelsStr = localStorage.getItem("additional_youtube_channels")
            const additionalChannels = additionalChannelsStr ? JSON.parse(additionalChannelsStr) : []

            // Check if this is the same as main channel
            const isMainChannel = mainChannel.id === newChannel.id
            // Check if already in additional channels
            const alreadyAdded = additionalChannels.find((ch: YouTubeChannel) => ch.id === newChannel.id)

            if (!isMainChannel && !alreadyAdded) {
              // Add new channel to additional channels
              additionalChannels.push(newChannel)

              console.log("Added new channel with its own token:", newChannel.title)
              addActivity('connect', newChannel.title, newChannel.id, 'Additional channel connected via OAuth')
              
              // Get temp tokens from sessionStorage
              const tempToken = sessionStorage.getItem("temp_access_token")
              const tempRefreshToken = sessionStorage.getItem("temp_refresh_token")
              
              // Store token in Supabase for additional channel
              if (tempToken) {
                try {
                  const tokenRes = await fetch('/api/tokens', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      channelId: newChannel.id,
                      accessToken: tempToken,
                      refreshToken: tempRefreshToken || null,
                      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
                    })
                  })
                  const tokenData = await tokenRes.json()
                  console.log('✅ Token stored in Supabase for additional channel:', tokenData)

                    // Trigger on-demand sync so videos appear immediately
                    try {
                      const syncRes = await fetch(`/api/videos?channelId=${encodeURIComponent(newChannel.id)}`, { method: 'POST' })
                      const syncData = await syncRes.json()
                      console.log('🔄 On-demand sync for additional channel:', syncData)
                    } catch (syncErr) {
                      console.warn('⚠️ On-demand sync failed for additional channel:', syncErr)
                    }

                  // Persist channel to DB for this user as an additional channel
                  try {
                    const storeRes = await fetch('/api/channels', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        channelId: newChannel.id,
                        title: newChannel.title,
                        description: newChannel.description,
                        thumbnail: newChannel.thumbnail,
                        subscriberCount: newChannel.subscriberCount,
                        videoCount: newChannel.videoCount,
                        viewCount: newChannel.viewCount,
                        isPrimary: false
                      })
                    });
                    const storeData = await storeRes.json();
                    console.log('✅ DB store additional channel response:', storeData);

                    // Store analytics immediately for additional channel
                    try {
                      const analyticsRes = await fetch('/api/analytics', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          channelId: newChannel.id,
                          totalViews: parseInt(newChannel.viewCount) || 0,
                          totalSubscribers: parseInt(newChannel.subscriberCount) || 0,
                          totalWatchTimeHours: 0
                        })
                      });
                      const analyticsData = await analyticsRes.json();
                      console.log('✅ Analytics stored for additional channel:', analyticsData);
                    } catch (analyticsErr) {
                      console.error('⚠️ Failed to store analytics for additional channel:', analyticsErr);
                    }
                  } catch (dbErr) {
                    console.error('❌ Failed to store additional channel in DB:', dbErr);
                  }
                } catch (tokenErr) {
                  console.error('❌ Failed to store token for additional channel:', tokenErr);
                }
                
                // Clean up temp tokens
                sessionStorage.removeItem("temp_access_token");
                sessionStorage.removeItem("temp_refresh_token");
              }

            } else if (isMainChannel) {
              console.log("Channel is already the main channel:", newChannel.title);
              // Clean up temp tokens
              sessionStorage.removeItem("temp_access_token");
              sessionStorage.removeItem("temp_refresh_token");
            } else {
              console.log("Channel already added:", newChannel.title);
              // Clean up temp tokens
              sessionStorage.removeItem("temp_access_token");
              sessionStorage.removeItem("temp_refresh_token");
            }
          } else {
            // No main channel yet, set this as main
            setYoutubeChannel(newChannel);
            
            // Get temp tokens from sessionStorage
            const tempToken = sessionStorage.getItem("temp_access_token");
            const tempRefreshToken = sessionStorage.getItem("temp_refresh_token");

            console.log("Set as main channel:", newChannel.title);

            // Store token in Supabase for primary channel
            if (tempToken) {
              try {
                const tokenRes = await fetch('/api/tokens', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    channelId: newChannel.id,
                    accessToken: tempToken,
                    refreshToken: tempRefreshToken || null,
                    expiresAt: new Date(Date.now() + 3600 * 1000).toISOString() // 1 hour expiry
                  })
                });
                const tokenData = await tokenRes.json();
                console.log('✅ Token stored in Supabase:', tokenData);

                // Trigger on-demand sync so videos appear immediately
                try {
                  const syncRes = await fetch(`/api/videos?channelId=${encodeURIComponent(newChannel.id)}`, { method: 'POST' });
                  const syncData = await syncRes.json();
                  console.log('🔄 On-demand sync for main channel:', syncData);
                } catch (syncErr) {
                  console.warn('⚠️ On-demand sync failed for main channel:', syncErr);
                }
              } catch (tokenErr) {
                console.error('❌ Failed to store token:', tokenErr);
              }

              // Clean up temp tokens
              sessionStorage.removeItem("temp_access_token");
              sessionStorage.removeItem("temp_refresh_token");
            }

            // Persist channel to DB as primary
            try {
              const storeRes = await fetch('/api/channels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  channelId: newChannel.id,
                  title: newChannel.title,
                  description: newChannel.description,
                  thumbnail: newChannel.thumbnail,
                  subscriberCount: newChannel.subscriberCount,
                  videoCount: newChannel.videoCount,
                  viewCount: newChannel.viewCount,
                  isPrimary: true
                })
              });
              const storeData = await storeRes.json();
              console.log('✅ DB store primary channel response:', storeData);
            } catch (dbErr) {
              console.error('❌ Failed to store primary channel in DB:', dbErr);
            }
          }
        } else {
          // Dashboard or first time - set as main channel
          setYoutubeChannel(newChannel);
          console.log("Successfully fetched main channel:", newChannel.title);
          addActivity('connect', newChannel.title, newChannel.id, 'Main channel connected successfully');

          // Get temp tokens from sessionStorage
          const tempToken = sessionStorage.getItem("temp_access_token");
          const tempRefreshToken = sessionStorage.getItem("temp_refresh_token");

          // Store token in Supabase for main channel
          if (tempToken) {
            try {
              const tokenRes = await fetch('/api/tokens', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  channelId: newChannel.id,
                  accessToken: tempToken,
                  refreshToken: tempRefreshToken || null,
                  expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
                })
              });
              const tokenData = await tokenRes.json();
              console.log('✅ Token stored in Supabase for main channel:', tokenData);
            } catch (tokenErr) {
              console.error('❌ Failed to store token for main channel:', tokenErr);
            }

            // Clean up temp tokens
            sessionStorage.removeItem("temp_access_token");
            sessionStorage.removeItem("temp_refresh_token");
          }

          // Save to database as primary channel
          try {
            const storeRes = await fetch('/api/channels', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                channelId: newChannel.id,
                title: newChannel.title,
                description: newChannel.description,
                thumbnail: newChannel.thumbnail,
                subscriberCount: newChannel.subscriberCount,
                videoCount: newChannel.videoCount,
                viewCount: newChannel.viewCount,
                isPrimary: true
              })
            })
            const storeData = await storeRes.json()
            console.log('✅ DB store primary channel response:', storeData)

            // Store analytics immediately when channel is connected
            try {
              const analyticsRes = await fetch('/api/analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  channelId: newChannel.id,
                  totalViews: parseInt(newChannel.viewCount) || 0,
                  totalSubscribers: parseInt(newChannel.subscriberCount) || 0,
                  totalWatchTimeHours: 0
                })
              });
              const analyticsData = await analyticsRes.json();
              console.log('✅ Analytics stored for channel:', analyticsData);
            } catch (analyticsErr) {
              console.error('⚠️ Failed to store analytics:', analyticsErr);
            }
          } catch (dbErr) {
            console.error('❌ Failed to store primary channel in DB:', dbErr);
          }
        }

        // Load additional channels and activities after update
        loadAdditionalChannels();
        loadRecentActivities();

        // Clear oauth return page marker to avoid accidental additional-channel logic later
        try { localStorage.removeItem('oauth_return_page') } catch (e) { /* ignore */ }

        // New flow: save token + channel, then show analyzing screen instead of immediate redirect
        try {
          // Persist token and channel locally so UI survives reloads
          localStorage.setItem('youtube_access_token', accessToken)
          
          // Use the channel storage utility for optimized caching
          savePrimaryChannelToLocalStorage(newChannel)
          console.log('✅ Channel cached to localStorage for instant future access')
        } catch (e) {
          console.warn('Could not persist token/channel locally', e)
        }

        setIsAnalyzing(true);
        setAnalysisDone(false);

        // Simulate analysis work for 3 seconds, then mark done
        setTimeout(() => {
          setIsAnalyzing(false);
          setAnalysisDone(true);
        }, 3000);
      } else {
        console.error("Failed to fetch channel:", data.error);
        setError(data.error || "Failed to fetch channel data");
        // Clear stored tokens if they're invalid
        localStorage.removeItem("youtube_access_token");
        localStorage.removeItem("youtube_refresh_token");
        localStorage.removeItem("youtube_channel");
      }
    } catch (error) {
      console.error("Error fetching YouTube channel:", error);
      setError("Network error. Please try again.");
      // Clear stored tokens on error
      localStorage.removeItem("youtube_access_token");
      localStorage.removeItem("youtube_refresh_token");
      localStorage.removeItem("youtube_channel");
    } finally {
      setIsLoading(false);
    }
  }

  const handleConnectWithGoogle = () => {
    // Trigger the start animation to replace IQ logo with user's logo
    setIsStartingAuth(true);
    setIsAuthLoading(true);
    setError(null);
    console.log("Initiating Google OAuth flow - showing start animation");

    // Use same-tab redirect for the connect page (shows Google account selection in current tab)
    setTimeout(() => {
      setIsStartingAuth(false)
      setIsAuthLoading(true)
      // Mark return page so server knows this was from connect page (main flow)
      localStorage.setItem('oauth_return_page', 'connect')

      // Redirect current tab to OAuth (no popup) so Google account/email selection opens in same tab
      window.location.href = '/api/youtube/auth'
    }, 550)
  }
  // Start the analysis flow with a visual progress and proper cancellation support
  const startAnalysis = (duration = 3000) => {
    // Prevent multiple intervals
    if (analysisInterval.current) {
      clearInterval(analysisInterval.current)
      analysisInterval.current = null
    }

    setIsAnalyzing(true)
    setAnalysisDone(false)
    setAnalysisProgress(0)

    const start = Date.now()
    analysisInterval.current = window.setInterval(() => {
      const elapsed = Date.now() - start
      const pct = Math.min(100, Math.round((elapsed / duration) * 100))
      setAnalysisProgress(pct)

      if (pct >= 100) {
        if (analysisInterval.current) { clearInterval(analysisInterval.current); analysisInterval.current = null }
        setIsAnalyzing(false)
        setAnalysisDone(true)
        setAnalysisProgress(100)
      }
    }, 150)
  }

  // Skip analysis and move to completed state immediately
  const skipAnalysis = () => {
    if (analysisInterval.current) { clearInterval(analysisInterval.current); analysisInterval.current = null }
    setAnalysisProgress(100)
    setIsAnalyzing(false)
    setAnalysisDone(true)
    // Run redirect shortly after skipping
    setTimeout(() => {
      setIsRedirecting(true)
    }, 600)
  }

  // Cleanup interval on unmount (avoid leaking timers)
  useEffect(() => {
    return () => {
      if (analysisInterval.current) { clearInterval(analysisInterval.current); analysisInterval.current = null }
    }
  }, [])

  const handleRefreshChannel = async () => {
    if (!youtubeToken) {
      setError("No access token found. Please reconnect your YouTube channel.")
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      console.log("Refreshing YouTube channel data")

      // Fetch channel data with current access token
      await fetchYouTubeChannel(youtubeToken)

      if (youtubeChannel) {
        addActivity('refresh', youtubeChannel.title, youtubeChannel.id, 'Channel data refreshed')
      }
    } catch (error) {
      console.error("Refresh error:", error)
      setError("Failed to refresh channel data. Please try reconnecting.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = async () => {
    console.log("Disconnecting YouTube channel")

    if (youtubeChannel) {
      addActivity('disconnect', youtubeChannel.title, youtubeChannel.id, 'Channel disconnected')
    }

    // Try to delete from DB as well
    try {
      if (youtubeChannel) {
        await fetch(`/api/channels?channelId=${encodeURIComponent(youtubeChannel.id)}`, { method: 'DELETE' })
        console.log('Requested channel deletion on server')
      }
    } catch (err) {
      console.warn('Failed to delete channel on server', err)
    }

    // Clear all YouTube related data
    localStorage.removeItem("youtube_access_token")
    localStorage.removeItem("youtube_refresh_token")
    localStorage.removeItem("youtube_channel")
    setYoutubeToken(null)
    setYoutubeChannel(null)
  }

  const formatNumber = (num: string | number): string => {
    const n = typeof num === "string" ? parseInt(num) : num
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M"
    if (n >= 1000) return (n / 1000).toFixed(1) + "K"
    return n.toString()
  }

  return (
    <div>
      {/* Use shared Header component */}
      <Header />

      <div>
        <main className={`flex-1 pt-20 md:pt-24 pb-20 bg-linear-to-b from-white to-gray-50 min-h-screen`}>
          
          {/* Channel Selector Modal */}
          {showChannelSelector && !youtubeChannel && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Select Your Channel</h2>
                <p className="text-gray-600 mb-6">Choose which YouTube channel you'd like to connect:</p>
                
                <div className="space-y-3">
                  {availableChannels.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => selectChannel(channel, youtubeToken!)}
                      disabled={isSelectingChannel}
                      className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-4">
                        <img 
                          src={channel.thumbnail} 
                          alt={channel.title}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{channel.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {formatNumber(channel.subscriberCount)} subscribers • {formatNumber(channel.videoCount)} videos
                          </p>
                        </div>
                        {isSelectingChannel && (
                          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="min-h-[70vh] flex items-center justify-center px-6 py-16">
            <div className="relative w-full max-w-2xl">
              {/* Loading State - Show while loading channel data or authenticating */}
              {(isAuthLoading || isLoadingChannelData) && !youtubeChannel ? (
                <div className="flex flex-col items-center justify-center gap-8 py-20 fade-in">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-linear-to-br from-blue-100 to-blue-50 border-4 border-blue-400 flex items-center justify-center shadow-xl shadow-blue-200/50 glow-pulse">
                      <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
                    </div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-400 border-r-blue-300 pulse-ring"></div>
                  </div>
                  <div className="text-center max-w-md slide-up">
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">Loading Your Channel...</h2>
                    <p className="text-gray-600 text-base mb-2">Fetching your channel data</p>
                    <p className="text-gray-500 text-sm">Please wait while we prepare your insights</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Main Content */}
                  {!youtubeChannel && (
                    <div className="text-center mb-12">
                      <h1 className="text-4xl sm:text-5xl md:text-5xl font-bold text-gray-900 mb-4">Connect Your YouTube Channel</h1>
                      <p className="text-gray-600 text-base sm:text-lg">Follow the steps below to connect and analyze your channel performance.</p>
                    </div>
                  )}

                  <style>{`
                    @keyframes pulse-scale { 0% { transform: scale(0.6); opacity: 0 } 60% { transform: scale(1.08); opacity: 1 } 100% { transform: scale(1); opacity: 1 } }
                    .pulse-scale { transform-origin: center; animation: pulse-scale 850ms cubic-bezier(.2,.9,.3,1) forwards; }
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                    
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                    .fade-in { animation: fadeIn 600ms ease-out forwards; }
                    
                    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                    .slide-up { animation: slideUp 600ms ease-out forwards; }
                    
                    @keyframes glowPulse { 0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.5); } 50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.8); } }
                    .glow-pulse { animation: glowPulse 2s ease-in-out infinite; }
                    
                    @keyframes glowGreen { 0%, 100% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.5); } 50% { box-shadow: 0 0 40px rgba(34, 197, 94, 0.8); } }
                    .glow-green { animation: glowGreen 2s ease-in-out infinite; }
                    
                    @keyframes shimmer { 0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; } }
                    .shimmer { animation: shimmer 2s infinite; background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%); background-size: 1000px 100%; }
                    
                    @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
                    .bounce-gentle { animation: bounce 2s ease-in-out infinite; }
                    
                    @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
                    .scale-in { animation: scaleIn 500ms ease-out forwards; }
                    
                    @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
                    .float { animation: float 3s ease-in-out infinite; }
                    
                    @keyframes pulse-ring { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.3); opacity: 0; } }
                    .pulse-ring { animation: pulse-ring 2s ease-out infinite; position: absolute; }
                  `}</style>

                  {/* Step 1: Connect - Single Circle */}
                  <div className="flex flex-col items-center gap-6 mb-12 slide-up">
                    {/* Loading Circle with Channel Transition */}
                    <div className={`w-32 h-32 rounded-full bg-white border-4 flex items-center justify-center shrink-0 transition-all duration-500 ${
                      youtubeChannel 
                        ? 'border-green-400 shadow-xl shadow-green-200 pulse-scale glow-green' 
                        : 'border-gray-300 hover:border-blue-400 glow-pulse'
                    }`}>
                      {isLoadingChannelData ? (
                        <Loader2 className="w-14 h-14 text-blue-600 animate-spin" />
                      ) : youtubeChannel ? (
                        <img src={youtubeChannel.thumbnail} alt={youtubeChannel.title} className="w-28 h-28 rounded-full object-cover" />
                      ) : (
                        <Youtube className="w-12 h-12 text-red-600" />
                      )}
                    </div>
                    
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {isLoadingChannelData ? 'Loading...' : youtubeChannel ? youtubeChannel.title : 'Connect Your Account'}
                      </h2>
                      <p className="text-gray-600 text-sm mb-4">
                        {isLoadingChannelData ? 'Fetching your channel data' : youtubeChannel ? '✓ Account connected' : 'Connect your YouTube channel to get started'}
                      </p>
                    </div>

                    {/* Connect & Skip Buttons */}
                    {!youtubeChannel && !isLoadingChannelData && (
                      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <button 
                          onClick={handleConnectWithGoogle}
                          disabled={isAuthLoading}
                          className="px-8 py-3 rounded-lg font-semibold text-white bg-linear-to-r from-blue-600 to-blue-700 hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isAuthLoading ? 'Connecting...' : 'Connect'}
                        </button>
                        <button 
                          onClick={() => router.push('/dashboard')}
                          className="px-8 py-3 rounded-lg font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-all"
                        >
                          Skip
                        </button>
                      </div>
                    )}
                    
                    {youtubeChannel && (
                      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <button 
                          onClick={() => {
                            setShowRedirectLoader(true)
                            setTimeout(() => router.push('/dashboard'), 2000)
                          }}
                          className="px-8 py-3 rounded-lg font-semibold text-white bg-linear-to-r from-purple-600 to-purple-700 hover:shadow-lg transition-all"
                        >
                          Go to Dashboard
                        </button>
                        <button 
                          onClick={handleDisconnect}
                          className="px-8 py-3 rounded-lg font-semibold text-white bg-linear-to-r from-red-600 to-red-700 hover:shadow-lg transition-all"
                        >
                          Disconnect
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Channel Stats (when connected) */}
              {youtubeChannel && !isLoadingChannelData && (
                <div className="mt-12 pt-8 border-t border-gray-200">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{formatNumber(youtubeChannel.subscriberCount)}</div>
                      <div className="text-xs text-gray-600 mt-1">Subscribers</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{formatNumber(youtubeChannel.videoCount)}</div>
                      <div className="text-xs text-gray-600 mt-1">Videos</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{formatNumber(youtubeChannel.viewCount)}</div>
                      <div className="text-xs text-gray-600 mt-1">Total Views</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Simple loading modal shown when redirecting to dashboard */}
          {showRedirectLoader && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <p className="text-lg font-semibold text-gray-800">Loading...</p>
                <p className="text-sm text-gray-500">Redirecting to Dashboard</p>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}