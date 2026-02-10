import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function POST(req: NextRequest) {
  try {
    console.log('Update video API called')
    const { videoData, accessToken } = await req.json()

    if (!videoData || !accessToken) {
      return NextResponse.json({ 
        error: 'Video data and access token are required' 
      }, { status: 400 })
    }

    if (!videoData.id) {
      return NextResponse.json({ 
        error: 'Video ID is required' 
      }, { status: 400 })
    }

    console.log('Updating video:', videoData.id)
    console.log('Update payload:', JSON.stringify(videoData, null, 2))
    console.log('Access token length:', accessToken?.length || 0)

    // Validate privacy status
    const validPrivacyStatuses = ['private', 'public', 'unlisted']
    if (videoData.status?.privacyStatus && !validPrivacyStatuses.includes(videoData.status.privacyStatus)) {
      return NextResponse.json({ 
        error: `Invalid privacy status: ${videoData.status.privacyStatus}. Must be one of: ${validPrivacyStatuses.join(', ')}` 
      }, { status: 400 })
    }

    // Initialize OAuth2 client with proper scopes
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

    // Test token validity and scopes by making a simple API call
    try {
      await youtube.channels.list({
        part: ['id'],
        mine: true
      })
    } catch (tokenError: any) {
      console.error('Token validation failed:', tokenError)
      return NextResponse.json({ 
        error: 'Invalid or expired access token. Please reconnect your YouTube channel.',
        details: tokenError.message
      }, { status: 401 })
    }

    // First, get the current video details to preserve existing data
    let currentVideoResponse
    try {
      currentVideoResponse = await youtube.videos.list({
        part: ['snippet', 'status'],
        id: [videoData.id]
      })
    } catch (error: any) {
      console.error('Failed to get current video details:', error)
      return NextResponse.json({ 
        error: 'Failed to get current video details', 
        details: error.message 
      }, { status: 403 })
    }

    const currentVideo = currentVideoResponse.data.items?.[0]

    if (!currentVideo) {
      return NextResponse.json({
        error: 'Video not found or you do not have permission to edit it'
      }, { status: 404 })
    }

    if (!currentVideo.snippet) {
      return NextResponse.json({
        error: 'Video snippet data is not available'
      }, { status: 500 })
    }

    // Log current privacy status for debugging
    console.log('Current privacy status:', currentVideo.status?.privacyStatus)
    console.log('Requested privacy status:', videoData.status?.privacyStatus)

    // Check for privacy status change restrictions
    const currentPrivacy = currentVideo.status?.privacyStatus
    const newPrivacy = videoData.status?.privacyStatus

    if (newPrivacy && currentPrivacy !== newPrivacy) {
      console.log(`Privacy status change: ${currentPrivacy} -> ${newPrivacy}`)
      
      // Check for specific restrictions
      if (currentPrivacy === 'public' && (newPrivacy === 'private' || newPrivacy === 'unlisted')) {
        console.log('Warning: Changing from public to private/unlisted')
      }
    }

    // Preserve existing data and only update what was provided
    const updatePayload = {
      id: videoData.id,
      snippet: {
        ...currentVideo.snippet, // Preserve existing snippet data
        title: videoData.snippet?.title || currentVideo.snippet.title,
        description: videoData.snippet?.description || currentVideo.snippet.description,
        categoryId: videoData.snippet?.categoryId || currentVideo.snippet.categoryId || "22",
        // Ensure required fields are preserved but clean undefined values
        ...(currentVideo.snippet.channelId && { channelId: currentVideo.snippet.channelId }),
        ...(currentVideo.snippet.defaultLanguage && { defaultLanguage: currentVideo.snippet.defaultLanguage }),
        ...(currentVideo.snippet.defaultAudioLanguage && { defaultAudioLanguage: currentVideo.snippet.defaultAudioLanguage })
      },
      status: {
        ...currentVideo.status, // Preserve existing status data
        privacyStatus: videoData.status?.privacyStatus || currentVideo.status?.privacyStatus
      }
    }

    // Remove undefined values to avoid API errors
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

    // Update video using YouTube Data API v3 with Google APIs client
    let updateResponse
    try {
      updateResponse = await youtube.videos.update({
        part: ['snippet', 'status'],
        requestBody: updatePayload
      })
    } catch (error: any) {
      console.error('YouTube API Update Error:', error)
      
      // Handle specific YouTube API errors with detailed messages
      if (error.code === 403) {
        // Check if it's a privacy status related permission issue
        if (error.message?.includes('privacy') || error.message?.includes('status')) {
          return NextResponse.json({ 
            error: 'Cannot change privacy status. This may be due to: 1) Video monetization status, 2) Content ID claims, 3) Community guidelines restrictions, or 4) Insufficient permissions.',
            details: error.message,
            suggestion: 'Try changing the privacy status directly on YouTube Studio to see if restrictions apply.'
          }, { status: 403 })
        }
        return NextResponse.json({ 
          error: 'Permission denied. Make sure you have the required YouTube scopes and permission to edit this video.',
          details: error.message
        }, { status: 403 })
      } else if (error.code === 404) {
        return NextResponse.json({ 
          error: 'Video not found. The video may have been deleted or you do not own it.',
          details: error.message
        }, { status: 404 })
      } else if (error.code === 400) {
        // Handle specific 400 errors for privacy status
        if (error.message?.includes('privacy') || error.message?.includes('privacyStatus')) {
          return NextResponse.json({ 
            error: 'Privacy status change not allowed. The video may have restrictions preventing privacy changes.',
            details: error.message,
            suggestion: 'Check if the video has Content ID claims, monetization issues, or other restrictions in YouTube Studio.'
          }, { status: 400 })
        }
        return NextResponse.json({ 
          error: 'Invalid video data or request format.',
          details: error.message
        }, { status: 400 })
      }
      
      return NextResponse.json({ 
        error: 'Failed to update video on YouTube', 
        details: error.message,
        errorCode: error.code
      }, { status: 500 })
    }

    const updatedVideo = updateResponse.data
    console.log('YouTube API Response:', updatedVideo)
    
    // The YouTube API PUT response returns the video object directly, not wrapped in items array
    if (!updatedVideo || !updatedVideo.id) {
      return NextResponse.json({ 
        error: 'Video update failed - invalid response from YouTube',
        details: updatedVideo
      }, { status: 500 })
    }

    console.log('Video updated successfully:', updatedVideo.snippet?.title)
    
    // Validate that the changes were actually applied
    const actualTitle = updatedVideo.snippet?.title
    const actualDescription = updatedVideo.snippet?.description
    const actualPrivacy = updatedVideo.status?.privacyStatus
    
    console.log('Verification - Expected vs Actual:')
    console.log('Title:', updatePayload.snippet.title, 'vs', actualTitle)
    console.log('Privacy:', updatePayload.status.privacyStatus, 'vs', actualPrivacy)
    
    return NextResponse.json({ 
      success: true, 
      video: updatedVideo,
      message: 'Video updated successfully on YouTube',
      verified: {
        title: actualTitle === updatePayload.snippet.title,
        privacy: actualPrivacy === updatePayload.status.privacyStatus
      }
    })

  } catch (error: any) {
    console.error('Error updating video:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}