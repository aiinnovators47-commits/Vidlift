import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { testEmail } = await req.json()
    const emailToTest = testEmail || session.user.email

    // Check environment variables
    const smtpEmail = process.env.SMTP_EMAIL
    const smtpPassword = process.env.SMTP_PASSWORD

    const diagnostics: any = {
      smtpConfigured: !!smtpEmail && !!smtpPassword,
      smtpEmail: smtpEmail ? `${smtpEmail.substring(0, 3)}...${smtpEmail.substring(smtpEmail.length - 10)}` : 'NOT SET',
      smtpPassword: smtpPassword ? '***SET***' : 'NOT SET',
      testingEmail: emailToTest,
      timestamp: new Date().toISOString()
    }

    if (!smtpEmail || !smtpPassword) {
      return NextResponse.json(
        {
          error: 'SMTP credentials not configured',
          diagnostics,
          steps: [
            '1. Add SMTP_EMAIL and SMTP_PASSWORD to .env.local',
            '2. Use Gmail account with 2FA enabled',
            '3. Generate App Password from Google Account',
            '4. Restart the development server'
          ]
        },
        { status: 400 }
      )
    }

    // Try to create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpEmail,
        pass: smtpPassword
      }
    })

    // Test connection
    let connectionTest = { success: false, error: null as any }
    try {
      await transporter.verify()
      connectionTest.success = true
    } catch (error: any) {
      connectionTest.error = error.message
    }

    if (!connectionTest.success) {
      return NextResponse.json(
        {
          error: 'SMTP Connection failed',
          diagnostics: { ...diagnostics, connectionTest },
          troubleshooting: [
            '- Check if SMTP_PASSWORD is the Gmail App Password (not regular password)',
            '- Verify 2-factor authentication is enabled on Gmail account',
            '- Check if "Less secure app access" is disabled (recommended)',
            '- Ensure email address is correct in SMTP_EMAIL'
          ]
        },
        { status: 400 }
      )
    }

    // Try to send test email
    let sendResult = { success: false, error: null as any }
    try {
      const info = await transporter.sendMail({
        from: `"YT-AI Test" <${smtpEmail}>`,
        to: emailToTest,
        subject: '✅ YT-AI Email System Test',
        html: `
          <h1>Email System Working!</h1>
          <p>This is a test email from YT-AI Challenge System.</p>
          <p><strong>Status:</strong> ✅ Email configuration is correct</p>
          <p>If you received this, your email notifications are working properly.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            Test sent at: ${new Date().toISOString()}
          </p>
        `
      })
      sendResult.success = true
      diagnostics.messageId = info.messageId
    } catch (error: any) {
      sendResult.error = error.message
    }

    return NextResponse.json({
      success: sendResult.success,
      diagnostics,
      connectionTest,
      sendResult,
      message: sendResult.success
        ? `Test email sent successfully to ${emailToTest}`
        : `Failed to send test email: ${sendResult.error}`,
      solutions: !sendResult.success ? [
        '1. Check email credentials in .env.local',
        '2. Verify SMTP_PASSWORD is the 16-character App Password from Google',
        '3. Enable "Less secure app access" temporarily (not recommended for production)',
        '4. Check Gmail account for suspicious activity alerts',
        '5. Try generating a new App Password'
      ] : null
    })
  } catch (error: any) {
    console.error('Email test error:', error)
    return NextResponse.json(
      {
        error: 'Test failed with error',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
