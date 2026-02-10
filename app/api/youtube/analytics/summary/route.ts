import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from 'next-auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getValidAccessToken } from '@/lib/googleTokens'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const channelId = searchParams.get('channelId')

    if (!channelId) return NextResponse.json({ error: 'channelId is required' }, { status: 400 })

    // Resolve server-side access token from session
    const session = await getServerSession()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const supabase = createServerSupabaseClient()
    const { data: userRow } = await supabase
      .from('users')
      .select('id,email')
      .eq('email', session.user.email)
      .limit(1)
      .single()
    if (!userRow?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const accessToken = await getValidAccessToken(userRow.id)
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized. Please reconnect Google.' }, { status: 401 })

    const endDate = new Date().toISOString().slice(0, 10)
    const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    // Channel-level summary
    const summaryUrl = `https://youtubeanalytics.googleapis.com/v2/reports?dimensions=day&metrics=views,estimatedMinutesWatched,averageViewDuration&startDate=${startDate}&endDate=${endDate}&filters=channel==${channelId}`
    const summaryRes = await fetch(summaryUrl, { headers: { Authorization: `Bearer ${accessToken}` } })
    const summaryData = summaryRes.ok ? await summaryRes.json().catch(()=>({})) : {}

    // Top videos by views
    const topVideosUrl = `https://youtubeanalytics.googleapis.com/v2/reports?dimensions=video&metrics=views,estimatedMinutesWatched,averageViewDuration&startDate=${startDate}&endDate=${endDate}&filters=channel==${channelId}&sort=-views&limit=5`
    const topVideosRes = await fetch(topVideosUrl, { headers: { Authorization: `Bearer ${accessToken}` } })
    const topVideosData = topVideosRes.ok ? await topVideosRes.json().catch(()=>({})) : {}

    // Parse rows
    const summaryRows = Array.isArray(summaryData.rows) ? summaryData.rows : []
    const totalViews = summaryRows.reduce((s:any,row:any)=>s + Number(row[1]||0), 0)
    const totalWatchMinutes = summaryRows.reduce((s:any,row:any)=>s + Number(row[2]||0), 0)

    const topVideoRows = Array.isArray(topVideosData.rows) ? topVideosData.rows : []
    const topVideos = topVideoRows.map((r:any) => ({ videoId: r[0], views: Number(r[1]||0), watchMinutes: Number(r[2]||0), avgViewDuration: Number(r[3]||0) }))

    return NextResponse.json({ success: true, summary: { totalViews, totalWatchMinutes }, topVideos, raw: { summaryData, topVideosData } })
  } catch (error: any) {
    console.error('analytics/summary error', error)
    return NextResponse.json({ error: 'Internal server error', details: error?.message || String(error) }, { status: 500 })
  }
}
