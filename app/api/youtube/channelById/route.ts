import { NextRequest, NextResponse } from "next/server"

// Uses req.url for query params - must run dynamically
export const dynamic = 'force-dynamic'

const CHANNEL_ID_RE = /^UC[a-zA-Z0-9_-]{22}$/

function normalizeYouTubeChannelInput(input: string): { kind: 'id', value: string } | { kind: 'handle', value: string } {
  const raw = String(input || '').trim()
  if (!raw) return { kind: 'handle', value: '' }

  // Strip query params/hash and trailing slashes
  let clean = raw.split('?')[0].split('#')[0].trim().replace(/\/+$/, '')

  if (CHANNEL_ID_RE.test(clean)) return { kind: 'id', value: clean }

  // If it starts with @, treat as handle
  if (clean.startsWith('@')) return { kind: 'handle', value: clean.slice(1) }

  // Attempt URL parsing (add scheme if missing)
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

  // If it looks like a simple username/handle, treat as handle.
  if (/^[a-zA-Z0-9_.-]+$/.test(clean)) return { kind: 'handle', value: clean }

  // Fallback: return as handle-like; downstream resolution will fail cleanly.
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
    console.log('[YouTube ChannelById] Route executed at runtime:', new Date().toISOString())
    const { searchParams } = new URL(req.url)
    const channelIdParam = searchParams.get("channelId")

    if (!channelIdParam) {
      return NextResponse.json({ error: "Channel ID is required" }, { status: 400 })
    }

    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "YouTube API key not configured" }, { status: 500 })
    }

    const normalized = normalizeYouTubeChannelInput(channelIdParam)
    const resolvedChannelId = normalized.kind === 'id'
      ? normalized.value
      : await resolveHandleToChannelId(apiKey, normalized.value)

    if (!resolvedChannelId) {
      return NextResponse.json(
        { error: 'Channel not found. Please check the URL/handle and try again.' },
        { status: 404 }
      )
    }

    // Fetch channel data from YouTube API. Include brandingSettings to get channel keywords.
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails,brandingSettings&id=${encodeURIComponent(resolvedChannelId)}&key=${apiKey}`
    )

    if (!channelResponse.ok) {
      const error = await channelResponse.json()
      return NextResponse.json(
        { error: "Failed to fetch channel data", details: error },
        { status: channelResponse.status }
      )
    }

    const channelData = await channelResponse.json()

    if (!channelData.items || channelData.items.length === 0) {
      return NextResponse.json({ error: "No channel found" }, { status: 404 })
    }

    const channel = channelData.items[0]

    // Extract additional fields safely
    const defaultLanguage = channel.snippet?.defaultLanguage || null
    const localized = channel.snippet?.localized || null
    const country = channel.snippet?.country || null
    const branding = channel.brandingSettings?.channel || {}
    const channelKeywords = branding.keywords || null

    return NextResponse.json({
      success: true,
      channel: {
        id: channel.id,
        title: channel.snippet.title,
        description: channel.snippet.description,
        customUrl: channel.snippet.customUrl,
        thumbnail: channel.snippet.thumbnails?.high?.url || channel.snippet.thumbnails?.default?.url,
        subscriberCount: channel.statistics.subscriberCount,
        videoCount: channel.statistics.videoCount,
        viewCount: channel.statistics.viewCount,
        publishedAt: channel.snippet.publishedAt,
        // New fields
        defaultLanguage,
        localized,
        country,
        keywords: channelKeywords,
      },
    })
  } catch (error: any) {
    console.error("YouTube API Error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}