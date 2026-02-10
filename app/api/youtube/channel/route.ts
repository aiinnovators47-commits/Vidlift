import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// Uses session + req.url - must run dynamically
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    console.log('[YouTube Channel] Route executed at runtime:', new Date().toISOString())
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const accessToken = searchParams.get("access_token")
    const channelId = searchParams.get("channel_id")

    // If we have a channel ID, fetch using API key (for public channels)
    if (channelId) {
      const apiKey = process.env.YOUTUBE_API_KEY
      if (!apiKey) {
        return NextResponse.json({ error: "YouTube API key not configured" }, { status: 500 })
      }

      const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${channelId}&key=${apiKey}`
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
          // Additional metadata
          country: channel.snippet.country || null,
          keywords: channel.snippet.keywords || [],
          defaultLanguage: channel.snippet.defaultLanguage || null,
          uploads: channel.contentDetails?.relatedPlaylists?.uploads || null,
          hiddenSubscriberCount: channel.statistics.hiddenSubscriberCount || false,
          videoPrivacyStatus: channel.brandingSettings?.channel?.trackingAnalyticsAccountId || null,
        },
      })
    }

    // If we have an access token, fetch using OAuth (for user's own channels)
    if (accessToken) {
      // Fetch channel data from YouTube API
      const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&mine=true`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        }
      )

      // If the access token is expired, we should handle this case
      if (channelResponse.status === 401) {
        return NextResponse.json(
          { error: "Access token expired", expired: true },
          { status: 401 }
        )
      }

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
          // Additional metadata
          country: channel.snippet.country || null,
          keywords: channel.snippet.keywords || [],
          defaultLanguage: channel.snippet.defaultLanguage || null,
          uploads: channel.contentDetails?.relatedPlaylists?.uploads || null,
          hiddenSubscriberCount: channel.statistics.hiddenSubscriberCount || false,
          videoPrivacyStatus: channel.brandingSettings?.channel?.trackingAnalyticsAccountId || null,
        },
      })
    }

    return NextResponse.json({ error: "Access token or channel ID required" }, { status: 400 })
  } catch (error: any) {
    console.error("YouTube API Error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}