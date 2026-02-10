# 📧 Email Scheduler Deployment Guide - Windows

Complete guide to deploying the **Interval Email Scheduler** for YouTube Challenges on Windows.

---

## 🎯 What This Does

Sends **motivational emails every 2 minutes** to users with active YouTube challenges:
- ✅ **60 Days, 60 Videos** challenge support
- ✅ Custom start dates per user
- ✅ Auto-stops when challenge expires
- ✅ Windows-compatible (no Linux cron needed)
- ✅ Production-ready with error handling
- ✅ Prevents duplicate emails

---

## 📋 Prerequisites

1. **Node.js 18+** installed on Windows
2. **Supabase project** configured
3. **Gmail SMTP** configured (or other SMTP service)
4. **Environment variables** set

---

## ⚙️ Step 1: Run Database Migration

First, add the necessary columns to track email intervals:

```bash
# In Supabase SQL Editor, run this migration:
```

Open `migrations/013_add_interval_email_tracking.sql` and execute it in your Supabase SQL Editor.

This adds:
- `last_interval_email_sent` - Tracks when last email was sent
- `interval_email_enabled` - Enable/disable per challenge
- `interval_minutes` - Configurable interval (default: 2 minutes)

**Verify migration:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_challenges' 
  AND column_name IN ('last_interval_email_sent', 'interval_email_enabled', 'interval_minutes');
```

---

## 📦 Step 2: Install Dependencies

```bash
# Navigate to project directory
cd C:\Users\deepa\Music\Yt-Ai-main

# Install new dependencies
npm install node-cron @types/node-cron ts-node --save

# Or if using yarn
yarn add node-cron @types/node-cron ts-node
```

**Dependencies added:**
- `node-cron` - Windows-compatible job scheduler
- `@types/node-cron` - TypeScript types
- `ts-node` - Run TypeScript directly

---

## 🔐 Step 3: Configure Environment Variables

Add these to your `.env.local` file:

```bash
# Existing variables (verify these are set)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SMTP_EMAIL=your_gmail@gmail.com
SMTP_PASSWORD=your_gmail_app_password
NEXTAUTH_URL=https://your-domain.com
CRON_SECRET=your_secure_random_string

# New variable (optional)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

**Important:**
- Use **Gmail App Password**, not regular password
- Generate at: https://myaccount.google.com/apppasswords
- `CRON_SECRET` protects API endpoints from unauthorized access

---

## 🚀 Step 4: Enable Interval Emails for Challenges

Update challenges to enable interval emails:

```sql
-- Enable interval emails for all active challenges
UPDATE user_challenges 
SET 
  interval_email_enabled = true,
  interval_minutes = 2
WHERE status = 'active' 
  AND email_notifications_enabled = true;

-- Or enable for specific challenge
UPDATE user_challenges 
SET interval_email_enabled = true
WHERE id = 'your-challenge-uuid';
```

**Verify:**
```sql
SELECT 
  challenge_title,
  status,
  interval_email_enabled,
  interval_minutes,
  last_interval_email_sent
FROM user_challenges 
WHERE interval_email_enabled = true;
```

---

## 🖥️ Step 5: Windows Deployment Options

### **Option A: PM2 (Recommended for Production)**

PM2 is a production process manager that:
- ✅ Auto-restarts on crashes
- ✅ Keeps running after terminal closes
- ✅ Auto-starts on Windows boot
- ✅ Provides logs and monitoring

#### Install PM2:
```bash
npm install -g pm2
# Or
yarn global add pm2
```

#### Start Email Scheduler:
```bash
# Option 1: Using package.json script
npm run email-scheduler:pm2

# Option 2: Manual PM2 command
pm2 start lib/emailScheduler.ts --name youtube-challenge-emails --interpreter ts-node
```

#### PM2 Management Commands:
```bash
# View running processes
pm2 list

# View logs (real-time)
pm2 logs youtube-challenge-emails

# View logs (last 100 lines)
pm2 logs youtube-challenge-emails --lines 100

# Stop scheduler
pm2 stop youtube-challenge-emails

# Restart scheduler
pm2 restart youtube-challenge-emails

# Delete from PM2
pm2 delete youtube-challenge-emails

# Monitor resource usage
pm2 monit

# Save PM2 process list
pm2 save
```

#### Auto-Start on Windows Boot:
```bash
# Install PM2 as Windows startup service
pm2 startup

# Follow the instructions PM2 provides (usually requires admin)
# Then save your process list:
pm2 save
```

---

### **Option B: Windows Scheduled Task (Alternative)**

If you prefer Windows Task Scheduler:

1. **Create batch file** `start-email-scheduler.bat`:
   ```batch
   @echo off
   cd C:\Users\deepa\Music\Yt-Ai-main
   call npm run email-scheduler
   ```

2. **Open Task Scheduler:**
   - Press `Win + R`, type `taskschd.msc`
   - Click "Create Task"

3. **General Tab:**
   - Name: `YouTube Challenge Email Scheduler`
   - Run whether user is logged on or not
   - Run with highest privileges

4. **Triggers Tab:**
   - New → At startup
   - Delay task for: 1 minute

5. **Actions Tab:**
   - New → Start a program
   - Program: `C:\Windows\System32\cmd.exe`
   - Arguments: `/c "C:\Users\deepa\Music\Yt-Ai-main\start-email-scheduler.bat"`

6. **Conditions Tab:**
   - Uncheck "Start only if on AC power"

7. **Click OK** and enter Windows password

---

### **Option C: npm script (Development Only)**

For testing/development (terminal must stay open):

```bash
npm run email-scheduler
```

**Logs will show:**
```
📦 Starting Email Scheduler as standalone service...

🚀 Email Scheduler STARTED
⏰ Check interval: Every 1 minute
📧 Email interval: Every 2 minutes (configurable per challenge)
🖥️  Platform: Windows-compatible (node-cron)
──────────────────────────────────────────────────────

🔍 [2024-01-15T10:00:00.000Z] Checking for interval emails...
📧 Found 3 challenge(s) needing emails
✅ 3 active (non-expired) challenges
✅ Email sent to user1@example.com (Challenge: 60 Days 60 Videos)
✅ Email sent to user2@example.com (Challenge: 60 Days 60 Videos)
✅ Email sent to user3@example.com (Challenge: 30 Days Sprint)

📊 Batch complete in 1234ms:
   ✅ Successful: 3
   ❌ Failed: 0
   📈 Total sent (session): 3
   🔥 Total errors (session): 0
```

---

## 🎛️ Step 6: Control Scheduler via API

### **Start Scheduler:**
```bash
curl -X POST https://your-domain.com/api/email-scheduler/control \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}'
```

### **Stop Scheduler:**
```bash
curl -X POST https://your-domain.com/api/email-scheduler/control \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"action": "stop"}'
```

### **Check Status:**
```bash
curl -X GET https://your-domain.com/api/email-scheduler/control \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Response:**
```json
{
  "success": true,
  "status": {
    "running": true,
    "lastRunTime": "2024-01-15T10:02:00.000Z",
    "totalEmailsSent": 156,
    "totalErrors": 2,
    "uptime": 7200,
    "uptimeFormatted": "2h 0m 0s"
  }
}
```

---

## 📊 Step 7: Monitor Email Activity

### **Check sent emails in database:**
```sql
SELECT 
  cn.notification_type,
  cn.sent_date,
  cn.email_status,
  uc.challenge_title,
  u.email as user_email
FROM challenge_notifications cn
JOIN user_challenges uc ON cn.challenge_id = uc.id
JOIN users u ON uc.user_id = u.id
WHERE cn.notification_type = 'interval_motivational'
ORDER BY cn.sent_date DESC
LIMIT 50;
```

### **Check challenges with interval emails enabled:**
```sql
SELECT 
  challenge_title,
  status,
  interval_email_enabled,
  interval_minutes,
  last_interval_email_sent,
  EXTRACT(EPOCH FROM (NOW() - last_interval_email_sent)) / 60 as minutes_since_last_email
FROM user_challenges
WHERE interval_email_enabled = true
ORDER BY last_interval_email_sent DESC;
```

### **View PM2 Logs:**
```bash
# Real-time logs
pm2 logs youtube-challenge-emails --lines 200

# Export logs to file
pm2 logs youtube-challenge-emails --lines 1000 > scheduler-logs.txt
```

---

## 🔧 Troubleshooting

### **Issue: Emails not sending**

**Check:**
1. **SMTP credentials:**
   ```bash
   # Verify Gmail App Password
   echo %SMTP_EMAIL%
   echo %SMTP_PASSWORD%
   ```

2. **Database records:**
   ```sql
   SELECT * FROM user_challenges 
   WHERE interval_email_enabled = true 
   LIMIT 5;
   ```

3. **PM2 logs:**
   ```bash
   pm2 logs youtube-challenge-emails --err
   ```

4. **Test email manually:**
   In Supabase SQL Editor or Node.js console:
   ```typescript
   const { sendIntervalMotivationalEmail } = require('./lib/challengeEmailService');
   // Test sending one email
   ```

---

### **Issue: Scheduler not running**

**Check:**
```bash
# PM2 status
pm2 list

# If not running, start it
pm2 start lib/emailScheduler.ts --name youtube-challenge-emails --interpreter ts-node

# Check Node.js version
node -v  # Should be 18+

# Verify dependencies
npm list node-cron
```

---

### **Issue: Duplicate emails**

**Check `last_interval_email_sent` tracking:**
```sql
SELECT 
  id,
  challenge_title,
  last_interval_email_sent,
  NOW() - last_interval_email_sent as time_since_last
FROM user_challenges 
WHERE interval_email_enabled = true;
```

If `last_interval_email_sent` is not updating, check database permissions.

---

### **Issue: Performance degradation**

If you have **1000+ active challenges**, optimize:

1. **Add database index** (already in migration):
   ```sql
   CREATE INDEX idx_challenges_interval_enabled 
   ON user_challenges (status, interval_email_enabled, last_interval_email_sent);
   ```

2. **Batch emails** in smaller groups (modify scheduler):
   ```typescript
   // In emailScheduler.ts, process in batches of 50
   const batches = chunk(activeChallenges, 50);
   for (const batch of batches) {
     await Promise.all(batch.map(sendEmail));
     await sleep(5000); // 5 sec delay between batches
   }
   ```

3. **Increase interval** from 2 to 5 minutes:
   ```sql
   UPDATE user_challenges 
   SET interval_minutes = 5 
   WHERE interval_email_enabled = true;
   ```

---

## 📈 Scaling Recommendations

### **For 10-100 users:**
- ✅ Current setup works perfectly
- ✅ Single PM2 process sufficient
- ✅ No modifications needed

### **For 100-1000 users:**
- ✅ Add Redis caching for last_sent_time
- ✅ Use email queue (Bull, BullMQ)
- ✅ Separate server for scheduler

### **For 1000+ users:**
- ✅ Use AWS SES or SendGrid (higher rate limits)
- ✅ Implement email queue with retry logic
- ✅ Horizontal scaling with multiple workers
- ✅ Dedicated email infrastructure

---

## 🎉 Success Checklist

Once deployment is complete, verify:

- [ ] Migration ran successfully
- [ ] Dependencies installed (`node-cron`, `ts-node`)
- [ ] Environment variables configured
- [ ] Challenges have `interval_email_enabled = true`
- [ ] PM2 process running (`pm2 list`)
- [ ] Emails sending every 2 minutes (check logs)
- [ ] Database records created in `challenge_notifications`
- [ ] PM2 auto-starts on Windows boot
- [ ] API control endpoint works
- [ ] Monitoring logs show successful sends

---

## 📞 Support

**Logs Location:**
- PM2 logs: `C:\Users\YOUR_USERNAME\.pm2\logs\`
- Application logs: Console output from `pm2 logs`

**Common Commands:**
```bash
# View all PM2 processes
pm2 list

# View real-time logs
pm2 logs youtube-challenge-emails

# Restart scheduler
pm2 restart youtube-challenge-emails

# Stop scheduler
pm2 stop youtube-challenge-emails

# Check status via API
curl -X GET http://localhost:3000/api/email-scheduler/control \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 🚀 Quick Start (TL;DR)

```bash
# 1. Install dependencies
npm install

# 2. Run migration in Supabase
# (Execute migrations/013_add_interval_email_tracking.sql)

# 3. Enable interval emails
# UPDATE user_challenges SET interval_email_enabled = true WHERE status = 'active';

# 4. Install PM2 globally
npm install -g pm2

# 5. Start scheduler
pm2 start lib/emailScheduler.ts --name youtube-challenge-emails --interpreter ts-node

# 6. Save PM2 config
pm2 save

# 7. Auto-start on boot
pm2 startup

# 8. Monitor
pm2 logs youtube-challenge-emails
```

**Done! 🎉** Your email scheduler is now running and will send motivational emails every 2 minutes to active challenge participants!
