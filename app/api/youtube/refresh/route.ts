import { NextRequest, NextResponse } from "next/server"

// OAuth token refresh - must run dynamically with runtime secrets
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    console.log('[YouTube Refresh] Token refresh executed at runtime:', new Date().toISOString())
    const { refreshToken } = await req.json()
    
    if (!refreshToken) {
      return NextResponse.json({ error: "Refresh token is required" }, { status: 400 })
    }

    // Exchange refresh token for new access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: process.env.YOUTUBE_CLIENT_ID!,
        client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
        grant_type: "refresh_token",
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error("Token refresh error:", tokenData)
      return NextResponse.json(
        { error: "Failed to refresh token", details: tokenData },
        { status: tokenResponse.status }
      )
    }

    return NextResponse.json({
      success: true,
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in,
    })
  } catch (error: any) {
    console.error("YouTube refresh error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}