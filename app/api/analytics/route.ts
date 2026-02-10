import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { createServerSupabaseClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const channelId = searchParams.get('channelId')

    if (!channelId) {
      return NextResponse.json({ error: 'Missing channelId' }, { status: 400 })
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

    // Get analytics for channel
    const { data, error } = await supabase
      .from('analytics')
      .select('*')
      .eq('user_id', userData.id)
      .eq('channel_id', channelId)
      .single()

    if (error || !data) {
      return NextResponse.json({ data: null })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('❌ Analytics retrieval error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { channelId, totalViews, totalSubscribers, totalWatchTimeHours } = body

    if (!channelId) {
      return NextResponse.json({ error: 'Missing channelId' }, { status: 400 })
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

    // UPSERT: Insert new or update existing analytics for this channel
    const { data, error } = await supabase
      .from('analytics')
      .upsert({
        user_id: userData.id,
        channel_id: channelId,
        total_views: totalViews || 0,
        total_subscribers: totalSubscribers || 0,
        total_watch_time_hours: totalWatchTimeHours || 0,
        last_fetched: new Date().toISOString()
      }, {
        onConflict: 'user_id,channel_id'
      })
      .select()

    if (error) {
      console.error('❌ Analytics storage error:', error)
      return NextResponse.json({ error: 'Failed to store analytics' }, { status: 500 })
    }

    console.log('✅ Analytics stored in database for channel:', channelId)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('❌ Analytics API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
