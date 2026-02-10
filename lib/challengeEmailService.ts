import nodemailer from 'nodemailer'
import { Challenge, CHALLENGE_TEMPLATES } from '@/types/challenge'

if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
  console.warn('Warning: SMTP_EMAIL or SMTP_PASSWORD not set — email sending will fail.')
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
})

export interface ChallengeEmailContext {
  userEmail: string
  userName: string
  challenge: Challenge
  timeUntilDeadline?: string
  streakCount?: number
  completionPercentage?: number
  pointsEarned?: number
  missedDays?: number
  isOnTime?: boolean
  penaltyPoints?: number
}

// Welcome Email - Challenge Started
export async function sendChallengeWelcomeEmail(context: ChallengeEmailContext) {
  try {
    const { userEmail, userName, challenge } = context
    const template = CHALLENGE_TEMPLATES[challenge.challengeType as keyof typeof CHALLENGE_TEMPLATES]
    const targetVideos = template?.targetVideos || Math.ceil((challenge.durationMonths || 1) * 30 / (challenge.cadenceEveryDays || 1))

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
            .stat-card { background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; }
            .stat-number { font-size: 24px; font-weight: bold; color: #667eea; margin-bottom: 5px; }
            .cta-button { background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; font-weight: bold; }
            .tips { background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { background: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚀 Challenge Started!</h1>
              <h2>${challenge.challengeTitle}</h2>
              <p>Welcome to your YouTube consistency journey, ${userName}!</p>
            </div>
            
            <div class="content">
              <p>Congratulations! You've just started your <strong>${challenge.challengeTitle}</strong> challenge. Here's what you've committed to:</p>
              
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-number">${targetVideos}</div>
                  <div>Total Videos</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${challenge.durationMonths || Math.ceil((challenge.durationMonths || 1) * 30 / 30)}</div>
                  <div>Months</div>
                </div>
              </div>

              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-number">Every ${challenge.cadenceEveryDays || 1}</div>
                  <div>Day(s)</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${challenge.videoType || 'Mixed'}</div>
                  <div>Video Type</div>
                </div>
              </div>

              <div class="tips">
                <h3>💡 Success Tips:</h3>
                <ul>
                  <li><strong>Plan ahead:</strong> Create a content calendar with video ideas</li>
                  <li><strong>Batch create:</strong> Film multiple videos when you have time</li>
                  <li><strong>Stay consistent:</strong> Upload at the same time each day/week</li>
                  <li><strong>Track progress:</strong> Use our dashboard to monitor your streak</li>
                  <li><strong>Don't give up:</strong> Even if you miss a day, get back on track immediately</li>
                </ul>
              </div>

              <div style="text-align: center;">
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/challenge" class="cta-button">
                  View Challenge Dashboard
                </a>
              </div>

              <p>We'll send you reminder emails before each deadline to help you stay on track. You can adjust these notifications in your settings anytime.</p>
              
              <p>Ready to build the ultimate YouTube habit? Let's go! 🎬</p>
            </div>

            <div class="footer">
              <p>Good luck with your challenge!</p>
              <p>The YT-AI Team</p>
              <p><a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/settings">Notification Settings</a> | <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/challenge">Dashboard</a></p>
            </div>
          </div>
        </body>
      </html>
    `

    await transporter.sendMail({
      from: `"YT-AI Challenges" <${process.env.SMTP_EMAIL}>`,
      to: userEmail,
      subject: `🚀 Your ${challenge.challengeTitle} has started!`,
      html: htmlContent
    })

    console.log(`Welcome email sent to ${userEmail}`)
  } catch (error) {
    console.error('Error sending welcome email:', error)
    throw error
  }
}

// Upload Reminder Email
export async function sendUploadReminderEmail(context: ChallengeEmailContext) {
  try {
    const { userEmail, userName, challenge, timeUntilDeadline } = context
    const urgency = timeUntilDeadline?.includes('hour') ? 'urgent' : 'normal'
    const urgencyColor = urgency === 'urgent' ? '#ef4444' : '#3b82f6'
    const urgencyEmoji = urgency === 'urgent' ? '⏰' : '📅'

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: ${urgencyColor}; color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .deadline-box { background: ${urgencyColor}15; border: 2px solid ${urgencyColor}; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
            .deadline-time { font-size: 24px; font-weight: bold; color: ${urgencyColor}; margin: 10px 0; }
            .progress-stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 20px 0; }
            .stat { background: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; }
            .stat-number { font-size: 18px; font-weight: bold; color: #334155; }
            .cta-button { background: ${urgencyColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; font-weight: bold; }
            .tips { background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9; }
            .footer { background: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${urgencyEmoji} Upload Reminder</h1>
              <h2>${challenge.challengeTitle}</h2>
              <p>Don't break your streak, ${userName}!</p>
            </div>
            
            <div class="content">
              <div class="deadline-box">
                <h3>⏰ Your next upload is due</h3>
                <div class="deadline-time">${timeUntilDeadline || 'Soon'}</div>
                <p>Keep your consistency streak alive!</p>
              </div>

              <p>Hi ${userName},</p>
              <p>This is a friendly reminder that your next video upload for the <strong>${challenge.challengeTitle}</strong> is coming up.</p>

              <h3>📊 Your Progress So Far:</h3>
              <div class="progress-stats">
                <div class="stat">
                  <div class="stat-number">${challenge.uploads?.length || 0}</div>
                  <div>Videos Uploaded</div>
                </div>
                <div class="stat">
                  <div class="stat-number">${challenge.streakCount || 0}</div>
                  <div>Current Streak</div>
                </div>
                <div class="stat">
                  <div class="stat-number">${Math.round(challenge.completionPercentage || 0)}%</div>
                  <div>Completed</div>
                </div>
              </div>

              ${challenge.streakCount && challenge.streakCount > 0 ? `
                <div class="tips">
                  <h4>🔥 You're on fire!</h4>
                  <p>You've maintained your streak for <strong>${challenge.streakCount} day(s)</strong>! Don't let this momentum go to waste. Every upload gets you closer to your goal.</p>
                </div>
              ` : `
                <div class="tips">
                  <h4>💪 Get Back on Track</h4>
                  <p>Every creator faces challenges. The key is consistency and not giving up. Upload today and start building that streak!</p>
                </div>
              `}

              <div style="text-align: center;">
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/challenge" class="cta-button">
                  Upload & Track Progress
                </a>
              </div>

              <p>Remember: The goal isn't perfection, it's consistency. Every upload matters, and your audience is waiting to see what you create next!</p>
            </div>

            <div class="footer">
              <p>You've got this! 💪</p>
              <p>The YT-AI Team</p>
              <p><a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/settings">Manage Notifications</a> | <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/challenge">Dashboard</a></p>
            </div>
          </div>
        </body>
      </html>
    `

    await transporter.sendMail({
      from: `"YT-AI Challenges" <${process.env.SMTP_EMAIL}>`,
      to: userEmail,
      subject: `${urgencyEmoji} ${urgency === 'urgent' ? 'URGENT: ' : ''}Your upload is due ${timeUntilDeadline || 'soon'}!`,
      html: htmlContent
    })

    console.log(`Reminder email sent to ${userEmail}`)
  } catch (error) {
    console.error('Error sending reminder email:', error)
    throw error
  }
}

// Streak Achievement Email
export async function sendStreakAchievementEmail(context: ChallengeEmailContext) {
  try {
    const { userEmail, userName, challenge, streakCount } = context
    const milestones = [7, 14, 30, 60, 90]
    const currentMilestone = milestones.find(m => m === streakCount)
    
    if (!currentMilestone) return // Only send for specific milestones

    const getMilestoneEmoji = (streak: number) => {
      if (streak >= 90) return '🏆'
      if (streak >= 60) return '💎'
      if (streak >= 30) return '🥇'
      if (streak >= 14) return '🥈'
      return '🥉'
    }

    const getMilestoneTitle = (streak: number) => {
      if (streak >= 90) return 'Legend'
      if (streak >= 60) return 'Master'
      if (streak >= 30) return 'Champion'
      if (streak >= 14) return 'Warrior'
      return 'Achiever'
    }

    const emoji = getMilestoneEmoji(currentMilestone)
    const title = getMilestoneTitle(currentMilestone)

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: white; padding: 40px; text-align: center; }
            .content { padding: 30px; }
            .achievement-box { background: #fef3c7; border: 2px solid #fbbf24; padding: 30px; border-radius: 12px; text-align: center; margin: 30px 0; }
            .streak-number { font-size: 48px; font-weight: bold; color: #f59e0b; margin: 20px 0; }
            .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
            .stat-card { background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; }
            .stat-number { font-size: 24px; font-weight: bold; color: #667eea; margin-bottom: 5px; }
            .cta-button { background: #f59e0b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; font-weight: bold; }
            .motivational { background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
            .footer { background: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${emoji} Achievement Unlocked!</h1>
              <h2>${currentMilestone}-Day Streak ${title}</h2>
              <p>Outstanding consistency, ${userName}!</p>
            </div>
            
            <div class="content">
              <div class="achievement-box">
                <div style="font-size: 64px; margin-bottom: 20px;">${emoji}</div>
                <h2>${title} Status Achieved!</h2>
                <div class="streak-number">${currentMilestone} Days</div>
                <p>You've maintained your upload streak for <strong>${currentMilestone} consecutive days</strong>!</p>
              </div>

              <p>Hi ${userName},</p>
              <p>We're absolutely thrilled to celebrate this incredible milestone with you! Reaching a ${currentMilestone}-day streak is no small feat – it shows true dedication and commitment to your YouTube journey.</p>

              <h3>📊 Your Amazing Stats:</h3>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-number">${challenge.uploads?.length || 0}</div>
                  <div>Total Videos</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${challenge.pointsEarned || 0}</div>
                  <div>Points Earned</div>
                </div>
              </div>

              <div class="motivational">
                <h4>🌟 What this achievement means:</h4>
                <ul>
                  <li><strong>Discipline:</strong> You've shown incredible self-discipline</li>
                  <li><strong>Growth:</strong> Your audience has been consistently engaged</li>
                  <li><strong>Momentum:</strong> You're building unstoppable momentum</li>
                  <li><strong>Inspiration:</strong> You're inspiring other creators to be consistent</li>
                </ul>
              </div>

              <div style="text-align: center;">
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/challenge" class="cta-button">
                  Keep the Streak Going!
                </a>
              </div>

              <p>The best part? You're just getting started! Each day you maintain this streak, you're not just creating content – you're building a brand, growing an audience, and developing the habits that separate successful creators from the rest.</p>
              
              <p>Keep up the fantastic work, and let's see how far you can take this streak! 🚀</p>
            </div>

            <div class="footer">
              <p>Congratulations again on this amazing achievement! 🎉</p>
              <p>The YT-AI Team</p>
              <p><a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/challenge">View Your Progress</a></p>
            </div>
          </div>
        </body>
      </html>
    `

    await transporter.sendMail({
      from: `"YT-AI Challenges" <${process.env.SMTP_EMAIL}>`,
      to: userEmail,
      subject: `🎉 ${emoji} Achievement Unlocked: ${currentMilestone}-Day Streak ${title}!`,
      html: htmlContent
    })

    console.log(`Streak achievement email sent to ${userEmail} for ${currentMilestone} days`)
  } catch (error) {
    console.error('Error sending streak achievement email:', error)
    throw error
  }
}

// Challenge Completion Email
export async function sendChallengeCompletionEmail(context: ChallengeEmailContext) {
  try {
    const { userEmail, userName, challenge, pointsEarned, missedDays } = context
    const isPerfect = (missedDays || 0) === 0
    const completionEmoji = isPerfect ? '🏆' : '🎉'
    const completionTitle = isPerfect ? 'PERFECT COMPLETION' : 'CHALLENGE COMPLETED'

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px; text-align: center; }
            .content { padding: 30px; }
            .completion-box { background: ${isPerfect ? '#fef3c7' : '#dcfce7'}; border: 2px solid ${isPerfect ? '#f59e0b' : '#22c55e'}; padding: 30px; border-radius: 12px; text-align: center; margin: 30px 0; }
            .stats-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin: 30px 0; }
            .stat-card { background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; }
            .stat-number { font-size: 24px; font-weight: bold; color: #059669; margin-bottom: 5px; }
            .achievement-list { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .cta-button { background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; font-weight: bold; }
            .next-challenge { background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
            .footer { background: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${completionEmoji} ${completionTitle}!</h1>
              <h2>${challenge.challengeTitle}</h2>
              <p>Incredible work, ${userName}!</p>
            </div>
            
            <div class="content">
              <div class="completion-box">
                <div style="font-size: 64px; margin-bottom: 20px;">${completionEmoji}</div>
                <h2>${isPerfect ? 'PERFECT SCORE!' : 'Challenge Complete!'}</h2>
                <p>You've successfully completed your <strong>${challenge.challengeTitle}</strong>${isPerfect ? ' without missing a single day!' : '!'}</p>
              </div>

              <p>Hi ${userName},</p>
              <p>Congratulations! You've just accomplished something that many creators dream of but few achieve – completing a full consistency challenge. This is a testament to your dedication, discipline, and commitment to your YouTube growth.</p>

              <h3>📊 Your Final Results:</h3>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-number">${challenge.uploads?.length || 0}</div>
                  <div>Videos Created</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${challenge.longestStreak || 0}</div>
                  <div>Longest Streak</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${pointsEarned || challenge.pointsEarned || 0}</div>
                  <div>Total Points</div>
                </div>
              </div>

              <div class="achievement-list">
                <h4>🏅 What you've achieved:</h4>
                <ul>
                  <li><strong>Consistency:</strong> Built the habit of regular content creation</li>
                  <li><strong>Growth:</strong> Provided value to your audience consistently</li>
                  <li><strong>Discipline:</strong> Showed up even when you didn't feel like it</li>
                  <li><strong>Progress:</strong> Made significant strides in your YouTube journey</li>
                  ${isPerfect ? '<li><strong>Perfection:</strong> Achieved a flawless completion record</li>' : ''}
                </ul>
              </div>

              <div class="next-challenge">
                <h4>🚀 Ready for your next challenge?</h4>
                <p>You've proven you have what it takes to be consistent. Why not level up with a more ambitious challenge? Your audience is waiting to see what you create next!</p>
              </div>

              <div style="text-align: center;">
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/challenge" class="cta-button">
                  Start Your Next Challenge
                </a>
              </div>

              <p>Your journey as a consistent creator is just beginning. Use the momentum you've built to continue growing your channel and serving your audience. You've got this! 🌟</p>
            </div>

            <div class="footer">
              <p>We're incredibly proud of your achievement! 🎊</p>
              <p>The YT-AI Team</p>
              <p><a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/challenge">View Your Stats</a> | <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/challenge">Start New Challenge</a></p>
            </div>
          </div>
        </body>
      </html>
    `

    await transporter.sendMail({
      from: `"YT-AI Challenges" <${process.env.SMTP_EMAIL}>`,
      to: userEmail,
      subject: `${completionEmoji} ${completionTitle}: ${challenge.challengeTitle}!`,
      html: htmlContent
    })

    console.log(`Challenge completion email sent to ${userEmail}`)
  } catch (error) {
    console.error('Error sending completion email:', error)
    throw error
  }
}

// Upload Confirmation Email
export async function sendUploadConfirmationEmail(context: ChallengeEmailContext) {
  try {
    const { userEmail, userName, challenge, pointsEarned, streakCount, isOnTime } = context
    const bonusText = isOnTime ? '🎉 On-Time Bonus!' : '✅ Upload Recorded'

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: ${isOnTime ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'}; color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .points-box { background: ${isOnTime ? '#dcfce7' : '#dbeafe'}; border: 2px solid ${isOnTime ? '#10b981' : '#3b82f6'}; padding: 25px; border-radius: 8px; text-align: center; margin: 20px 0; }
            .points-number { font-size: 48px; font-weight: bold; color: ${isOnTime ? '#10b981' : '#3b82f6'}; margin: 10px 0; }
            .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
            .stat { background: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; }
            .stat-number { font-size: 20px; font-weight: bold; color: #334155; }
            .bonus-badge { background: #fef3c7; color: #92400e; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 10px 0; font-weight: bold; }
            .cta-button { background: ${isOnTime ? '#10b981' : '#3b82f6'}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; font-weight: bold; }
            .footer { background: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${bonusText}</h1>
              <h2>${challenge.challengeTitle}</h2>
              <p>Great work, ${userName}!</p>
            </div>
            
            <div class="content">
              <div class="points-box">
                <h3>🏆 Points Earned</h3>
                <div class="points-number">+${pointsEarned || 0}</div>
                ${isOnTime ? '<div class="bonus-badge">⚡ On-Time Bonus Included!</div>' : ''}
                ${streakCount && streakCount > 1 ? `<div class="bonus-badge">🔥 ${streakCount}-Day Streak Bonus!</div>` : ''}
              </div>

              <p>Hi ${userName},</p>
              <p>Fantastic job! Your video upload has been recorded and points have been added to your challenge score.</p>

              <h3>📊 Current Progress:</h3>
              <div class="stats-grid">
                <div class="stat">
                  <div class="stat-number">${streakCount || 0} 🔥</div>
                  <div>Current Streak</div>
                </div>
                <div class="stat">
                  <div class="stat-number">${challenge.uploads?.length || 0}</div>
                  <div>Total Uploads</div>
                </div>
                <div class="stat">
                  <div class="stat-number">${Math.round(challenge.completionPercentage || 0)}%</div>
                  <div>Challenge Progress</div>
                </div>
                <div class="stat">
                  <div class="stat-number">${challenge.pointsEarned || 0}</div>
                  <div>Total Points</div>
                </div>
              </div>

              ${isOnTime ? `
                <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                  <h4>🎯 Perfect Timing!</h4>
                  <p>You uploaded before the deadline, earning you extra bonus points! Keep this momentum going to maximize your score.</p>
                </div>
              ` : ''}

              ${streakCount && streakCount >= 7 ? `
                <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                  <h4>🔥 You're on Fire!</h4>
                  <p>A ${streakCount}-day streak is incredible! You're building the habits of a successful YouTuber. Don't stop now!</p>
                </div>
              ` : ''}

              <div style="text-align: center;">
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/challenge" class="cta-button">
                  View Full Dashboard
                </a>
              </div>

              <p>Keep up the amazing work! Every upload brings you closer to your goals. 🚀</p>
            </div>

            <div class="footer">
              <p>Keep going, you're doing great!</p>
              <p>The YT-AI Team</p>
              <p><a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/challenge">Dashboard</a> | <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/settings">Settings</a></p>
            </div>
          </div>
        </body>
      </html>
    `

    await transporter.sendMail({
      from: `"YT-AI Challenges" <${process.env.SMTP_EMAIL}>`,
      to: userEmail,
      subject: `${bonusText} - ${pointsEarned} points earned!`,
      html: htmlContent
    })

    console.log(`Upload confirmation email sent to ${userEmail}`)
  } catch (error) {
    console.error('Error sending confirmation email:', error)
    throw error
  }
}

// Missed Upload Email
export async function sendMissedUploadEmail(context: ChallengeEmailContext) {
  try {
    const { userEmail, userName, challenge, penaltyPoints, missedDays } = context

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .warning-box { background: #fef2f2; border: 2px solid #ef4444; padding: 25px; border-radius: 8px; margin: 20px 0; }
            .penalty-number { font-size: 36px; font-weight: bold; color: #ef4444; text-align: center; margin: 10px 0; }
            .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
            .stat { background: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; }
            .stat-number { font-size: 20px; font-weight: bold; color: #334155; }
            .recovery-box { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
            .cta-button { background: #ef4444; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; font-weight: bold; }
            .footer { background: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Missed Upload</h1>
              <h2>${challenge.challengeTitle}</h2>
              <p>Don't let this setback stop you!</p>
            </div>
            
            <div class="content">
              <div class="warning-box">
                <h3 style="text-align: center; margin-top: 0;">📉 Points Deducted</h3>
                <div class="penalty-number">-${penaltyPoints || 50}</div>
                <p style="text-align: center; margin-bottom: 0;">Your streak has been reset to 0</p>
              </div>

              <p>Hi ${userName},</p>
              <p>We noticed you missed your scheduled upload deadline for the <strong>${challenge.challengeTitle}</strong>. The deadline has passed and a penalty has been applied to your score.</p>

              <h3>📊 Current Status:</h3>
              <div class="stats-grid">
                <div class="stat">
                  <div class="stat-number">${missedDays || 0}</div>
                  <div>Missed Days</div>
                </div>
                <div class="stat">
                  <div class="stat-number">0 🔥</div>
                  <div>Current Streak</div>
                </div>
                <div class="stat">
                  <div class="stat-number">${Math.round(challenge.completionPercentage || 0)}%</div>
                  <div>Progress</div>
                </div>
                <div class="stat">
                  <div class="stat-number">${challenge.pointsEarned || 0}</div>
                  <div>Total Points</div>
                </div>
              </div>

              <div class="recovery-box">
                <h4>💚 It's Not Over!</h4>
                <p><strong>Here's how to bounce back:</strong></p>
                <ul>
                  <li>Don't give up – one missed day doesn't define your journey</li>
                  <li>Get back on track immediately with your next upload</li>
                  <li>Learn from this and set better reminders for yourself</li>
                  <li>Remember why you started this challenge</li>
                  <li>Use this as motivation to not miss another deadline</li>
                </ul>
              </div>

              <p><strong>Important:</strong> Many successful creators have had setbacks. What separates them is how they responded. Your next upload can start a new streak – make it count!</p>

              <div style="text-align: center;">
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/challenge" class="cta-button">
                  Get Back On Track
                </a>
              </div>

              <p>Remember, consistency is about showing up, even after you stumble. We believe in you! 💪</p>
            </div>

            <div class="footer">
              <p>You've got this – come back stronger!</p>
              <p>The YT-AI Team</p>
              <p><a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/challenge">View Challenge</a> | <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/settings">Update Settings</a></p>
            </div>
          </div>
        </body>
      </html>
    `

    await transporter.sendMail({
      from: `"YT-AI Challenges" <${process.env.SMTP_EMAIL}>`,
      to: userEmail,
      subject: `⚠️ Missed Upload - ${challenge.challengeTitle}`,
      html: htmlContent
    })

    console.log(`Missed upload email sent to ${userEmail}`)
  } catch (error) {
    console.error('Error sending missed upload email:', error)
    throw error
  }
}

// Morning Reminder Email - Upload Day
export async function sendMorningReminderEmail(context: ChallengeEmailContext) {
  try {
    const { userEmail, userName, challenge, timeUntilDeadline } = context

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .highlight-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 4px; }
            .cta-button { background: #f59e0b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; font-weight: bold; }
            .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
            .emoji { font-size: 32px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="emoji">☀️</div>
              <h1 style="margin: 10px 0;">Good Morning, ${userName}!</h1>
              <p style="margin: 0; opacity: 0.9;">It's Upload Day</p>
            </div>
            
            <div class="content">
              <h2 style="color: #f59e0b;">🎥 You Need to Upload a Video Today</h2>
              
              <div class="highlight-box">
                <p style="margin: 0; font-size: 18px; font-weight: bold; color: #92400e;">
                  📅 Today is an upload day for your challenge:<br>
                  <span style="color: #f59e0b;">${challenge.challengeTitle}</span>
                </p>
              </div>
              
              <p>Don't forget to create and upload your video today to keep your streak alive and earn points!</p>
              
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #1e293b; margin-top: 0;">⏰ Upload Deadline</h3>
                <p style="font-size: 24px; font-weight: bold; color: #f59e0b; margin: 5px 0;">${timeUntilDeadline || 'Today'}</p>
                <p style="color: #64748b; margin: 0; font-size: 14px;">Make sure to upload before midnight to earn full points</p>
              </div>
              
              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="cta-button">
                  📹 Go to Dashboard
                </a>
              </div>
              
              <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #065f46;">
                  <strong>💡 Pro Tip:</strong> Upload earlier in the day to earn bonus points and avoid last-minute stress!
                </p>
              </div>
            </div>
            
            <div class="footer">
              <p style="margin: 0;">Keep crushing your challenge! 💪</p>
              <p style="margin: 10px 0 0;">YT-AI Challenges Team</p>
            </div>
          </div>
        </body>
      </html>
    `

    await transporter.sendMail({
      from: `"YT-AI Challenges" <${process.env.SMTP_EMAIL}>`,
      to: userEmail,
      subject: `☀️ Good Morning! Upload Reminder - ${challenge.challengeTitle}`,
      html: htmlContent
    })

    console.log(`Morning reminder email sent to ${userEmail}`)
  } catch (error) {
    console.error('Error sending morning reminder email:', error)
    throw error
  }
}

// Interval Motivational Email - Sent Every N Minutes (Default: 2 minutes)
export interface IntervalEmailContext extends ChallengeEmailContext {
  videosUploaded?: number
  videosRemaining?: number
  daysRemaining?: number
}

export async function sendIntervalMotivationalEmail(context: IntervalEmailContext) {
  try {
    const { 
      userEmail, 
      userName, 
      challenge, 
      videosUploaded = 0,
      videosRemaining = 0,
      daysRemaining = 0,
      streakCount = 0,
      pointsEarned = 0
    } = context

    // Motivational messages pool (rotates for variety)
    const motivationalMessages = [
      {
        emoji: '🔥',
        title: 'Keep the Fire Burning!',
        message: 'Your consistency is building something amazing. Every video counts!'
      },
      {
        emoji: '💪',
        title: 'You\'re Crushing It!',
        message: 'Champions are made from commitment. You\'re proving you have what it takes!'
      },
      {
        emoji: '⭐',
        title: 'Rising Star Alert!',
        message: 'Each upload is a step closer to your YouTube success story. Keep going!'
      },
      {
        emoji: '🎯',
        title: 'Stay Focused!',
        message: 'Success loves consistency. You\'re creating a winning habit!'
      },
      {
        emoji: '🚀',
        title: 'Momentum Building!',
        message: 'You\'re not just uploading videos, you\'re building a legacy. Don\'t stop now!'
      },
      {
        emoji: '👑',
        title: 'Creator Royalty!',
        message: 'Most people quit. You\'re not most people. Keep showing up!'
      }
    ]

    // Pick random motivational message
    const randomMsg = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .progress-bar { background: #e5e7eb; height: 12px; border-radius: 6px; overflow: hidden; margin: 20px 0; }
            .progress-fill { background: linear-gradient(90deg, #8b5cf6 0%, #6366f1 100%); height: 100%; transition: width 0.3s ease; }
            .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 25px 0; }
            .stat-box { background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #e5e7eb; }
            .stat-number { font-size: 28px; font-weight: bold; color: #8b5cf6; margin-bottom: 5px; }
            .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
            .quote-box { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
            .quote-text { font-size: 16px; font-style: italic; color: #78350f; margin: 0; }
            .cta-button { background: #8b5cf6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; font-weight: bold; box-shadow: 0 4px 6px rgba(139, 92, 246, 0.3); }
            .footer { background: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
            .emoji-large { font-size: 48px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="emoji-large">${randomMsg.emoji}</div>
              <h1 style="margin: 10px 0 5px;">${randomMsg.title}</h1>
              <p style="margin: 0; opacity: 0.9; font-size: 14px;">${challenge.challengeTitle}</p>
            </div>
            
            <div class="content">
              <p style="font-size: 18px; color: #1e293b; margin-top: 0;">
                Hey ${userName}! 👋
              </p>
              
              <div class="quote-box">
                <p class="quote-text">${randomMsg.message}</p>
              </div>
              
              <h3 style="color: #1e293b; margin-top: 30px;">📊 Your Progress</h3>
              
              <div class="stats-grid">
                <div class="stat-box">
                  <div class="stat-number">${videosUploaded}</div>
                  <div class="stat-label">Videos Done</div>
                </div>
                <div class="stat-box">
                  <div class="stat-number">${streakCount}</div>
                  <div class="stat-label">Day Streak</div>
                </div>
                <div class="stat-box">
                  <div class="stat-number">${pointsEarned}</div>
                  <div class="stat-label">Points</div>
                </div>
              </div>
              
              ${videosRemaining > 0 ? `
              <div style="margin: 25px 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="font-weight: 600; color: #1e293b;">Challenge Progress</span>
                  <span style="font-weight: 600; color: #8b5cf6;">${Math.round((videosUploaded / (videosUploaded + videosRemaining)) * 100)}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${Math.round((videosUploaded / (videosUploaded + videosRemaining)) * 100)}%"></div>
                </div>
                <p style="text-align: center; color: #64748b; font-size: 14px; margin-top: 8px;">
                  ${videosRemaining} videos remaining • ${daysRemaining} days left
                </p>
              </div>
              ` : ''}
              
              <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 18px; margin: 25px 0; border-radius: 4px;">
                <p style="margin: 0; color: #0c4a6e; font-weight: 500;">
                  💡 Remember: Every creator you admire started where you are now. The difference? They didn't quit.
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/challenge" class="cta-button">
                  📈 View Dashboard
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="text-align: center; color: #64748b; font-size: 14px; margin: 0;">
                You're receiving this because you're actively crushing your challenge! 🚀
              </p>
            </div>
            
            <div class="footer">
              <p style="margin: 0; font-weight: 600;">Keep Going, Champion! 🏆</p>
              <p style="margin: 10px 0 0;">YT-AI Challenges Team</p>
              <p style="margin: 15px 0 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings" style="color: #8b5cf6; text-decoration: none;">Email Settings</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    await transporter.sendMail({
      from: `"YT-AI Challenges" <${process.env.SMTP_EMAIL}>`,
      to: userEmail,
      subject: `${randomMsg.emoji} ${randomMsg.title} - ${challenge.challengeTitle}`,
      html: htmlContent
    })

    console.log(`Interval motivational email sent to ${userEmail}`)
  } catch (error) {
    console.error('Error sending interval motivational email:', error)
    throw error
  }
}