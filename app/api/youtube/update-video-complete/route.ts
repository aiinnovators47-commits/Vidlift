import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

// Helper function to refresh token
async function refreshAccessToken(refreshToken: string) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI
    )

    oauth2Client.setCredentials({
      refresh_token: refreshToken
    })

    const { credentials } = await oauth2Client.refreshAccessToken()
    return credentials.access_token
  } catch (error) {
    console.error('Token refresh failed:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { videoId, title, description, tags, refreshToken } = await request.json()

    // Validate input
    if (!videoId) {
      return NextResponse.json(
        { error: 'Missing videoId', success: false },
        { status: 400 }
      )
    }

    // Get access token from Authorization header
    let accessToken = request.headers.get('Authorization')?.slice(7)
    let newToken: string | null = null

    if (!accessToken && refreshToken) {
      // Try to refresh token
      newToken = await refreshAccessToken(refreshToken)
      if (!newToken) {
        return NextResponse.json(
          { error: 'Session expired', success: false },
          { status: 401 }
        )
      }
      accessToken = newToken
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Authentication required', success: false },
        { status: 401 }
      )
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI
    )

    oauth2Client.setCredentials({
      access_token: accessToken
    })

    // Initialize YouTube API
    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client
    })

    // Get current video details to preserve existing data
    const getVideoResponse = await youtube.videos.list({
      part: ['snippet'],
      id: [videoId]
    })

    if (!getVideoResponse.data.items || getVideoResponse.data.items.length === 0) {
      return NextResponse.json(
        { error: 'Video not found', success: false },
        { status: 404 }
      )
    }

    const videoSnippet = getVideoResponse.data.items[0].snippet

    // Prepare update body - use actual values sent from client
    const updateBody: any = {
      id: videoId,
      snippet: {
        title: title !== undefined && title !== null ? title : videoSnippet?.title,
        description: description !== undefined && description !== null ? description : videoSnippet?.description,
        categoryId: videoSnippet?.categoryId,
        defaultLanguage: videoSnippet?.defaultLanguage
      }
    }

    // Add tags if provided (array, not null)
    if (Array.isArray(tags) && tags.length > 0) {
      updateBody.snippet.tags = tags.slice(0, 500) // YouTube limit
    }

    console.log('📝 Updating YouTube video with:', JSON.stringify(updateBody, null, 2))

    // Update video on YouTube
    let updateResponse
    try {
      updateResponse = await youtube.videos.update({
        part: ['snippet'],
        requestBody: updateBody
      })
    } catch (apiError: any) {
      // Handle insufficient permission error
      if (apiError.code === 403 || apiError.message?.includes('Insufficient Permission') || apiError.message?.includes('insufficientPermissions')) {
        return NextResponse.json(
          { 
            error: 'Please reconnect your YouTube account with full permissions',
            success: false,
            needsReauth: true,
            userMessage: 'Your YouTube connection needs to be updated. Please disconnect and reconnect your account from Settings.'
          },
          { status: 403 }
        )
      }
      throw apiError // Re-throw for general error handler
    }

    console.log('✅ YouTube API response:', updateResponse.status, updateResponse.statusText)

    // Save to database (if needed)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/videos/save-metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          title: title || videoSnippet?.title,
          description: description || videoSnippet?.description,
          tags: tags || [],
          updatedAt: new Date(),
          source: 'ai-generated'
        })
      }).catch(err => console.log('Database save skipped:', err.message))
    } catch (dbError) {
      console.log('Database update optional:', dbError)
    }

    return NextResponse.json({
      success: true,
      message: 'Video updated successfully',
      videoId: videoId,
      titleUpdated: !!title,
      descriptionUpdated: !!description,
      tagCount: tags?.length || 0,
      accessToken: newToken // Return new token if refreshed
    }, { status: 200 })

  } catch (error: any) {
    console.error('Error updating video:', error)

    // Determine error type with user-friendly messages
    let errorMessage = 'Unable to update video. Please try again.'
    let userMessage = 'Something went wrong while updating your video. Please try again.'
    let statusCode = 500
    let needsReauth = false

    // Check for specific error types
    const errorString = JSON.stringify(error).toLowerCase()
    const errorMsg = (error.message || '').toLowerCase()

    if (error.code === 403 || errorString.includes('insufficient') || errorString.includes('insufficientpermissions') || errorMsg.includes('insufficient permission')) {
      errorMessage = 'YouTube permission required'
      userMessage = 'Please reconnect your YouTube account from Settings to enable video editing.'
      statusCode = 403
      needsReauth = true
    } else if (error.code === 401 || errorMsg.includes('401') || errorMsg.includes('invalid credentials') || errorMsg.includes('invalid_grant')) {
      errorMessage = 'Session expired'
      userMessage = 'Your YouTube session has expired. Please reconnect your account.'
      statusCode = 401
      needsReauth = true
    } else if (error.code === 404 || errorMsg.includes('404') || errorMsg.includes('not found')) {
      errorMessage = 'Video not found'
      userMessage = 'This video could not be found. It may have been deleted.'
      statusCode = 404
    } else if (errorMsg.includes('quota') || errorMsg.includes('exceeded')) {
      errorMessage = 'YouTube API limit reached'
      userMessage = 'YouTube API quota exceeded. Please try again later.'
      statusCode = 429
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        userMessage,
        success: false,
        needsReauth,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: statusCode }
    )
  }
}
