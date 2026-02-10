import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { createServerSupabaseClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions as any)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { channelId, accessToken, refreshToken, expiresAt } = body

    if (!channelId || !accessToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Get user ID from email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete old token for this channel if exists
    await supabase
      .from('tokens')
      .delete()
      .eq('user_id', userData.id)
      .eq('channel_id', channelId)

    // Insert new token
    const { data, error } = await supabase
      .from('tokens')
      .insert({
        user_id: userData.id,
        channel_id: channelId,
        access_token: accessToken,
        refresh_token: refreshToken || null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null
      })
      .select()

    if (error) {
      console.error('❌ Token storage error:', error)
      return NextResponse.json({ error: 'Failed to store token' }, { status: 500 })
    }

    console.log('✅ Token stored in database for channel:', channelId)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('❌ Token API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to refresh expired token
async function refreshAccessToken(supabase: any, userId: string, channelId: string) {
  try {
    // Get stored refresh token
    const { data: tokenData, error: tokenError } = await supabase
      .from('tokens')
      .select('refresh_token, access_token')
      .eq('user_id', userId)
      .eq('channel_id', channelId)
      .single()

    if (tokenError || !tokenData || !tokenData.refresh_token) {
      console.log('❌ No refresh token available')
      return null
    }

    // Call YouTube API to refresh token
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

    // Calculate new expiry time
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString()

    // Update token in database
    const { error: updateError } = await supabase
      .from('tokens')
      .update({
        access_token: newAccessToken,
        expires_at: expiresAt
      })
      .eq('user_id', userId)
      .eq('channel_id', channelId)

    if (updateError) {
      console.log('❌ Failed to update refreshed token in database')
      return null
    }

    console.log('✅ Access token refreshed successfully for channel:', channelId)
    return newAccessToken
  } catch (error) {
    console.error('❌ Token refresh error:', error)
    return null
  }
}

// GET endpoint to retrieve token (server-only, returns null if not authenticated)
export async function GET(req: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions as any)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const channelId = searchParams.get('channelId')

    if (!channelId) {
      return NextResponse.json({ error: 'Missing channelId' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Get user ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get token
    const { data, error } = await supabase
      .from('tokens')
      .select('access_token, expires_at')
      .eq('user_id', userData.id)
      .eq('channel_id', channelId)
      .single()

    if (error || !data) {
      return NextResponse.json({ data: null })
    }

    // Check if token is expired or about to expire (within 5 minutes)
    const expiresAt = data.expires_at ? new Date(data.expires_at).getTime() : null
    const now = Date.now()
    const timeUntilExpiry = expiresAt ? expiresAt - now : null

    if (timeUntilExpiry && timeUntilExpiry < 5 * 60 * 1000) {
      // Token expired or expiring soon, try to refresh
      console.log('🔄 Token expiring soon, attempting refresh...')
      const refreshedToken = await refreshAccessToken(supabase, userData.id, channelId)
      
      if (refreshedToken) {
        return NextResponse.json({ data: { access_token: refreshedToken, expires_at: new Date(Date.now() + 3600 * 1000).toISOString() } })
      }
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('❌ Token retrieval error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE endpoint to remove token
export async function DELETE(req: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions as any)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { channelId } = body

    if (!channelId) {
      return NextResponse.json({ error: 'Missing channelId' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Get user ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete token
    const { error } = await supabase
      .from('tokens')
      .delete()
      .eq('user_id', userData.id)
      .eq('channel_id', channelId)

    if (error) {
      console.error('❌ Token deletion error:', error)
      return NextResponse.json({ error: 'Failed to delete token' }, { status: 500 })
    }

    console.log('✅ Token deleted for channel:', channelId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Token deletion API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
