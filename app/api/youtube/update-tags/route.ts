import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function POST(request: NextRequest) {
  try {
    const { videoId, tags } = await request.json()

    // Validate input
    if (!videoId || !tags || !Array.isArray(tags) || tags.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid videoId or tags' },
        { status: 400 }
      )
    }

    // Get access token from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
      )
    }

    const accessToken = authHeader.slice(7)

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI
    )

    // Set the access token
    oauth2Client.setCredentials({
      access_token: accessToken
    })

    // Initialize YouTube API
    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client
    })

    // First, get the current video details to preserve existing data
    const getVideoResponse = await youtube.videos.list({
      part: ['snippet'],
      id: [videoId]
    })

    if (!getVideoResponse.data.items || getVideoResponse.data.items.length === 0) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    const videoSnippet = getVideoResponse.data.items[0].snippet
    if (!videoSnippet) {
      return NextResponse.json(
        { error: 'Failed to get video details' },
        { status: 400 }
      )
    }

    // Update video with new tags
    const updateResponse = await youtube.videos.update({
      part: ['snippet'],
      requestBody: {
        id: videoId,
        snippet: {
          title: videoSnippet.title,
          description: videoSnippet.description,
          tags: tags.slice(0, 500), // YouTube limit is 500 tags
          categoryId: videoSnippet.categoryId,
          defaultLanguage: videoSnippet.defaultLanguage
        }
      }
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Tags updated successfully',
        videoId: videoId,
        tagCount: tags.length
      },
      { status: 200 }
    )

  } catch (error: any) {
    console.error('Error updating video tags:', error)

    // Handle specific error cases
    if (error.message?.includes('401') || error.message?.includes('Invalid Credentials')) {
      return NextResponse.json(
        { error: 'Access token expired or invalid. Please reconnect YouTube.' },
        { status: 401 }
      )
    }

    if (error.message?.includes('403')) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this video' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update video tags' },
      { status: 500 }
    )
  }
}
