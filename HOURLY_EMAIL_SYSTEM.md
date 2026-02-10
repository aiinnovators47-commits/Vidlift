# 📧 Automatic Hourly Email System

## Overview
This system automatically sends motivational emails to users every hour who have active challenges but haven't uploaded videos today. The emails include real data about their progress, streaks, and encouragement to continue their YouTube journey.

## ✨ Features
- **Automatic Scheduling**: Emails sent every hour on the hour
- **Smart Filtering**: Only sends to users who haven't uploaded today
- **Real Data Integration**: Shows actual progress, videos uploaded, streaks, points
- **Expiration Handling**: Automatically skips expired challenges
- **Logging**: Tracks all sent emails in database
- **Manual Testing**: Easy testing with reset functionality

## 🚀 How It Works

### 1. Hourly Execution
The system runs automatically every hour via Netlify Functions cron scheduling:
- **Schedule**: `0 * * * *` (every hour on the hour)
- **Function**: `/netlify/functions/hourly-email-scheduler.ts`

### 2. Smart Logic
For each active challenge:
1. Checks if user uploaded a video today
2. If NO video today → sends motivational email
3. If YES video today → skips and updates timestamp
4. Updates `last_interval_email_sent` to prevent duplicate emails

### 3. Email Content
Each email includes:
- Personalized greeting with user's name
- Challenge title and progress
- Videos uploaded vs remaining
- Current streak count
- Points earned
- Encouraging motivational message
- Days remaining in challenge

## 🔧 Setup & Deployment

### Prerequisites
Ensure these environment variables are set in `.env.local`:
```bash
CRON_SECRET=your_secure_cron_secret_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

### Netlify Deployment
1. Push your code to GitHub
2. Connect to Netlify
3. The cron job is automatically configured in `netlify.toml`:
   ```toml
   [functions."hourly-email-scheduler"]
     background = true
     schedule = "0 * * * *"  # Every hour
   ```

## 🧪 Testing the System

### Option 1: Manual Trigger (Recommended for testing)
```bash
npm run test:hourly-emails
```
This script will:
- Ask if you want to reset email timestamps (to force sending)
- Trigger the hourly email scheduler
- Show detailed results

### Option 2: Force Test Script
```bash
npm run test:force-emails
```
Resets all timestamps and forces immediate email sending.

### Option 3: Direct API Call
```bash
curl -X POST http://localhost:3000/api/trigger-hourly-emails \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

## 📊 Monitoring

### Check Logs
View execution logs in:
- **Netlify Dashboard** → Functions → hourly-email-scheduler → Logs
- **Console output** when running locally

### Database Tracking
Emails are logged in `challenge_notifications` table:
```sql
SELECT * FROM challenge_notifications 
WHERE notification_type = 'interval_motivational'
ORDER BY sent_date DESC;
```

### Manual Verification
Check the last execution timestamp:
```sql
SELECT id, challenge_title, last_interval_email_sent 
FROM user_challenges 
WHERE interval_email_enabled = true;
```

## 🛠️ Troubleshooting

### Common Issues

1. **No emails sent**
   - Check if challenges have `interval_email_enabled = true`
   - Verify `email_notifications_enabled = true`
   - Ensure users have valid email addresses
   - Check Supabase credentials in environment variables

2. **Duplicate emails**
   - System automatically prevents duplicates using `last_interval_email_sent`
   - Each email updates the timestamp to current time

3. **Expired challenges still getting emails**
   - System filters out expired challenges automatically
   - Duration calculated as: `started_at + (durationMonths * 30 days)`

4. **Cron job not running**
   - Verify Netlify deployment
   - Check `netlify.toml` configuration
   - Ensure function file exists: `netlify/functions/hourly-email-scheduler.ts`

### Debug Commands

Test database connectivity:
```bash
node scripts/test-hourly-emails.js
```

Check environment variables:
```bash
# In your terminal
echo $CRON_SECRET
echo $NEXT_PUBLIC_SUPABASE_URL
```

## 📈 Performance Metrics

The system tracks:
- ✅ **Emails Sent**: Successfully delivered emails
- ⏭️ **Emails Skipped**: Users who already uploaded today
- ❌ **Errors**: Failed email deliveries
- 🕐 **Execution Time**: When each batch ran

## 🔒 Security

- All API endpoints require `CRON_SECRET` authorization
- Background functions run with service role permissions
- Email content is personalized but doesn't expose sensitive data
- Rate limiting prevents abuse through timestamp checking

## 🔄 Future Enhancements

Potential improvements:
- [ ] Different email templates for different progress levels
- [ ] Weekly progress summary emails
- [ ] Custom scheduling intervals (every 2 hours, daily, etc.)
- [ ] Email analytics and open tracking
- [ ] User preference controls for email frequency

---

**Ready to go!** Your automatic email system will now send motivational emails every hour to help users stay engaged with their YouTube challenges. 🚀