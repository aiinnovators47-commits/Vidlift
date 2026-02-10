import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { createServerSupabaseClient } from '@/lib/supabase'

// Helper function to refresh expired token
async function refreshAccessToken(supabase: any, userId: string, channelId: string) {
  try {
    const { data: tokenData, error: tokenError } = await supabase
      .from('tokens')
      .select('refresh_token')
      .eq('user_id', userId)
      .eq('channel_id', channelId)
      .single()

    if (tokenError || !tokenData || !tokenData.refresh_token) {
      console.log('❌ No refresh token available')
      return null
    }

    const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '',
        refresh_token: tokenData.refresh_token,
        grant_type: 'refresh_token'
      })
    })

    if (!refreshResponse.ok) {
      console.log('❌ Token refresh failed from Google API')
      return null
    }

    const refreshData = await refreshResponse.json()
    const newAccessToken = refreshData.access_token
    const expiresInSeconds = refreshData.expires_in || 3600
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString()

    await supabase
      .from('tokens')
      .update({
        access_token: newAccessToken,
        expires_at: expiresAt
      })
      .eq('user_id', userId)
      .eq('channel_id', channelId)

    console.log('✅ Access token refreshed successfully')
    return newAccessToken
  } catch (error) {
    console.error('❌ Token refresh error:', error)
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('Update tags API called')
    const { videoId, tags, accessToken, channelId } = await req.json()

    if (!videoId || !tags) {
      return NextResponse.json(
        { error: 'Video ID and tags are required' },
        { status: 400 }
      )
    }

    if (!Array.isArray(tags) || tags.length === 0) {
      return NextResponse.json(
        { error: 'Tags must be a non-empty array' },
        { status: 400 }
      )
    }

    console.log('Updating tags for video:', videoId)
    console.log('Tags to add:', tags)

    let finalAccessToken = accessToken

    // If no access token provided, try to get from database
    if (!finalAccessToken && channelId) {
      const session: any = await getServerSession(authOptions as any)
      if (session?.user?.email) {
        const supabase = createServerSupabaseClient()
        
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('email', session.user.email)
          .single()

        if (userData) {
          const { data: tokenData } = await supabase
            .from('tokens')
            .select('access_token, expires_at')
            .eq('user_id', userData.id)
            .eq('channel_id', channelId)
            .single()

          if (tokenData) {
            // Check if token is expired
            const expiresAt = tokenData.expires_at ? new Date(tokenData.expires_at).getTime() : null
            const now = Date.now()
            
            if (expiresAt && expiresAt < now + 5 * 60 * 1000) {
              // Token expired or expiring soon, refresh it
              const refreshedToken = await refreshAccessToken(supabase, userData.id, channelId)
              finalAccessToken = refreshedToken || tokenData.access_token
            } else {
              finalAccessToken = tokenData.access_token
            }
          }
        }
      }
    }

    if (!finalAccessToken) {
      return NextResponse.json(
        { error: 'Access token is required. Please reconnect your YouTube channel.' },
        { status: 401 }
      )
    }

    // Initialize OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET
    )

    oauth2Client.setCredentials({
      access_token: finalAccessToken,
    })

    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client,
    })

    // Get current video details (token validation happens automatically)
    let currentVideoResponse
    try {
      currentVideoResponse = await youtube.videos.list({
        part: ['snippet', 'status'],
        id: [videoId]
      })
    } catch (error: any) {
      console.error('Failed to get current video details:', error)
      
      // Token error - return 401 to trigger refresh on client
      if (error.code === 401 || error.message?.includes('invalid') || error.message?.includes('expired')) {
        return NextResponse.json(
          {
            error: 'Session expired. Please try again.',
            tokenExpired: true
          },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        {
          error: 'Failed to access video. Please check permissions.',
          details: error.message
        },
        { status: error.code || 403 }
      )
    }

    const currentVideo = currentVideoResponse.data.items?.[0]

    if (!currentVideo) {
      return NextResponse.json(
        { error: 'Video not found or you do not have permission to edit it' },
        { status: 404 }
      )
    }

    if (!currentVideo.snippet) {
      return NextResponse.json(
        { error: 'Video snippet data is not available' },
        { status: 500 }
      )
    }

    // Prepare update payload with new tags
    const updatePayload = {
      id: videoId,
      snippet: {
        ...currentVideo.snippet,
        tags: tags // Update with new tags
      },
      status: {
        ...currentVideo.status
      }
    }

    // Remove undefined values
    Object.keys(updatePayload.snippet).forEach(key => {
      if ((updatePayload.snippet as any)[key] === undefined) {
        delete (updatePayload.snippet as any)[key]
      }
    })

    Object.keys(updatePayload.status).forEach(key => {
      if ((updatePayload.status as any)[key] === undefined) {
        delete (updatePayload.status as any)[key]
      }
    })

    console.log('Final update payload:', JSON.stringify(updatePayload, null, 2))

    // Update video with new tags
    let updateResponse
    try {
      updateResponse = await youtube.videos.update({
        part: ['snippet', 'status'],
        requestBody: updatePayload
      })
    } catch (error: any) {
      console.error('YouTube API Update Error:', error)

      if (error.code === 403) {
        return NextResponse.json(
          {
            error: 'Permission denied. Make sure you have permission to edit this video.',
            details: error.message
          },
          { status: 403 }
        )
      } else if (error.code === 404) {
        return NextResponse.json(
          {
            error: 'Video not found. The video may have been deleted.',
            details: error.message
          },
          { status: 404 }
        )
      } else if (error.code === 400) {
        return NextResponse.json(
          {
            error: 'Invalid request. Tags may exceed character limit or contain invalid characters.',
            details: error.message
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        {
          error: 'Failed to update tags on YouTube',
          details: error.message,
          errorCode: error.code
        },
        { status: 500 }
      )
    }

    const updatedVideo = updateResponse.data
    console.log('YouTube API Response:', updatedVideo)

    if (!updatedVideo || !updatedVideo.id) {
      return NextResponse.json(
        {
          error: 'Tags update failed - invalid response from YouTube',
          details: updatedVideo
        },
        { status: 500 }
      )
    }

    console.log('Tags updated successfully for video:', updatedVideo.snippet?.title)

    return NextResponse.json({
      success: true,
      video: updatedVideo,
      message: 'Tags updated successfully on YouTube',
      tags: updatedVideo.snippet?.tags || []
    })

  } catch (error: any) {
    console.error('Error updating tags:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message
      },
      { status: 500 }
    )
  }
}
