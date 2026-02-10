import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import { sendChallengeStartedEmail } from '@/lib/emailService'

export const dynamic = 'force-dynamic'

async function resolveUser() {
  const session = await getServerSession()
  if (!session?.user?.email) return null
  const supabase = createServerSupabaseClient()
  const { data: userRow } = await supabase.from('users').select('id,email').eq('email', session.user.email).limit(1).single()
  if (!userRow?.id) return null
  return { supabase, userRow, session }
}

export async function GET(req: Request) {
  try {
    const resolved = await resolveUser()
    if (!resolved) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { supabase, userRow } = resolved

    const { data, error } = await supabase.from('user_challenges').select('*').eq('user_id', userRow.id).eq('status', 'active').limit(1).maybeSingle()
    if (error) {
      console.error('user-challenge GET error', error)
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }
    return NextResponse.json({ challenge: data || null })
  } catch (err: any) {
    console.error('user-challenge GET unexpected', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const resolved = await resolveUser()
    if (!resolved) {
      console.error('user-challenge POST unauthorized: no session')
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 })
    }
    const { supabase, userRow, session } = resolved

    const body = await req.json()
    const config = body.config || {}
    const progress = Array.isArray(body.progress) ? body.progress : []
    const challengeId = body.challengeId || 'creator-challenge'

    // Extract explicit columns from config for easier queries and integrity
    const durationMonths = Number(config?.durationMonths || config?.duration_months || null)
    const cadenceEveryDays = Number(config?.cadenceEveryDays || config?.cadence_every_days || null)
    const videosPerCadence = Number(config?.videosPerCadence || config?.videos_per_cadence || null)
    const videoType = (config?.videoType || config?.video_type || null)
    const scheduledMeta = body.scheduledMeta || body.scheduled_meta || (Array.isArray(progress) ? null : null)

    const payload: any = {
      user_id: userRow.id,
      challenge_id: challengeId,
      started_at: new Date().toISOString(),
      config,
      progress,
      status: 'active',
      updated_at: new Date().toISOString(),
    }

    if (!isNaN(durationMonths)) payload.duration_months = durationMonths
    if (!isNaN(cadenceEveryDays)) payload.cadence_every_days = cadenceEveryDays
    if (!isNaN(videosPerCadence)) payload.videos_per_cadence = videosPerCadence
    if (videoType) payload.video_type = videoType
    if (scheduledMeta) payload.scheduled_meta = scheduledMeta

    console.log('user-challenge POST payload:', { userId: userRow.id, challengeId, cfg: config, progressCount: progress.length })

    let data, error, res
    try {
      res = await supabase.from('user_challenges').upsert(payload, { onConflict: 'user_id,challenge_id' }).select().maybeSingle()
      data = res.data
      error = res.error
      console.log('supabase upsert result', { data, error })
    } catch (e: any) {
      console.error('user-challenge POST exception', e)
      return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
    }

    if (error) {
      console.error('user-challenge POST error', error)
      const msg = error?.message || String(error)
      if (msg.includes('does not exist') || msg.includes('42P01')) {
        return NextResponse.json({ error: 'Missing table user_challenges. Run migrations to create it.' }, { status: 500 })
      }
      if (msg.includes('permission') || msg.includes('RLS')) {
        return NextResponse.json({ error: 'Permission error: RLS may be blocking writes. Check RLS policies and Supabase Auth.' }, { status: 500 })
      }
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    // 🎉 Send confirmation email automatically when challenge starts, but only if the user selected a video type
    if (data?.id && userRow?.email) {
      const shouldSendEmail = !!videoType // only send when video type was provided by the client
      if (shouldSendEmail) {
        try {
          const emailResult = await sendChallengeStartedEmail({
            userEmail: userRow.email,
            userName: session?.user?.name || 'Creator',
            durationMonths: !isNaN(durationMonths) ? durationMonths : 6,
            cadenceEveryDays: !isNaN(cadenceEveryDays) ? cadenceEveryDays : 2,
            videosPerCadence: !isNaN(videosPerCadence) ? videosPerCadence : 1,
            videoType: videoType as 'long' | 'shorts',
            startDate: data.started_at || new Date().toISOString(),
          })
          
          if (emailResult.success) {
            console.log('✅ Challenge confirmation email sent successfully')
          } else {
            console.warn('⚠️ Failed to send challenge email, but challenge was created:', emailResult.error)
          }
        } catch (emailError) {
          console.error('⚠️ Email sending error (non-blocking):', emailError)
          // Don't fail the request if email fails - challenge creation was successful
        }
      } else {
        console.log('ℹ️ Skipping challenge email: video type not selected yet')
      }
    }

    // Return debug info in dev to help debugging
    const debug = process.env.NODE_ENV !== 'production' ? { supabaseResponse: res } : undefined
    return NextResponse.json({ 
      success: true, 
      id: data?.id, 
      challenge: data || null,
      debug 
    }, { status: 200 })
  } catch (err: any) {
    console.error('user-challenge POST unexpected', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const resolved = await resolveUser()
    if (!resolved) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { supabase, userRow } = resolved

    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    const body = await req.json()

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    // Fetch existing row to check for changes (e.g., video_type set later)
    const { data: existingRow, error: existingRowError } = await supabase.from('user_challenges').select('video_type,status,duration_months,cadence_every_days,videos_per_cadence,started_at').eq('id', id).eq('user_id', userRow.id).maybeSingle()
    if (existingRowError) console.warn('Could not fetch existing challenge before patch:', existingRowError)

    const updates: any = { updated_at: new Date().toISOString() }
    if (body.config) updates.config = body.config
    if (body.progress) updates.progress = body.progress
    if (body.status) updates.status = body.status

    // Allow updating explicit columns too
    if (typeof body.durationMonths !== 'undefined') updates.duration_months = Number(body.durationMonths)
    if (typeof body.cadenceEveryDays !== 'undefined') updates.cadence_every_days = Number(body.cadenceEveryDays)
    if (typeof body.videosPerCadence !== 'undefined') updates.videos_per_cadence = Number(body.videosPerCadence)
    if (typeof body.videoType !== 'undefined') updates.video_type = body.videoType
    if (typeof body.scheduledMeta !== 'undefined') updates.scheduled_meta = body.scheduledMeta

    const { data, error } = await supabase.from('user_challenges').update(updates).eq('id', id).eq('user_id', userRow.id).select().maybeSingle()
    if (error) {
      console.error('user-challenge PATCH error', error)
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }

    // If the user just set a video type (it was previously empty), send the confirmation email now
    try {
      const videoTypeWasEmpty = existingRow && !existingRow.video_type
      const videoTypeNowProvided = typeof body.videoType !== 'undefined' && body.videoType
      if (videoTypeWasEmpty && videoTypeNowProvided && data && userRow?.email) {
        const emailResult = await sendChallengeStartedEmail({
          userEmail: userRow.email,
          userName: (userRow as any)?.name || 'Creator',
          durationMonths: Number(data.duration_months || body.durationMonths || existingRow?.duration_months || 6),
          cadenceEveryDays: Number(data.cadence_every_days || body.cadenceEveryDays || existingRow?.cadence_every_days || 2),
          videosPerCadence: Number(data.videos_per_cadence || body.videosPerCadence || existingRow?.videos_per_cadence || 1),
          videoType: (data.video_type as 'long' | 'shorts') || (body.videoType as 'long' | 'shorts'),
          startDate: data.started_at || existingRow?.started_at || new Date().toISOString(),
        })
        if (emailResult.success) console.log('✅ Challenge confirmation email sent after videoType update')
        else console.warn('⚠️ Failed to send challenge email after videoType update:', emailResult.error)
      }
    } catch (e) {
      console.error('Error sending email after PATCH (non-blocking):', e)
    }

    return NextResponse.json({ success: true, challenge: data })
  } catch (err: any) {
    console.error('user-challenge PATCH unexpected', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const resolved = await resolveUser()
    if (!resolved) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { supabase, userRow } = resolved

    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const { data, error } = await supabase.from('user_challenges').update({ status: 'deleted', updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', userRow.id).select().maybeSingle()
    if (error) {
      console.error('user-challenge DELETE error', error)
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('user-challenge DELETE unexpected', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}