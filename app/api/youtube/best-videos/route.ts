import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getValidAccessTokenForChannel } from '@/lib/youtubeAuth'

function getStatusFromGoogleError(err: any): number | undefined {
  // googleapis uses gaxios/axios under the hood; it may include response.status
  if (!err) return undefined
  const status = err?.code || err?.response?.status || err?.status
  const num = typeof status === 'string' ? Number(status) : status
  return Number.isFinite(num) ? num : undefined
}

async function fetchUploadsPlaylistId(youtube: any, channelId: string): Promise<string | null> {
  const res = await youtube.channels.list({ part: ['contentDetails'], id: [channelId] })
  const uploads = res?.data?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads
  return uploads || null
}

export async function GET(req: NextRequest) {
  try {
    // Validate input
    const { searchParams } = new URL(req.url)
    const channelId = searchParams.get('channelId')

    if (!channelId) {
      return NextResponse.json({ error: 'Channel ID is required' }, { status: 400 })
    }

    console.log('[best-videos] Processing channelId:', channelId)

    // Try to get session for authenticated user
    const session: any = await getServerSession(authOptions as any)
    let channelAccessToken: string | null = null
    let userAuthenticated = false

    if (session?.user?.email) {
      userAuthenticated = true
      const supabase = createServerSupabaseClient()
      const { data: userRow } = await supabase
        .from('users')
        .select('id,email')
        .eq('email', session.user.email)
        .limit(1)
        .single()

      if (userRow?.id) {
        // Resolve token for channel (refresh if necessary)
        channelAccessToken = await getValidAccessTokenForChannel(channelId)
      }
    }

    // Initialize YouTube client - use API key as fallback
    let youtube: any = null

    if (channelAccessToken) {
      const oauth2Client = new google.auth.OAuth2(
        process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
        process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET
      )
      oauth2Client.setCredentials({ access_token: channelAccessToken })
      youtube = google.youtube({ version: 'v3', auth: oauth2Client })
    } else if (process.env.YOUTUBE_API_KEY) {
      youtube = google.youtube({ version: 'v3', auth: process.env.YOUTUBE_API_KEY })
    } else {
      return NextResponse.json({ error: 'No access token or API key available to fetch videos.' }, { status: 401 })
    }

    if (!youtube) {
      return NextResponse.json({ error: 'Failed to initialize YouTube client' }, { status: 500 })
    }

    try {
      // 1) Get uploads playlist id via channels.list
      let uploadsPlaylistId: string | null = null

      try {
        uploadsPlaylistId = await fetchUploadsPlaylistId(youtube, channelId)
      } catch (err: any) {
        const status = getStatusFromGoogleError(err)
        console.error('[best-videos] channels.list error for channelId:', channelId, err)
        if (status === 401) return NextResponse.json({ error: 'Authentication error when resolving channel uploads playlist' }, { status: 401 })
        if (status === 404) return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
        return NextResponse.json({ error: 'Failed to resolve uploads playlist' }, { status: 500 })
      }

      if (!uploadsPlaylistId) {
        // No uploads playlist present (channel may be invalid or empty). Return empty response instead of 404
        console.warn('[best-videos] No uploads playlist found for channelId:', channelId)
        return NextResponse.json({ videos: [], totalFound: 0, message: 'No uploads playlist found for this channel' }, { status: 200 })
      }

      console.log('[best-videos] Found uploads playlist:', uploadsPlaylistId)

      // 2) Fetch playlist items with pagination
      const maxPages = 10
      let pageToken: string | undefined = undefined
      let pageCount = 0
      const allPlaylistItems: any[] = []

      do {
        try {
          const plRes = await youtube.playlistItems.list({ part: ['snippet'], playlistId: uploadsPlaylistId, maxResults: 50, pageToken })
          const items = plRes?.data?.items || []
          allPlaylistItems.push(...items)
          pageToken = plRes?.data?.nextPageToken as string | undefined
          pageCount += 1
        } catch (err: any) {
          const status = getStatusFromGoogleError(err)
          console.error('[best-videos] playlistItems.list error:', err)
          if (status === 401) return NextResponse.json({ error: 'Authentication error when fetching playlist items' }, { status: 401 })
          if (status === 404) return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
          return NextResponse.json({ error: 'Failed fetching playlist items' }, { status: 500 })
        }
      } while (pageToken && pageCount < maxPages)

      if (allPlaylistItems.length === 0) {
        return NextResponse.json({ videos: [] })
      }

      // Map playlist items to video IDs
      const videoIds = allPlaylistItems.map(item => item.snippet?.resourceId?.videoId).filter(Boolean) as string[]
      if (videoIds.length === 0) return NextResponse.json({ videos: [] })

      // 3) Fetch full video details in batches
      const batchSize = 50
      const allVideoDetails: any[] = []

      for (let i = 0; i < videoIds.length; i += batchSize) {
        const batch = videoIds.slice(i, i + batchSize)
        try {
          const videosResponse = await youtube.videos.list({ part: ['snippet', 'statistics', 'contentDetails'], id: batch })
          if (videosResponse?.data?.items) allVideoDetails.push(...videosResponse.data.items)
        } catch (err: any) {
          const status = getStatusFromGoogleError(err)
          console.error('[best-videos] videos.list error:', err)
          if (status === 401) return NextResponse.json({ error: 'Authentication error when fetching video details' }, { status: 401 })
          return NextResponse.json({ error: 'Failed to fetch video details' }, { status: 500 })
        }
      }

      const videos = allVideoDetails
        .map(video => ({
          id: video.id,
          title: video.snippet?.title,
          description: video.snippet?.description,
          publishedAt: video.snippet?.publishedAt,
          thumbnail: video.snippet?.thumbnails?.medium?.url || video.snippet?.thumbnails?.default?.url || video.snippet?.thumbnails?.high?.url,
          viewCount: parseInt(video.statistics?.viewCount || '0'),
          likeCount: parseInt(video.statistics?.likeCount || '0'),
          commentCount: parseInt(video.statistics?.commentCount || '0'),
          categoryId: video.snippet?.categoryId,
          tags: video.snippet?.tags || []
        }))
        // Sort by view count in descending order (most viewed first)
        .sort((a, b) => b.viewCount - a.viewCount)

      return NextResponse.json({ videos, totalFound: videos.length })
    } catch (err: any) {
      console.error('[best-videos] unexpected error:', err)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  } catch (err: any) {
    console.error('[best-videos] outer error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
