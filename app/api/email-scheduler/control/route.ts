import { NextRequest, NextResponse } from 'next/server'

/**
 * API Endpoint: Email Scheduler Control
 * 
 * GET /api/email-scheduler/control
 * - Returns current scheduler status
 * 
 * POST /api/email-scheduler/control
 * - Body: { "action": "start" | "stop" }
 * - Starts or stops the email scheduler
 * 
 * Requires: CRON_SECRET in Authorization header for security
 */

export async function GET(req: NextRequest) {
  try {
    // Verify authorization
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (token !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Dynamic import to avoid build-time execution
    const { getSchedulerStatus } = await import('@/lib/emailScheduler')
    const status = getSchedulerStatus()

    return NextResponse.json({
      success: true,
      status: {
        ...status,
        uptimeFormatted: formatUptime(status.uptime)
      }
    })

  } catch (error) {
    console.error('Error getting scheduler status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify authorization
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (token !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await req.json()
    const { action } = body

    if (!action || !['start', 'stop'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use "start" or "stop"' },
        { status: 400 }
      )
    }

    // Dynamic import to avoid build-time execution
    const { startEmailScheduler, stopEmailScheduler, getSchedulerStatus } = await import('@/lib/emailScheduler')

    // Execute action
    if (action === 'start') {
      startEmailScheduler()
      return NextResponse.json({
        success: true,
        message: 'Email scheduler started',
        status: getSchedulerStatus()
      })
    } else {
      stopEmailScheduler()
      return NextResponse.json({
        success: true,
        message: 'Email scheduler stopped',
        status: getSchedulerStatus()
      })
    }

  } catch (error) {
    console.error('Error controlling scheduler:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Helper: Format uptime in human-readable format
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)

  return parts.join(' ')
}
