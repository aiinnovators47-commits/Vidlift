import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import { sendSimpleEmail } from '@/lib/emailService'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Basic check: only allow site admins - you can expand this later
    const adminEmail = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(s => s.trim()) : []
    if (adminEmail.length > 0 && !adminEmail.includes(session.user.email || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createServerSupabaseClient()
    const { data: users, error } = await supabase.from('users').select('id,email,display_name').not('email', 'is', null)

    if (error) {
      console.error('Failed to list users for broadcast:', error)
      return NextResponse.json({ error: 'Failed to list users' }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ success: true, message: 'No users to notify' })
    }

    const subject = 'You got extra points!'
    const html = `
      <div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Arial; color: #111;">
        <h2 style="color:#111;">You received extra points 🎉</h2>
        <p>We awarded you extra points for your achievements. Check your dashboard to view your updated points and progress.</p>
        <p><a href="${process.env.NEXTAUTH_URL || 'https://your-site.example.com'}/dashboard">Open Dashboard</a></p>
        <p style="color:#777; font-size:12px;">This is an automated notification. Please do not reply.</p>
      </div>
    `

    // Send in small batches to avoid SMTP rate limits
    const batchSize = 20
    const batches: Array<Promise<any>> = []
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize).map(u => {
        return sendSimpleEmail({ to: u.email, subject, html })
      })
      batches.push(Promise.all(batch))
      // optional: small delay between batches could be added
    }

    const results = await Promise.all(batches)

    return NextResponse.json({ success: true, totalSent: users.length, results })
  } catch (err: any) {
    console.error('Error sending broadcast extra points email:', err)
    return NextResponse.json({ error: err.message || 'Failed' }, { status: 500 })
  }
}