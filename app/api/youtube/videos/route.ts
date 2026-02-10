import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from 'next-auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getUserTokens, getValidAccessToken, getValidAccessTokenForChannel } from '@/lib/googleTokens'

// This route reads runtime request details (e.g. `req.url`) so it must run dynamically.
export const dynamic = 'force-dynamic'

const CHANNEL_ID_RE = /^UC[a-zA-Z0-9_-]{22}$/

function normalizeYouTubeChannelInput(input: string): { kind: 'id', value: string } | { kind: 'handle', value: string } {
  const raw = String(input || '').trim()
  if (!raw) return { kind: 'handle', value: '' }

  let clean = raw.split('?')[0].split('#')[0].trim().replace(/\/+$/, '')
  if (CHANNEL_ID_RE.test(clean)) return { kind: 'id', value: clean }
  if (clean.startsWith('@')) return { kind: 'handle', value: clean.slice(1) }

  const looksLikeYouTubeUrl = /youtube\.com\//i.test(clean) || /youtu\.be\//i.test(clean)
  if (looksLikeYouTubeUrl && !/^https?:\/\//i.test(clean)) {
    clean = `https://${clean}`
  }

  try {
    if (/^https?:\/\//i.test(clean)) {
      const url = new URL(clean)
      const host = url.hostname.replace(/^www\./i, '').toLowerCase()
      const path = url.pathname.replace(/\/+$/, '')
      if (host.endsWith('youtube.com')) {
        const parts = path.split('/').filter(Boolean)
        if (parts[0] === 'channel' && parts[1] && CHANNEL_ID_RE.test(parts[1])) {
          return { kind: 'id', value: parts[1] }
        }
        if (parts[0]?.startsWith('@')) {
          return { kind: 'handle', value: parts[0].slice(1) }
        }
        if ((parts[0] === 'c' || parts[0] === 'user') && parts[1]) {
          return { kind: 'handle', value: parts[1] }
        }
      }
    }
  } catch {
    // fall through
  }

  if (/^[a-zA-Z0-9_.-]+$/.test(clean)) return { kind: 'handle', value: clean }
  return { kind: 'handle', value: clean }
}

async function resolveHandleToChannelId(apiKey: string, handle: string): Promise<string | null> {
  const h = String(handle || '').trim().replace(/^@/, '')
  if (!h) return null
  const queries = [ `@${h}`, h ]
  for (const q of queries) {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(q)}&key=${apiKey}&maxResults=1`
    )
    if (!res.ok) continue
    const data: any = await res.json().catch(() => null)
    const channelId = data?.items?.[0]?.id?.channelId
    if (channelId && CHANNEL_ID_RE.test(channelId)) return channelId
  }
  return null
}

export async function GET(req: NextRequest) {
  try {
    console.log('[YouTube Videos] Route executed at runtime:', new Date().toISOString())
    const { searchParams } = new URL(req.url)
    let channelId = searchParams.get("channelId")
    const mineParam = String(searchParams.get('mine') || 'false').toLowerCase() === 'true'
    // Default to 20 results, allow 1..50 per YouTube API
    const maxResultsRaw = searchParams.get("maxResults") || "20"
    let maxResults = parseInt(maxResultsRaw, 10)
    if (isNaN(maxResults) || maxResults < 1) maxResults = 20
    // YouTube API limits playlistItems and search maxResults to 50
    if (maxResults > 50) maxResults = 50
    const fetchAll = String(searchParams.get('fetchAll') || 'false').toLowerCase() === 'true'
    // Optional pageToken to fetch a specific page for 'load more' UX
    const pageToken = String(searchParams.get('pageToken') || '') || undefined
    // Page cap for fetchAll to prevent unbounded loops; configurable via query param
    const pageCapRaw = parseInt(String(searchParams.get('pageCap') || '10'), 10)
    const pageCap = isNaN(pageCapRaw) ? 10 : pageCapRaw
    // If caller passed a channel URL/handle, resolve it to a channel ID first.
    if (channelId && !mineParam) {
      const apiKey = process.env.YOUTUBE_API_KEY
      const normalized = normalizeYouTubeChannelInput(channelId)
      if (normalized.kind === 'id') {
        channelId = normalized.value
      } else if (apiKey) {
        const resolved = await resolveHandleToChannelId(apiKey, normalized.value)
        if (!resolved) {
          return NextResponse.json({ error: 'Channel not found. Please check the URL/handle and try again.' }, { status: 404 })
        }
        channelId = resolved
      }
    }

    console.log('[YouTube Videos] params:', { channelId, maxResults, fetchAll, pageToken, pageCap })
    const initialMax = fetchAll ? 50 : maxResults

    if (!channelId && !mineParam) {
      return NextResponse.json({ error: "Channel ID is required unless using mine=true" }, { status: 400 })
    }

    // Resolve an access token server-side for the requested channel (works across refresh)
    let accessToken: string | null = null
    let usingApiKey = false

    if (channelId) {
      accessToken = await getValidAccessTokenForChannel(channelId)
    }

    // If this is a 'mine=true' request, try session-based token
    if (!accessToken && mineParam) {
      const session = await getServerSession()
      if (session?.user?.email) {
        const supabase = createServerSupabaseClient()
        const { data: userRow } = await supabase
          .from('users')
          .select('id,email')
          .eq('email', session.user.email)
          .limit(1)
          .single()
        if (userRow?.id) {
          accessToken = await getValidAccessToken(userRow.id)
        }
      }
    }

    // If still no access token, try API key (public videos only)
    if (!accessToken && process.env.YOUTUBE_API_KEY) {
      usingApiKey = true
    }

    if (!accessToken && !usingApiKey) {
      return NextResponse.json({ error: 'No access token available. Please reconnect Google.' }, { status: 401 })
    }

    // If caller requested authenticated user's videos (mine=true), get user's channel first, then fetch from uploads playlist
    if (mineParam) {

      // First, get the authenticated user's channel to find their uploads playlist
      const channelResponse = await fetch('https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })

      if (!channelResponse.ok) {
        const err = await channelResponse.json().catch(() => ({}))
        return NextResponse.json({ error: 'Failed to fetch user channel', details: err }, { status: channelResponse.status })
      }
      
      const channelData = await channelResponse.json()
      const uploadsPlaylistId = channelData?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads
      
      if (!uploadsPlaylistId) {
        return NextResponse.json({ error: 'Could not find uploads playlist for user channel' }, { status: 404 })
      }

      // Now fetch videos from the uploads playlist
      const pageParam = pageToken ? `&pageToken=${pageToken}` : ''
      const initialUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${initialMax}${pageParam}`
      const videosResponse = await fetch(initialUrl, { headers: { Authorization: `Bearer ${accessToken}` } })
      if (!videosResponse.ok) {
        const err = await videosResponse.json().catch(() => ({}))
        return NextResponse.json({ error: 'Failed to fetch videos from uploads playlist', details: err }, { status: videosResponse.status })
      }
      let videosData = await videosResponse.json()

      if (fetchAll) {
        const items: any[] = []
        if (Array.isArray(videosData.items)) items.push(...videosData.items)
        let nextPageToken = videosData.nextPageToken
        let pagesFetched = 0
        while (nextPageToken && pagesFetched < pageCap) {
          const pagedUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50&pageToken=${nextPageToken}`
          const pagedRes = await fetch(pagedUrl, { headers: { Authorization: `Bearer ${accessToken}` } })
          if (!pagedRes.ok) break
          const pagedData = await pagedRes.json()
          if (Array.isArray(pagedData.items)) items.push(...pagedData.items)
          nextPageToken = pagedData.nextPageToken
          pagesFetched += 1
        }
        videosData = { items, nextPageToken: null, pageInfo: { totalResults: videosData.pageInfo?.totalResults || items.length } }
      }

      // Now we need to fetch detailed video information since playlistItems only gives us basic snippet data
      const itemsWithId = (videosData.items || []).filter((item: any) => item.snippet?.resourceId?.videoId)
      const videoIds = itemsWithId.map((item: any) => item.snippet.resourceId.videoId)
      const uniqueIds = Array.from(new Set(videoIds))
      
      if (uniqueIds.length > 0) {
        // Fetch detailed video statistics and content details in batches of 50
        const statsResponses: any[] = []
        for (let i = 0; i < uniqueIds.length; i += 50) {
          const batch = uniqueIds.slice(i, i + 50).join(',')
          const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails,snippet,status&id=${batch}${usingApiKey ? `&key=${process.env.YOUTUBE_API_KEY}` : ''}`
          const statsResponse = await fetch(statsUrl, usingApiKey ? {} : { headers: { Authorization: `Bearer ${accessToken}` } })
          if (statsResponse.ok) {
            const statsData = await statsResponse.json()
            statsResponses.push(...(statsData.items || []))
          }
        }
        
        // Map playlist items with their detailed statistics
        const videosWithStats = itemsWithId.map((playlistItem: any) => {
          const videoId = playlistItem.snippet.resourceId.videoId
          const videoDetails = statsResponses.find((stat: any) => stat.id === videoId)
          const snippet = videoDetails?.snippet || playlistItem.snippet || {}
          
          return {
            id: videoId,
            title: snippet.title || '',
            thumbnail: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
            viewCount: parseInt(videoDetails?.statistics?.viewCount || '0'),
            likeCount: parseInt(videoDetails?.statistics?.likeCount || '0'),
            commentCount: parseInt(videoDetails?.statistics?.commentCount || '0'),
            publishedAt: snippet.publishedAt || '',
            tags: videoDetails?.snippet?.tags || [],
            duration: videoDetails?.contentDetails?.duration || null,
            localizations: videoDetails?.snippet?.localizations || null,
            description: videoDetails?.snippet?.description || '',
            privacyStatus: videoDetails?.status?.privacyStatus || null,
          }
        })

        const totalResults = videosData.pageInfo?.totalResults || videosWithStats.length
        return NextResponse.json({ success: true, videos: videosWithStats, totalResults, nextPageToken: videosData.nextPageToken || null, maxResults, fetchAll, newAccessToken: (accessToken && accessToken) || null })
      } else {
        return NextResponse.json({ success: true, videos: [], totalResults: 0, nextPageToken: null, maxResults, fetchAll, newAccessToken: (accessToken && accessToken) || null })
      }
    }

    // Determine uploads playlist for the given channel and fetch up to maxResults
    // First, retrieve the channel's contentDetails to find the uploads playlist
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}${usingApiKey ? `&key=${process.env.YOUTUBE_API_KEY}` : ''}`
    const channelRes = await fetch(channelUrl, usingApiKey ? {} : { headers: { Authorization: `Bearer ${accessToken}` } })
    if (!channelRes.ok) {
      const err = await channelRes.json().catch(() => ({}))
      return NextResponse.json({ error: 'Failed to fetch channel details', details: err }, { status: channelRes.status })
    }
    const channelData = await channelRes.json()
    const uploadsPlaylistId = channelData?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads
    console.log('[YouTube Videos] uploadsPlaylistId:', uploadsPlaylistId)

    let videosResponse
    if (uploadsPlaylistId) {
      // If fetchAll requested, we'll handle pagination below; otherwise, request the requested maxResults
      const pageParam = pageToken ? `&pageToken=${pageToken}` : ''
      const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${initialMax}${pageParam}${usingApiKey ? `&key=${process.env.YOUTUBE_API_KEY}` : ''}`
      videosResponse = await fetch(playlistUrl, usingApiKey ? {} : { headers: { Authorization: `Bearer ${accessToken}` } })
    } else {
      // No uploads playlist found — per project policy we do NOT use search.list. Return an error.
      return NextResponse.json({ error: 'Could not derive uploads playlist for this channel. Reconnect channel or provide a channel with public uploads.' }, { status: 404 })
    }

    if (!videosResponse.ok) {
      const error = await videosResponse.json()
      return NextResponse.json(
        { error: "Failed to fetch videos", details: error },
        { status: videosResponse.status }
      )
    }

    let videosData = await videosResponse.json()
    // Determine pages fetched for logging and pagination metadata
    let pagesFetched = 0
    // If the caller requested fetchAll, and the API supports pagination, fetch all pages up to a reasonable cap
    if (fetchAll) {
      const items: any[] = []
      // If initial request succeeded, include items
      if (Array.isArray(videosData.items)) items.push(...videosData.items)
      // Determine nextPageToken from playlist/search response
      let nextPageToken = videosData.nextPageToken
      // Cap to avoid unbounded fetches; maximum permitted pages default-> 10 (50 * 10 = 500 videos)
      const pageCap = 10
      while (nextPageToken && pagesFetched < pageCap) {
        const pagedUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50&pageToken=${nextPageToken}${usingApiKey ? `&key=${process.env.YOUTUBE_API_KEY}` : ''}`
        const pagedRes = await fetch(pagedUrl, usingApiKey ? {} : { headers: { Authorization: `Bearer ${accessToken}` } })
        if (!pagedRes.ok) break
        const pagedData = await pagedRes.json()
        if (Array.isArray(pagedData.items)) items.push(...pagedData.items)
        nextPageToken = pagedData.nextPageToken
        pagesFetched += 1
      }
      // Replace videosData with aggregated items; preserve totalResults if we can
      const totalResultsFromPageInfo = videosData.pageInfo?.totalResults || items.length
      videosData = { items, nextPageToken: null, pageInfo: { totalResults: totalResultsFromPageInfo } }
      console.log('[YouTube Videos] fetchAll aggregated items length:', items.length, 'pagesFetched:', pagesFetched)
    }
    // pagesFetched variable will be 0 outside fetchAll or number of pages fetched if fetchAll

    // Fetch detailed statistics and content details for each video
    // playlistItems return snippet.resourceId.videoId; search returns id.videoId
    // Filter out items that don't have a resolvable video ID (e.g., deleted/private entries)
    const itemsWithId = (videosData.items || []).filter((item: any) => {
      const vid = item.id?.videoId || item.snippet?.resourceId?.videoId
      return !!vid
    })
    const videoIds = itemsWithId.map((item: any) => (item.id?.videoId || item.snippet?.resourceId?.videoId)).filter(Boolean)
    const uniqueIds = Array.from(new Set(videoIds))
    
    if (uniqueIds.length) {
      // Fetch statistics and content details
      // videos API supports up to 50 ids per request — batch as needed
      const statsResponses: any[] = []
      for (let i = 0; i < uniqueIds.length; i += 50) {
        const batch = uniqueIds.slice(i, i + 50).join(',')
        const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails,snippet,status&id=${batch}${usingApiKey ? `&key=${process.env.YOUTUBE_API_KEY}` : ''}`
        const statsResponse = await fetch(statsUrl, usingApiKey ? {} : { headers: { Authorization: `Bearer ${accessToken}` } })
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          statsResponses.push(...(statsData.items || []))
        }
      }
      
      if (statsResponses.length > 0) {
        const statsData = { items: statsResponses }
        // Merge video data with statistics
        const videosWithStats = itemsWithId.map((video: any) => {
          const vid = video.id?.videoId || video.snippet?.resourceId?.videoId
          const stats = statsData.items.find((stat: any) => stat.id === vid)
          const snippet = video.snippet || stats?.snippet || {}
          return {
            id: vid,
            title: snippet.title || '',
            thumbnail: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
            viewCount: parseInt(stats?.statistics?.viewCount || '0', 10),
            likeCount: parseInt(stats?.statistics?.likeCount || '0', 10),
            commentCount: parseInt(stats?.statistics?.commentCount || '0', 10),
            publishedAt: snippet.publishedAt || '',
            tags: stats?.snippet?.tags || [],
            duration: stats?.contentDetails?.duration || null,
            localizations: stats?.snippet?.localizations || null,
            description: stats?.snippet?.description || snippet.description || '',
            privacyStatus: stats?.status?.privacyStatus || null,
          }
        })
        
        // include nextPageToken if present in original videosData so the frontend can continue pagination
        const totalResults = videosData.pageInfo?.totalResults || videosWithStats.length
        console.log('[YouTube Videos] returning', videosWithStats.length, 'of', totalResults, 'videos (maxResults:', maxResults, 'fetchAll:', fetchAll, 'pagesFetched:', pagesFetched || 0, ')')
        return NextResponse.json({
          success: true,
          videos: videosWithStats,
          totalResults,
          nextPageToken: videosData.nextPageToken || null,
          maxResults: maxResults,
          fetchAll: fetchAll
        })
      }
    }

    // Return videos without detailed statistics if stats fetch failed
    const videos = itemsWithId.map((video: any) => {
      const vid = video.id?.videoId || video.snippet?.resourceId?.videoId
      const snippet = video.snippet || {}
      return {
        id: vid,
        title: snippet.title || '',
        thumbnail: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        publishedAt: snippet.publishedAt || '',
        tags: [],
        description: snippet.description || '',
        privacyStatus: null,
      }
    })

    const count = Array.isArray(videos) ? videos.length : 0
    console.log('[YouTube Videos] Returning videos count:', count)
    const totalResults = videosData.pageInfo?.totalResults || videos.length
    console.log('[YouTube Videos] returning', videos.length, 'of', totalResults, 'videos (maxResults:', maxResults, 'fetchAll:', fetchAll, 'pagesFetched:', pagesFetched || 0, ')')
    return NextResponse.json({
      success: true,
      videos,
      totalResults,
      nextPageToken: videosData.nextPageToken || null,
      maxResults: maxResults,
      fetchAll: fetchAll
    })
  } catch (error: any) {
    console.error("YouTube API Error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}