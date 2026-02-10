import { createServerSupabaseClient } from '@/lib/supabase'

type TokenRow = {
  id: string
  user_id: string
  channel_id: string | null
  access_token: string | null
  refresh_token: string | null
  expires_at: string | null
  created_at?: string
}

const DEFAULT_CHANNEL_ID = 'default'

function computeExpiry(expiresInSeconds: number): string {
  const buffer = 60 // refresh a minute early
  const ms = Math.max(0, (expiresInSeconds - buffer) * 1000)
  return new Date(Date.now() + ms).toISOString()
}

export async function saveInitialTokens(
  userId: string,
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
  channelId: string | null = DEFAULT_CHANNEL_ID,
) {
  const supabase = createServerSupabaseClient()
  const expires_at = computeExpiry(Number(expiresIn || 3600))

  // Upsert on (user_id, channel_id) as per migration 002
  const { error } = await supabase
    .from<TokenRow>('tokens')
    .upsert(
      {
        user_id: userId,
        channel_id: channelId,
        access_token: accessToken,
        refresh_token: refreshToken || null,
        expires_at,
      } as any,
      { onConflict: 'user_id,channel_id' }
    )

  if (error) {
    console.error('[googleTokens] saveInitialTokens upsert error:', error)
    throw error
  }

  // Optional: mark channels row to indicate tokens stored (best-effort)
  try {
    await supabase
      .from('channels')
      .update({ access_token_stored: true, connected_at: new Date().toISOString() })
      .eq('user_id', userId)
  } catch (e) {
    // best effort; ignore
  }
}

export async function getUserTokens(userId: string): Promise<TokenRow | null> {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from<TokenRow>('tokens')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[googleTokens] getUserTokens error:', error)
    return null
  }
  return data || null
}

export async function getTokensByChannel(channelId: string): Promise<TokenRow | null> {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from<TokenRow>('tokens')
    .select('*')
    .eq('channel_id', channelId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[googleTokens] getTokensByChannel error:', error)
    return null
  }
  return data || null
}

export async function getValidAccessTokenForChannel(channelId: string): Promise<string | null> {
  const supabase = createServerSupabaseClient()
  const row = await getTokensByChannel(channelId)
  if (!row?.access_token) return null

  const now = Date.now()
  const expiryMs = row.expires_at ? new Date(row.expires_at).getTime() : 0
  const refreshWindowMs = 2 * 60 * 1000 // 2 minutes

  if (row.refresh_token && (!expiryMs || expiryMs - now <= refreshWindowMs)) {
    const refreshed = await refreshAccessToken(row.refresh_token)
    if (!refreshed) return null

    const newExpiresAt = computeExpiry(refreshed.expires_in)
    const { error } = await supabase
      .from<TokenRow>('tokens')
      .update({ access_token: refreshed.access_token, expires_at: newExpiresAt })
      .eq('id', row.id)

    if (error) {
      console.error('[googleTokens] failed to persist refreshed access token (channel):', error)
      return null
    }
    return refreshed.access_token
  }

  if (expiryMs && expiryMs > now) return row.access_token
  return row.access_token
}

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  const clientId = process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    console.error('[googleTokens] Missing Google client credentials for refresh')
    return null
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!res.ok) {
    const detail = await res.json().catch(() => ({}))
    console.error('[googleTokens] refresh token failed', detail)
    return null
  }

  const json: any = await res.json().catch(() => ({}))
  if (!json?.access_token) return null
  return { access_token: json.access_token, expires_in: Number(json.expires_in || 3600) }
}

export async function getValidAccessToken(userId: string): Promise<string | null> {
  const supabase = createServerSupabaseClient()
  const row = await getUserTokens(userId)
  if (!row?.access_token) return null

  const now = Date.now()
  const expiryMs = row.expires_at ? new Date(row.expires_at).getTime() : 0
  const refreshWindowMs = 2 * 60 * 1000 // 2 minutes

  // If expiring soon and we have a refresh token, refresh
  if (row.refresh_token && (!expiryMs || expiryMs - now <= refreshWindowMs)) {
    const refreshed = await refreshAccessToken(row.refresh_token)
    if (!refreshed) return null

    const newExpiresAt = computeExpiry(refreshed.expires_in)
    const { error } = await supabase
      .from<TokenRow>('tokens')
      .update({ access_token: refreshed.access_token, expires_at: newExpiresAt })
      .eq('id', row.id)

    if (error) {
      console.error('[googleTokens] failed to persist refreshed access token:', error)
      return null
    }
    return refreshed.access_token
  }

  // Return current token if valid
  if (expiryMs && expiryMs > now) return row.access_token

  // If no expiry known but we do have a token, attempt to use it
  return row.access_token
}
