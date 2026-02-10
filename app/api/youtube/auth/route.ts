import { NextRequest, NextResponse } from "next/server"

// OAuth callback - must run dynamically to handle per-request authorization codes
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  console.log('[YouTube Auth] Route executed at runtime:', new Date().toISOString())
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  
  // Handle OAuth errors
  if (error) {
    console.error("OAuth error:", error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || process.env.CLIENT_URL || "http://localhost:3000"}/connect?error=${encodeURIComponent(error)}`)
  }

  if (!code) {
    // Redirect to YouTube OAuth
    const youtubeAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
    
    // Validate environment variables
    if (!process.env.YOUTUBE_CLIENT_ID) {
      console.error("YOUTUBE_CLIENT_ID is not set")
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || process.env.CLIENT_URL || "http://localhost:3000"}/connect?error=missing_client_id`)
    }
    
    const redirectUri = `${process.env.NEXTAUTH_URL || process.env.CLIENT_URL || "http://localhost:3000"}/api/youtube/auth`
    
    youtubeAuthUrl.searchParams.set("client_id", process.env.YOUTUBE_CLIENT_ID)
    youtubeAuthUrl.searchParams.set("redirect_uri", redirectUri)
    youtubeAuthUrl.searchParams.set("response_type", "code")
    // Required scopes: Full YouTube access (read/write) + analytics
    youtubeAuthUrl.searchParams.set("scope", "https://www.googleapis.com/auth/youtube.force-ssl https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/yt-analytics.readonly")
    youtubeAuthUrl.searchParams.set("access_type", "offline")
    // Force account chooser and consent so refresh_token is always issued
    youtubeAuthUrl.searchParams.set("prompt", "select_account consent")
    youtubeAuthUrl.searchParams.set("include_granted_scopes", "true")
    
    console.log("Redirecting to YouTube OAuth with URI:", redirectUri)
    
    return NextResponse.redirect(youtubeAuthUrl.toString())
  }

  // Exchange code for access token
  try {
    // Validate environment variables
    if (!process.env.YOUTUBE_CLIENT_ID || !process.env.YOUTUBE_CLIENT_SECRET) {
      console.error("Missing YouTube client credentials")
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || process.env.CLIENT_URL || "http://localhost:3000"}/connect?error=missing_credentials`)
    }
    
    const redirectUri = `${process.env.NEXTAUTH_URL || process.env.CLIENT_URL || "http://localhost:3000"}/api/youtube/auth`
    
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.YOUTUBE_CLIENT_ID,
        client_secret: process.env.YOUTUBE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    })

    const tokenData = await tokenResponse.json()
    
    console.log("Token response:", tokenData)

    if (!tokenResponse.ok) {
      console.error("Token exchange error:", tokenData)
      const errorMessage = tokenData.error || "token_failed"
      
      // Check if this is a popup request
      const { searchParams: urlSearchParams } = new URL(req.url)
      const isPopup = urlSearchParams.get('popup') === 'true'
      
      if (isPopup) {
        // Return HTML that sends error message to parent window
        return new Response(`
          <html>
            <body>
              <script>
                window.opener?.postMessage({
                  type: 'YOUTUBE_AUTH_ERROR',
                  error: '${errorMessage}'
                }, '${process.env.NEXTAUTH_URL || process.env.CLIENT_URL || "http://localhost:3000"}');
                window.close();
              </script>
            </body>
          </html>
        `, {
          headers: { 'Content-Type': 'text/html' }
        })
      }
      
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || process.env.CLIENT_URL || "http://localhost:3000"}/connect?error=${encodeURIComponent(errorMessage)}`)
    }

    // Persist tokens server-side and fetch channel information
    // Store tokens ONLY in Supabase/Postgres
    // Never expose refresh_token to the client
    try {
      const { getServerSession } = await import('next-auth')
      const { createServerSupabaseClient } = await import('@/lib/supabase')
      const { saveInitialTokens } = await import('@/lib/googleTokens')
      const session = await getServerSession()
      const supabase = createServerSupabaseClient()
      const { data: userRow } = await supabase
        .from('users')
        .select('id,email')
        .eq('email', session?.user?.email || '')
        .limit(1)
        .single()
      if (userRow?.id && tokenData?.access_token) {
        const expiresIn = Number(tokenData.expires_in || 3600)
        // Save tokens immediately under a temporary/default channel id; will upsert with real channel id below
        await saveInitialTokens(userRow.id, tokenData.access_token, tokenData.refresh_token || '', expiresIn)
      }
    } catch (persistErr) {
      console.error('Failed to persist YouTube tokens:', persistErr)
    }

    // Fetch channel information
    let channelData = null
    try {
      const channelResponse = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true`, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      })

      if (channelResponse.ok) {
        const channelResult = await channelResponse.json()
        if (channelResult.items && channelResult.items.length > 0) {
          const channel = channelResult.items[0]
          channelData = {
            id: channel.id,
            title: channel.snippet.title,
            description: channel.snippet.description,
            thumbnail: channel.snippet.thumbnails?.default?.url || channel.snippet.thumbnails?.medium?.url,
            subscriberCount: channel.statistics?.subscriberCount || '0',
            videoCount: channel.statistics?.videoCount || '0',
            viewCount: channel.statistics?.viewCount || '0',
            publishedAt: channel.snippet.publishedAt
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch channel data:', error)
    }

    // Persist channel information in DB as primary (if not already present)
    try {
      const { getServerSession } = await import('next-auth')
      const { createServerSupabaseClient } = await import('@/lib/supabase')
      const { saveInitialTokens } = await import('@/lib/googleTokens')
      const session = await getServerSession()
      const supabase = createServerSupabaseClient()
      const { data: userRow } = await supabase
        .from('users')
        .select('id,email')
        .eq('email', session?.user?.email || '')
        .limit(1)
        .single()

      if (userRow?.id && channelData?.id) {
        // Now that we know the real channelId, upsert tokens under this channel id too
        if (tokenData?.access_token) {
          const expiresIn = Number(tokenData.expires_in || 3600)
          await saveInitialTokens(userRow.id, tokenData.access_token, tokenData.refresh_token || '', expiresIn, channelData.id)
        }

        // Determine if a primary channel already exists
        const { data: existingPrimary } = await supabase
          .from('channels')
          .select('id')
          .eq('user_id', userRow.id)
          .eq('is_primary', true)
          .limit(1)
          .maybeSingle()

        const isPrimary = !existingPrimary

        // Calculate token expiry
        const expiresAt = new Date(Date.now() + (Number(tokenData?.expires_in || 3600) * 1000))

        await supabase
          .from('channels')
          .upsert({
            user_id: userRow.id,
            channel_id: channelData.id,
            title: channelData.title,
            description: channelData.description,
            thumbnail: channelData.thumbnail,
            subscriber_count: Number(channelData.subscriberCount || 0),
            video_count: Number(channelData.videoCount || 0),
            view_count: Number(channelData.viewCount || 0),
            is_primary: isPrimary ? true : undefined,
            access_token_stored: true,
            access_token: tokenData?.access_token || null,
            refresh_token: tokenData?.refresh_token || null,
            token_expires_at: expiresAt.toISOString(),
            connected_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as any,
          { onConflict: 'user_id,channel_id' })
      }
    } catch (chanErr) {
      console.error('Failed to persist channel info:', chanErr)
    }

    // Check if this is a popup request
    const { searchParams: urlSearchParams } = new URL(req.url)
    const isPopup = urlSearchParams.get('popup') === 'true'
    
    if (isPopup && channelData) {
      // Return HTML that sends success message to parent window
      return new Response(`
        <html>
          <body>
            <script>
              window.opener?.postMessage({
                type: 'YOUTUBE_AUTH_SUCCESS',
                channel: ${JSON.stringify(channelData)}
              }, '${process.env.NEXTAUTH_URL || process.env.CLIENT_URL || "http://localhost:3000"}');
              window.close();
            </script>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // Redirect back to /connect page with token and refresh token so the page can show connected state
    // Then the page will auto-analyze and redirect to dashboard
    const connectRedirectUrl = new URL(`${process.env.NEXTAUTH_URL || process.env.CLIENT_URL || "http://localhost:3000"}/connect`)
    connectRedirectUrl.searchParams.set('youtube_token', tokenData?.access_token || '')
    if (tokenData?.refresh_token) {
      connectRedirectUrl.searchParams.set('refresh_token', tokenData.refresh_token)
    }
    console.log("Redirecting to /connect page to show connected state and channel selector")
    return NextResponse.redirect(connectRedirectUrl.toString())
  } catch (error: any) {
    console.error("YouTube auth error:", error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || process.env.CLIENT_URL || "http://localhost:3000"}/connect?error=auth_failed`)
  }
}