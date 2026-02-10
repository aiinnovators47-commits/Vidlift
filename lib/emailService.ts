import nodemailer from 'nodemailer'

// Configure nodemailer with Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
})

export interface ChallengeEmailData {
  userEmail: string
  userName?: string
  durationMonths: number
  cadenceEveryDays: number
  videosPerCadence: number
  videoType: 'long' | 'shorts'
  startDate: string
}

/**
 * Send challenge started confirmation email
 */
export async function sendChallengeStartedEmail(data: ChallengeEmailData) {
  try {
    const {
      userEmail,
      userName = 'Creator',
      durationMonths,
      cadenceEveryDays,
      videosPerCadence,
      videoType,
      startDate,
    } = data

    const challengeUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/challenge`

    const preheaderText = 'Your challenge starts today — keep the streak going.'

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.5; color: #333; margin:0; padding:0; }
            .preheader { display:none !important; visibility:hidden; opacity:0; color:transparent; height:0; width:0; }
            .container { max-width: 600px; margin: 0 auto; padding: 18px; }
            .header { background: #4b6ef6; color: white; padding: 26px 16px; border-radius: 10px 10px 0 0; text-align: center; }
            .header h1 { margin: 0; font-size: 22px; line-height:1.2; }
            .header p { margin: 6px 0 0 0; font-size: 13px; opacity: 0.95; }
            .content { background: #ffffff; padding: 18px; border-radius: 0 0 10px 10px; box-shadow: 0 1px 0 rgba(0,0,0,0.04); }
            .details-table { width:100%; border-collapse:collapse; margin-top: 14px; }
            .details-table td { padding:10px 8px; border-bottom:1px solid #f1f3f5; }
            .label { color:#4b6ef6; font-weight:600; }
            .value { text-align:right; color:#222; font-weight:600; }
            .cta { display:block; width:100%; max-width:280px; margin:18px auto; background:#4b6ef6; color:white; text-decoration:none; padding:12px 18px; border-radius:8px; text-align:center; font-weight:700; }
            .note { color:#666; font-size:13px; margin-top:12px; }
            .footer { text-align:center; color:#999; font-size:12px; margin-top:18px; }
            @media screen and (max-width:420px) {
              .container { padding:12px; }
              .header { padding:18px 12px; }
              .header h1 { font-size:18px; }
              .cta { padding:14px 16px; }
            }
          </style>
        </head>
        <body>
          <span class="preheader">${preheaderText}</span>
          <div class="container">
            <div class="header">
              <h1><span style="font-size:20px; margin-right:6px;">🏆🎉</span>Your Challenge Has Started!</h1>
              <p>${preheaderText}</p>
            </div>

            <div class="content">
              <p style="margin:0 0 10px 0;">Hey ${userName},</p>
              <p style="margin:0 0 12px 0; color:#333;"><strong>Nice work — your challenge is live.</strong></p>

              <table class="details-table" role="presentation">
                <tr>
                  <td class="label">Duration</td>
                  <td class="value"><span>${durationMonths}</span> months</td>
                </tr>
                <tr>
                  <td class="label">Upload Frequency</td>
                  <td class="value">Every <strong>${cadenceEveryDays}</strong> day(s)</td>
                </tr>
                <tr>
                  <td class="label">Videos / Upload</td>
                  <td class="value"><strong>${videosPerCadence}</strong></td>
                </tr>
                <tr>
                  <td class="label">Format</td>
                  <td class="value">${videoType === 'shorts' ? 'Shorts (9:16)' : 'Long Video (16:9)'}</td>
                </tr>
                <tr>
                  <td class="label">Start Date</td>
                  <td class="value">${new Date(startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</td>
                </tr>
                <tr>
                  <td class="label" style="color:#1971c2;">Total Videos</td>
                  <td class="value" style="color:#1971c2;"><strong>${Math.max(1, Math.floor((durationMonths * 30) / cadenceEveryDays) * videosPerCadence)}</strong></td>
                </tr>
              </table>

              <a href="${challengeUrl}" class="cta">View Your Challenge</a>

              <p class="note">Track progress, keep your streak, and see analytics in your dashboard.</p>

              <p style="margin-top:14px; color:#444;">Good luck,<br><strong>Yt‑AI Team</strong></p>
            </div>

            <div class="footer">
              <p>This is an automated email — please don’t reply.</p>
              <p>&copy; ${new Date().getFullYear()} Yt‑AI</p>
            </div>
          </div>
        </body>
      </html>
    `

    const totalVideos = Math.max(1, Math.floor((durationMonths * 30) / cadenceEveryDays) * videosPerCadence)

    const plainText = `Hey ${userName},

Your challenge is live — nice work!

Duration: ${durationMonths} months
Upload every: ${cadenceEveryDays} day(s)
Videos per upload: ${videosPerCadence}
Format: ${videoType === 'shorts' ? 'Shorts (9:16)' : 'Long Video (16:9)'}
Start date: ${new Date(startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
Total videos: ${totalVideos}

View your challenge: ${challengeUrl}

Good luck,
Yt-AI Team
`

    const mailOptions = {
      from: `"Yt‑AI Team" <${process.env.SMTP_EMAIL}>`,
      to: userEmail,
      subject: '🏆🎉 Your Yt-AI Challenge Has Started!',
      text: plainText,
      html: htmlContent,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('✅ Challenge started email sent successfully:', {
      messageId: result.messageId,
      to: userEmail,
    })
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error('❌ Failed to send challenge email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send a simple login notification email (for Google sign-in)
 */
export async function sendLoginNotificationEmail({ userEmail, userName = 'Creator', provider = 'Google' }: { userEmail: string; userName?: string; provider?: string }) {
  try {
    const preheader = `${userName} signed in to Yt‑AI using ${provider}`
    const dashboardUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard`
    const settingsUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/settings`

    const html = `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <style>
            body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;margin:0;color:#111}
            .wrap{max-width:640px;margin:0 auto;padding:18px}
            .header{background:#0f172a;color:#fff;padding:20px;border-radius:8px;text-align:center}
            .header h1{margin:0;font-size:20px;line-height:1.2}
            .sub{margin:6px 0 0 0;color:#cbd5e1;font-size:13px}
            .card{background:#fff;padding:18px;border-radius:8px;margin-top:14px;box-shadow:0 1px 0 rgba(0,0,0,0.04)}
            .lead{margin:0 0 10px 0;color:#111;font-weight:600}
            .muted{color:#556; font-size:14px; margin:6px 0 12px 0}
            .features{margin:12px 0 16px 0;padding:0;font-size:14px}
            .features li{margin:8px 0;}
            .check{color:#10b981;margin-right:8px}
            .cta{display:inline-block;background:#0f172a;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:700}
            .footer{color:#9ca3af;font-size:12px;margin-top:12px}
            @media screen and (max-width:420px){.wrap{padding:12px}.header h1{font-size:18px}.cta{display:block;width:100%;text-align:center}}
          </style>
        </head>
        <body>
          <span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0">${preheader}</span>
          <div class="wrap">
            <div class="header">
              <h1>🏆🎉 Welcome back to Yt‑AI</h1>
              <p class="sub">Signed in using ${provider}</p>
            </div>

            <div class="card">
              <p class="lead">Hi ${userName},</p>
              <p class="muted">You're signed in. If this was you, great — enjoy these tools to grow your channel. If you didn't sign in, secure your account immediately.</p>

              <ul class="features">
                <li><span class="check">✅</span>Upload & Schedule videos</li>
                <li><span class="check">✅</span>Title & thumbnail generator</li>
                <li><span class="check">✅</span>Shorts generator & templates</li>
                <li><span class="check">✅</span>Analytics & progress tracking</li>
                <li><span class="check">✅</span>Challenges & streaks</li>
              </ul>

              <p style="margin:12px 0 0 0"><a class="cta" href="${dashboardUrl}">Open Dashboard</a></p>

              <p style="margin:12px 0 0 0;color:#556;font-size:13px">If you didn't sign in, <a href="${settingsUrl}" style="color:#0f172a;text-decoration:underline">secure your account</a> right away.</p>
            </div>

            <div class="footer">This is an automated notification — please don’t reply. &nbsp; © ${new Date().getFullYear()} Yt‑AI</div>
          </div>
        </body>
      </html>`

    const text = `Hi ${userName},

You're signed in to your Yt-AI account using ${provider}.

Key features you can use now:
- Upload & schedule videos
- Title & thumbnail generator
- Shorts templates
- Analytics & progress tracking
- Challenges & streaks

Open dashboard: ${dashboardUrl}
Secure account: ${settingsUrl}

If you didn't sign in, please secure your account immediately.

— Yt-AI Team`

    const mailOptions = {
      from: `"Yt‑AI Team" <${process.env.SMTP_EMAIL}>`,
      to: userEmail,
      subject: '🏆🎉 Welcome back to Yt‑AI',
      text,
      html,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('✅ Login notification email sent:', { messageId: result.messageId, to: userEmail })
    return { success: true, messageId: result.messageId }
  } catch (err) {
    console.warn('⚠️ Failed to send login notification email:', err)
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// New: send a simple broadcast email (subject + text/html)
export async function sendSimpleEmail({ to, subject, text, html }: { to: string; subject: string; text?: string; html?: string }) {
  try {
    const mailOptions = {
      from: `"Yt‑AI Team" <${process.env.SMTP_EMAIL}>`,
      to,
      subject,
      text: text || (html ? html.replace(/<[^>]+>/g, '') : ''),
      html: html || `<p>${text || ''}</p>`
    }
    const res = await transporter.sendMail(mailOptions)
    return { success: true, messageId: res.messageId }
  } catch (err) {
    console.error('Failed to send simple email', err)
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}
