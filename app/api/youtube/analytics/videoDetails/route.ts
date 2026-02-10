import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const accessToken = searchParams.get('access_token')
        const videoId = searchParams.get('videoId')
        const channelId = searchParams.get('channelId')

        if (!accessToken) {
            return NextResponse.json(
                { error: 'Access token is required' },
                { status: 401 }
            )
        }

        if (!videoId) {
            return NextResponse.json(
                { error: 'Video ID is required' },
                { status: 400 }
            )
        }

        const today = new Date()
        const endDate = today.toISOString().split('T')[0]

        // Get date from 365 days ago
        const startDate = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0]

        // Fetch various analytics data
        const analyticsData: any = {
            demographics: null,
            trafficSources: null,
            deviceTypes: null,
            engagement: null,
        }

        // 1. Demographics (Age and Gender)
        try {
            const demographicsUrl = `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${channelId}&startDate=${startDate}&endDate=${endDate}&metrics=viewerPercentage&dimensions=ageGroup,gender&filters=video==${videoId}&sort=-viewerPercentage`

            const demographicsResponse = await fetch(demographicsUrl, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            })

            if (demographicsResponse.ok) {
                const data = await demographicsResponse.json()
                analyticsData.demographics = data
            }
        } catch (error) {
            console.error('Error fetching demographics:', error)
        }

        // 2. Traffic Sources
        try {
            const trafficSourcesUrl = `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${channelId}&startDate=${startDate}&endDate=${endDate}&metrics=views,estimatedMinutesWatched&dimensions=insightTrafficSourceType&filters=video==${videoId}&sort=-views&maxResults=10`

            const trafficSourcesResponse = await fetch(trafficSourcesUrl, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            })

            if (trafficSourcesResponse.ok) {
                const data = await trafficSourcesResponse.json()
                analyticsData.trafficSources = data
            }
        } catch (error) {
            console.error('Error fetching traffic sources:', error)
        }

        // 3. Device Types
        try {
            const deviceTypesUrl = `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${channelId}&startDate=${startDate}&endDate=${endDate}&metrics=views,estimatedMinutesWatched&dimensions=deviceType&filters=video==${videoId}&sort=-views`

            const deviceTypesResponse = await fetch(deviceTypesUrl, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            })

            if (deviceTypesResponse.ok) {
                const data = await deviceTypesResponse.json()
                analyticsData.deviceTypes = data
            }
        } catch (error) {
            console.error('Error fetching device types:', error)
        }

        // 4. Daily Engagement Metrics (last 90 days)
        try {
            const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split('T')[0]

            const engagementUrl = `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${channelId}&startDate=${ninetyDaysAgo}&endDate=${endDate}&metrics=views,likes,comments,shares,estimatedMinutesWatched,averageViewDuration&dimensions=day&filters=video==${videoId}&sort=day`

            const engagementResponse = await fetch(engagementUrl, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            })

            if (engagementResponse.ok) {
                const data = await engagementResponse.json()
                analyticsData.engagement = data
            }
        } catch (error) {
            console.error('Error fetching engagement metrics:', error)
        }

        // 5. Geographic Data (already handled in topCountries endpoint, but we can include it here too)
        try {
            const geoUrl = `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${channelId}&startDate=${startDate}&endDate=${endDate}&metrics=views,estimatedMinutesWatched&dimensions=country&filters=video==${videoId}&sort=-views&maxResults=25`

            const geoResponse = await fetch(geoUrl, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            })

            if (geoResponse.ok) {
                const data = await geoResponse.json()
                analyticsData.geography = data
            }
        } catch (error) {
            console.error('Error fetching geographic data:', error)
        }

        return NextResponse.json({
            success: true,
            data: analyticsData,
        })
    } catch (error) {
        console.error('Error fetching video analytics:', error)
        return NextResponse.json(
            { error: 'Failed to fetch video analytics' },
            { status: 500 }
        )
    }
}
