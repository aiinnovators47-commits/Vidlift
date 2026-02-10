import { createServerSupabaseClient } from './supabase'

type TokenRow = {
  id: string
  user_id: string
  channel_id: string
  access_token: string | null
  refresh_token: string | null
  expires_at: string | null
}

/**
 * Get a valid access token for a channel (refresh if necessary).
 * Returns a string access token or null if none available / refresh failed.
 */
export async function getValidAccessTokenForChannel(channelId: string): Promise<string | null> {
  if (!channelId) throw new Error('channelId is required')

  const supabase = createServerSupabaseClient()

  // Fetch the most recent token row for this channel
  const { data: tokenRow, error: tokenError } = await supabase
    .from<TokenRow>('tokens')
    .select('id, user_id, channel_id, access_token, refresh_token, expires_at')
    .eq('channel_id', channelId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (tokenError || !tokenRow) {
    console.log('[youtubeAuth] No token row found for channel:', channelId)
    return null
  }

  const { access_token, refresh_token, expires_at } = tokenRow

  const now = Date.now()
  const expiresAtTs = expires_at ? new Date(expires_at).getTime() : null

  // If access token exists and is not expiring in the next 5 minutes, return it
  if (access_token && (!expiresAtTs || expiresAtTs - now > 5 * 60 * 1000)) {
    return access_token
  }

  // If no refresh token, we cannot refresh
  if (!refresh_token) {
    console.log('[youtubeAuth] No refresh token available for channel:', channelId)
    return null
  }

  // Attempt to refresh token with Google's OAuth endpoint
  try {
    const clientId = process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || ''
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || ''

    if (!clientId || !clientSecret) {
      console.error('[youtubeAuth] Missing OAuth client credentials for token refresh')
      return null
    }

    const resp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refresh_token,
        grant_type: 'refresh_token'
      })
    })

    if (!resp.ok) {
      console.error('[youtubeAuth] Token refresh failed (non-200) for channel:', channelId)
      return null
    }

    const data = await resp.json()

    if (!data?.access_token) {
      console.error('[youtubeAuth] Token refresh response missing access_token for channel:', channelId, data)
      return null
    }

    const newAccessToken: string = data.access_token
    const expiresIn: number = Number(data.expires_in) || 3600
    const newExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

    const updateBody: any = {
      access_token: newAccessToken,
      expires_at: newExpiresAt
    }

    // If Google also returned a refreshed refresh_token (rare on refresh flows), persist it
    if (data.refresh_token) updateBody.refresh_token = data.refresh_token

    const { error: updateError } = await supabase
      .from('tokens')
      .update(updateBody)
      .eq('id', tokenRow.id)

    if (updateError) {
      console.error('[youtubeAuth] Failed to update refreshed token in DB for channel:', channelId, updateError)
      // Even if DB update fails, return newAccessToken to allow the caller to continue
    } else {
      console.log('[youtubeAuth] Successfully refreshed access token for channel:', channelId)
    }

    return newAccessToken
  } catch (err) {
    console.error('[youtubeAuth] Token refresh error for channel:', channelId, err)
    return null
  }
}
