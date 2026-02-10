import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  // Check if required environment variables are set
  const clientId = process.env.YOUTUBE_CLIENT_ID
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET
  const apiKey = process.env.YOUTUBE_API_KEY
  const nextAuthUrl = process.env.NEXTAUTH_URL || process.env.CLIENT_URL || ''
  let nextAuthHost = ''
  try { if (nextAuthUrl) nextAuthHost = new URL(nextAuthUrl).host } catch (e) { nextAuthHost = nextAuthUrl }
  const youtubeAuthUri = `${nextAuthUrl || "http://localhost:3000"}/api/youtube/auth`
  const googleAuthCallback = `${nextAuthUrl || "http://localhost:3000"}/api/auth/callback/google`

  return NextResponse.json({
    success: true,
    config: {
      clientId: clientId ? "Set" : "Missing",
      clientSecret: clientSecret ? "Set" : "Missing",
      apiKey: apiKey ? "Set" : "Missing",
      NEXTAUTH_URL: nextAuthUrl || "Not configured",
      NEXTAUTH_HOST: nextAuthHost || null,
      redirectUri: youtubeAuthUri,
      googleAuthCallback
    },
    message: clientId && clientSecret ? "Configuration looks good!" : "Missing required credentials"
  })
}