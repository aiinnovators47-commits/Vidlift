export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const channelId = searchParams.get('channelId')
    const accessToken = searchParams.get('accessToken')

    if (!channelId || !accessToken) {
      return NextResponse.json({ 
        error: 'Channel ID and access token are required' 
      }, { status: 400 })
    }

    // Initialize OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET
    )

    oauth2Client.setCredentials({
      access_token: accessToken,
    })

    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client,
    })

    // Get channel statistics
    const channelResponse = await youtube.channels.list({
      part: ['statistics', 'snippet', 'brandingSettings'],
      id: [channelId]
    })

    if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    const channel = channelResponse.data.items[0]
    const channelStats = channel.statistics!

    // Get uploads playlist and fetch recent videos (no search.list)
    const channelResp = await youtube.channels.list({ part: ['contentDetails'], id: [channelId] })
    const uploadsPlaylistId = channelResp.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads

    let videos: any[] = []
    if (uploadsPlaylistId) {
      const plRes = await youtube.playlistItems.list({ part: ['snippet'], playlistId: uploadsPlaylistId, maxResults: 20 })
      const videoIds = (plRes.data.items || []).map((item: any) => item.snippet?.resourceId?.videoId).filter(Boolean) as string[]
      if (videoIds.length > 0) {
        const videoDetailsResponse = await youtube.videos.list({ part: ['statistics', 'snippet'], id: videoIds })
        videos = videoDetailsResponse.data.items || []
      }
    } else {
      // No uploads playlist — do not use search.list per project policy
      return NextResponse.json({ error: 'Could not derive uploads playlist for this channel' }, { status: 404 })
    }

    // Calculate scores
    const scores = calculateChannelScores(channel, videos)

    return NextResponse.json(scores)

  } catch (error: any) {
    console.error('Error scoring channel:', error)
    return NextResponse.json({ 
      error: 'Failed to score channel',
      details: error.message 
    }, { status: 500 })
  }
}

function calculateChannelScores(channel: any, videos: any[]) {
  const stats = channel.statistics
  const subscriberCount = parseInt(stats.subscriberCount || '0')
  const totalViews = parseInt(stats.viewCount || '0')
  const videoCount = parseInt(stats.videoCount || '0')

  // Calculate video metrics
  const videoStats = videos.map(video => ({
    views: parseInt(video.statistics?.viewCount || '0'),
    likes: parseInt(video.statistics?.likeCount || '0'),
    comments: parseInt(video.statistics?.commentCount || '0'),
    publishedAt: new Date(video.snippet?.publishedAt || ''),
    title: video.snippet?.title || '',
    description: video.snippet?.description || '',
    tags: video.snippet?.tags || []
  }))

  // Calculate average metrics
  const avgViews = videoStats.length > 0 
    ? videoStats.reduce((sum, video) => sum + video.views, 0) / videoStats.length 
    : 0

  const avgLikes = videoStats.length > 0 
    ? videoStats.reduce((sum, video) => sum + video.likes, 0) / videoStats.length 
    : 0

  const avgComments = videoStats.length > 0 
    ? videoStats.reduce((sum, video) => sum + video.comments, 0) / videoStats.length 
    : 0

  // Calculate engagement rate
  const engagementRate = avgViews > 0 ? ((avgLikes + avgComments) / avgViews) * 100 : 0

  // Calculate upload frequency (videos per month)
  const now = new Date()
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const recentVideos = videoStats.filter(video => video.publishedAt > oneMonthAgo)
  const uploadFrequency = recentVideos.length

  // Calculate scores (0-100)
  
  // Engagement Score (based on likes, comments, engagement rate)
  const engagementScore = Math.min(100, Math.max(0, 
    (engagementRate * 10) + 
    (avgLikes > 100 ? 20 : avgLikes / 5) + 
    (avgComments > 50 ? 20 : avgComments * 0.4)
  ))

  // Growth Score (based on subscriber count and recent performance)
  const growthScore = Math.min(100, Math.max(0,
    (subscriberCount > 10000 ? 40 : subscriberCount / 250) +
    (avgViews > subscriberCount * 0.1 ? 30 : (avgViews / subscriberCount) * 300) +
    (uploadFrequency > 4 ? 30 : uploadFrequency * 7.5)
  ))

  // Consistency Score (based on upload frequency and performance variance)
  const viewsVariance = videoStats.length > 1 
    ? Math.sqrt(videoStats.reduce((sum, video) => sum + Math.pow(video.views - avgViews, 2), 0) / videoStats.length)
    : 0
  const consistencyScore = Math.min(100, Math.max(0,
    (uploadFrequency > 2 ? 40 : uploadFrequency * 20) +
    (viewsVariance < avgViews ? 40 : Math.max(0, 40 - (viewsVariance / avgViews) * 20)) +
    (videoCount > 50 ? 20 : videoCount * 0.4)
  ))

  // SEO Score (based on title length, description, tags)
  const seoScore = Math.min(100, Math.max(0,
    videoStats.reduce((sum, video) => {
      let score = 0
      if (video.title.length >= 30 && video.title.length <= 70) score += 25
      if (video.description.length > 100) score += 25
      if (video.tags.length >= 5) score += 25
      if (video.title.includes('|') || video.title.includes('-')) score += 25
      return sum + score
    }, 0) / (videoStats.length || 1)
  ))

  // Content Score (based on video count, average performance)
  const viewToSubRatio = subscriberCount > 0 ? avgViews / subscriberCount : 0
  const contentScore = Math.min(100, Math.max(0,
    (videoCount > 100 ? 30 : videoCount * 0.3) +
    (viewToSubRatio > 0.05 ? 30 : viewToSubRatio * 600) +
    (avgViews > 1000 ? 25 : avgViews * 0.025) +
    (totalViews > 100000 ? 15 : totalViews * 0.00015)
  ))

  // Overall score (weighted average)
  const overallScore = Math.round(
    (engagementScore * 0.25) +
    (growthScore * 0.25) +
    (consistencyScore * 0.2) +
    (seoScore * 0.15) +
    (contentScore * 0.15)
  )

  // Generate recommendations
  const recommendations = []
  const strengths = []
  const weaknesses = []

  if (engagementScore < 50) {
    recommendations.push("Improve engagement by asking questions and responding to comments")
    recommendations.push("Create more interactive content like polls and community posts")
    weaknesses.push("Low audience engagement")
  } else {
    strengths.push("Good audience engagement")
  }

  if (uploadFrequency < 2) {
    recommendations.push("Increase upload frequency for better algorithm performance")
    weaknesses.push("Inconsistent upload schedule")
  } else {
    strengths.push("Consistent content creation")
  }

  if (seoScore < 60) {
    recommendations.push("Optimize video titles with keywords and compelling phrases")
    recommendations.push("Write detailed descriptions with relevant tags")
    weaknesses.push("SEO optimization needed")
  } else {
    strengths.push("Good SEO practices")
  }

  if (subscriberCount < 1000) {
    recommendations.push("Focus on creating shareable content to grow subscriber base")
    recommendations.push("Collaborate with other creators in your niche")
  } else {
    strengths.push("Established subscriber base")
  }

  if (viewToSubRatio < 0.1) {
    recommendations.push("Improve thumbnails and titles to increase click-through rates")
    weaknesses.push("Low view-to-subscriber ratio")
  } else {
    strengths.push("Good video performance")
  }

  return {
    overallScore,
    scores: {
      engagement: Math.round(engagementScore),
      growth: Math.round(growthScore),
      consistency: Math.round(consistencyScore),
      seo: Math.round(seoScore),
      content: Math.round(contentScore)
    },
    metrics: {
      avgViews: Math.round(avgViews),
      engagementRate: parseFloat(engagementRate.toFixed(2)),
      uploadFrequency,
      subscriberGrowth: 0, // Would need historical data
      viewsGrowth: 0 // Would need historical data
    },
    recommendations,
    strengths,
    weaknesses
  }
}