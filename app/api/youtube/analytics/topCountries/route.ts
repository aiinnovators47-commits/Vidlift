import { NextRequest, NextResponse } from "next/server"

// This route must run dynamically because it reads req.url
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const channelId = searchParams.get('channelId')
    const accessToken = searchParams.get('access_token')

    if (!channelId) return NextResponse.json({ error: 'channelId is required' }, { status: 400 })
    if (!accessToken) return NextResponse.json({ error: 'access_token is required' }, { status: 401 })

    // Use last 365 days as default range
    const endDate = new Date().toISOString().slice(0, 10)
    const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    const analyticsUrl = `https://youtubeanalytics.googleapis.com/v2/reports?dimensions=country&metrics=views&sort=-views&startDate=${startDate}&endDate=${endDate}&filters=channel==${channelId}`

    const res = await fetch(analyticsUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return NextResponse.json({ error: 'Failed to fetch analytics', details: err }, { status: res.status })
    }

    const data = await res.json()

    // `rows` is an array of [countryCode, views]
    const rows = Array.isArray(data.rows) ? data.rows : []
    const countries = rows.slice(0, 10).map((r: any) => ({ country: r[0], views: Number(r[1] || 0) }))

    return NextResponse.json({ success: true, countries, raw: data })
  } catch (error: any) {
    console.error('Analytics topCountries error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error?.message || String(error) }, { status: 500 })
  }
}
