import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, type Session } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { createServerSupabaseClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * Helper to create response with instruction to cache channels in localStorage
 * The client will receive this hint and save channels locally for instant future access
 */
function createChannelResponse(channels: any[], isPrimary = false) {
  const primary = channels.find(ch => ch.is_primary)
  return NextResponse.json({ 
    success: true, 
    channels,
    cacheHint: {
      action: 'saveToLocalStorage',
      timestamp: new Date().toISOString(),
      primaryChannel: primary ? {
        id: primary.channel_id,
        title: primary.title,
        thumbnail: primary.thumbnail
      } : null
    }
  })
}

export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions as any)) as Session | null
    const userEmail = (session as any)?.user?.email
    if (!session || !userEmail) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await req.json()
    const {
      channelId,
      title,
      description,
      thumbnail,
      subscriberCount,
      videoCount,
      viewCount,
      isPrimary = false,
      storeAccessToken = false
    } = body

    if (!channelId || !title) {
      return NextResponse.json({ error: 'channelId and title are required' }, { status: 400 })
    }

    // Find user by email
    const supabase = createServerSupabaseClient()

    let { data: userRow, error: userErr } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .limit(1)
      .single()

    // If user doesn't exist, create them
    if (userErr || !userRow) {
      console.warn('User not found, creating new user:', userEmail)
      const { data: newUser, error: createErr } = await supabase
        .from('users')
        .insert({
          email: userEmail,
          name: (session?.user as any)?.name || userEmail.split('@')[0],
          image: (session?.user as any)?.image || null,
        })
        .select('id')
        .single()

      if (createErr || !newUser) {
        console.error('Failed to create user:', createErr)
        return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 })
      }
      userRow = newUser
    }

    const userId = userRow.id

    // If isPrimary, unset previous primary channels for this user
    if (isPrimary) {
      await supabase.from('channels').update({ is_primary: false }).eq('user_id', userId)
    }

    // Insert or update channel - ONLY store these fields
    const now = new Date().toISOString()
    
    const channelData = {
      user_id: userId,
      channel_id: channelId,
      title,
      description,
      thumbnail,
      subscriber_count: subscriberCount,
      video_count: videoCount,
      view_count: viewCount,
      is_primary: isPrimary,
      access_token_stored: storeAccessToken || false,
      connected_at: now,
      updated_at: now
    }

    // First try to insert
    let upserted: any = null
    let upsertErr: any = null
    
    const { data: insertData, error: insertErr } = await supabase
      .from('channels')
      .insert(channelData)
      .select()

    if (insertErr) {
      // If insert fails due to duplicate key, try update
      if (insertErr.code === '23505') {
        const { data: updateData, error: updateErr } = await supabase
          .from('channels')
          .update(channelData)
          .match({ user_id: userId, channel_id: channelId })
          .select()
        
        upserted = updateData
        upsertErr = updateErr
      } else {
        upsertErr = insertErr
      }
    } else {
      upserted = insertData
    }

    if (upsertErr) {
      console.error('❌ Supabase channel save error:', upsertErr)
      return NextResponse.json({ error: `Failed to save channel: ${upsertErr.message}` }, { status: 500 })
    }

    console.log('✅ Channel saved successfully:', { userId, channelId, title })
    
    // Return response with caching hint for client to save to localStorage
    return NextResponse.json({ 
      success: true, 
      channel: upserted,
      cacheHint: {
        action: 'saveToLocalStorage',
        message: 'Client should cache this channel in localStorage for instant future access'
      }
    })
  } catch (err: any) {
    console.error('/api/channels POST error', err)
    return NextResponse.json({ error: `Internal server error: ${err.message}` }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    const userEmail = (session as any)?.user?.email
    if (!session || !userEmail) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()
    let { data: userRow, error: userErr } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .limit(1)
      .single()

    // If user doesn't exist, create them
    if (userErr || !userRow) {
      console.warn('User not found in GET, creating new user:', userEmail)
      const { data: newUser, error: createErr } = await supabase
        .from('users')
        .insert({
          email: userEmail,
          name: (session?.user as any)?.name || userEmail.split('@')[0],
          image: (session?.user as any)?.image || null,
        })
        .select('id')
        .single()

      if (createErr || !newUser) {
        console.error('Failed to create user:', createErr)
        return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 })
      }
      userRow = newUser
    }

    const userId = userRow.id
    const { data: channels, error } = await supabase
      .from('channels')
      .select('*')
      .eq('user_id', userId)
      .order('is_primary', { ascending: false })
      .order('connected_at', { ascending: false })

    if (error) {
      console.error('/api/channels GET supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 })
    }

    console.log(`✅ Fetched ${channels?.length || 0} channels for user - client will cache in localStorage`)
    
    // Return response with caching hint so client saves channels to localStorage
    return createChannelResponse(channels || [])
  } catch (err: any) {
    console.error('/api/channels GET error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    const userEmail = (session as any)?.user?.email
    if (!session || !userEmail) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const url = new URL(req.url)
    const channelId = url.searchParams.get('channelId')
    if (!channelId) return NextResponse.json({ error: 'channelId required' }, { status: 400 })

    const supabase = createServerSupabaseClient()
    const { data: userRow, error: userErr } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .limit(1)
      .single()

    if (userErr || !userRow) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { error } = await supabase.from('channels').delete().match({ user_id: userRow.id, channel_id: channelId })
    if (error) return NextResponse.json({ error: 'Channel not found or failed to delete' }, { status: 404 })

    return NextResponse.json({ success: true, removed: true })
  } catch (err: any) {
    console.error('/api/channels DELETE error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}