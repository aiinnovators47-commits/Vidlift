import { NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const accessToken = formData.get("access_token") as string
    const videoFile = formData.get("video") as File
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const tags = formData.get("tags") as string
    const privacy = formData.get("privacy") as string
    const madeForKids = formData.get("madeForKids") === "true"
    const category = formData.get("category") as string
    const channelIds = formData.get("channelIds") as string
    let expectedChannelId = formData.get("channelId") as string
    
    // Handle channelIds array format
    if (!expectedChannelId && channelIds) {
      try {
        const parsedChannelIds = JSON.parse(channelIds)
        if (Array.isArray(parsedChannelIds) && parsedChannelIds.length > 0) {
          expectedChannelId = parsedChannelIds[0]
        }
      } catch (e) {
        console.log('Failed to parse channelIds, continuing without validation')
      }
    }

    console.log('=== UPLOAD API DEBUG ===')
    console.log('Expected Channel ID:', expectedChannelId)
    console.log('Access Token (first 20 chars):', accessToken?.substring(0, 20))
    console.log('Video file size:', videoFile?.size)
    console.log('Video title:', title)
    console.log('Tags:', tags)

    // Sanity-check required environment variables
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error('Missing Google OAuth client env vars')
      return NextResponse.json({ success: false, error: 'Server misconfigured: missing Google OAuth client ID/secret' }, { status: 500 })
    }

    if (!accessToken) {
      return NextResponse.json({ success: false, error: "No access token provided" }, { status: 401 })
    }

    if (!videoFile) {
      return NextResponse.json({ success: false, error: "No video file provided" }, { status: 400 })
    }

    if (!title) {
      return NextResponse.json({ success: false, error: "No title provided" }, { status: 400 })
    }

    // Initialize OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
    )

    oauth2Client.setCredentials({
      access_token: accessToken,
    })

    const youtube = google.youtube({
      version: "v3",
      auth: oauth2Client,
    })

    // Verify which channel this token belongs to (optional, best-effort)
    try {
      const channelResponse = await youtube.channels.list({ part: ["snippet"], mine: true })
      if (channelResponse.data.items && channelResponse.data.items.length > 0) {
        const actualChannelId = channelResponse.data.items[0].id
        const actualChannelName = channelResponse.data.items[0].snippet?.title
        console.log('Actual Channel ID from token:', actualChannelId)
        console.log('Actual Channel Name:', actualChannelName)
        if (expectedChannelId && actualChannelId !== expectedChannelId) {
          console.error('❌ CHANNEL MISMATCH! Expected:', expectedChannelId, 'Got:', actualChannelId)
          return NextResponse.json({
            success: false,
            error: `Token mismatch: token belongs to "${actualChannelName}" (id=${actualChannelId}) but expected channel id ${expectedChannelId}`,
            channelMismatch: true,
          }, { status: 400 })
        }
        console.log('✅ Channel verified:', actualChannelName)
      }
    } catch (verifyErr: any) {
      console.warn('Channel verification failed (continuing):', verifyErr?.message || verifyErr)
    }

    // Convert File to Buffer
    const arrayBuffer = await videoFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Parse tags
    const tagArray = tags
      ? tags.split(",").map((tag) => tag.trim()).filter((tag) => tag.length > 0)
      : []

    // Upload video
    console.log('Starting video upload...')
    let response
    try {
      response = await youtube.videos.insert({
        part: ["snippet", "status"],
        requestBody: {
          snippet: {
            title: title,
            description: description || "",
            tags: tagArray,
            categoryId: category || "22",
          },
          status: {
            privacyStatus: (privacy as "public" | "private" | "unlisted") || "unlisted",
            selfDeclaredMadeForKids: madeForKids,
          },
        },
        media: {
          body: require("stream").Readable.from(buffer),
          mimeType: videoFile.type,
        },
      })
    } catch (uploadErr: any) {
      console.error('youtube.videos.insert failed:', uploadErr)
      // Try to extract details from Google's error response
      const details = uploadErr?.response?.data || uploadErr?.message || String(uploadErr)
      return NextResponse.json({ success: false, error: 'YouTube upload failed', details }, { status: 500 })
    }

    console.log('✅ Upload successful! Video ID:', response.data.id)
    console.log('Video URL:', `https://youtube.com/watch?v=${response.data.id}`)

    return NextResponse.json({
      success: true,
      video: {
        id: response.data.id,
        title: response.data.snippet?.title,
        url: `https://youtube.com/watch?v=${response.data.id}`,
        channelId: response.data.snippet?.channelId,
        channelTitle: response.data.snippet?.channelTitle,
      },
    })
  } catch (error: any) {
    console.error("YouTube upload error:", error)
    
    if (error.code === 401 || error.message?.includes("invalid_grant")) {
      return NextResponse.json(
        { success: false, error: "Token expired", expired: true },
        { status: 401 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to upload video",
      },
      { status: 500 }
    )
  }
}
