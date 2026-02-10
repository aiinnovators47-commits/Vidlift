import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: Request) {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createServerSupabaseClient()

    const { data: notifications, error } = await supabase
      .from('challenge_notifications')
      .select(`
        id,
        challenge_id,
        notification_type,
        email_content,
        email_status,
        ui_read,
        ui_url,
        created_at,
        sent_date,
        user_challenges!inner(id, challenge_title)
      `)
      .eq('user_challenges.user_id', auth.userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json({ error: error.message || 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ notifications: notifications || [] })
  } catch (err: any) {
    console.error('notifications GET unexpected', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { ids, markRead, markAll } = body || {}

    const supabase = createServerSupabaseClient()

    if (markAll) {
      // Get IDs for this user's notifications
      const { data: allRows, error: fetchErr } = await supabase
        .from('challenge_notifications')
        .select('id')
        .eq('user_challenges.user_id', auth.userId)

      if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })

      const idsToUpdate = (allRows || []).map((r: any) => r.id)

      if (idsToUpdate.length === 0) return NextResponse.json({ updated: 0 })

      const { data: updated, error: updateErr } = await supabase
        .from('challenge_notifications')
        .update({ ui_read: true })
        .in('id', idsToUpdate)

      if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

      return NextResponse.json({ updated: updated?.length || 0 })
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 })
    }

    // Ensure the user owns these notifications
    const { data: ownedRows, error: ownedErr } = await supabase
      .from('challenge_notifications')
      .select('id')
      .eq('user_challenges.user_id', auth.userId)
      .in('id', ids)

    if (ownedErr) return NextResponse.json({ error: ownedErr.message }, { status: 500 })

    const allowedIds = (ownedRows || []).map((r: any) => r.id)

    if (allowedIds.length === 0) return NextResponse.json({ updated: 0 })

    const { data: updated, error: updateErr } = await supabase
      .from('challenge_notifications')
      .update({ ui_read: markRead ? true : false })
      .in('id', allowedIds)

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

    return NextResponse.json({ updated: updated?.length || 0 })
  } catch (err: any) {
    console.error('notifications PATCH unexpected', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
