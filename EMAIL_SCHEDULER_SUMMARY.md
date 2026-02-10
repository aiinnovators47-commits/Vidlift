# 📧 Email Automation System - Implementation Summary

## ✅ System Overview

A **Windows-compatible email scheduler** that sends motivational emails **every 2 minutes** to users with active YouTube challenges (e.g., "60 Days, 60 Videos").

---

## 📁 Files Created/Modified

### **1. Database Migration**
📄 **`migrations/013_add_interval_email_tracking.sql`**
- Adds `last_interval_email_sent` column (tracks when last email was sent)
- Adds `interval_email_enabled` column (enable/disable per challenge)
- Adds `interval_minutes` column (configurable interval, default: 2)
- Creates index for fast queries

**Action Required:** Run this SQL in Supabase SQL Editor

---

### **2. Email Scheduler Service**
📄 **`lib/emailScheduler.ts`** (NEW - 400+ lines)

**What it does:**
- Runs **every 1 minute** to check which users need emails
- Queries database for challenges where:
  - `status = 'active'`
  - `interval_email_enabled = true`
  - `email_notifications_enabled = true`
  - Last email sent > 2 minutes ago (or never sent)
  - Challenge not expired
- Sends motivational emails via existing email service
- Updates `last_interval_email_sent` after successful send
- Logs to `challenge_notifications` table
- Production-ready with error handling

**Key Functions:**
- `startEmailScheduler()` - Start the cron job
- `stopEmailScheduler()` - Stop the cron job
- `getSchedulerStatus()` - Get runtime stats
- `checkAndSendIntervalEmails()` - Main logic (runs every minute)

**Auto-Start:**
```bash
# Run as standalone service
npm run email-scheduler
```

---

### **3. Email Template**
📄 **`lib/challengeEmailService.ts`** (UPDATED)

**New Function Added:**
```typescript
sendIntervalMotivationalEmail(context: IntervalEmailContext)
```

**Features:**
- Beautiful HTML email template
- Random motivational messages (6 variations)
- Shows progress stats (videos uploaded, streak, points)
- Progress bar visualization
- Professional design matching existing emails
- Personalized subject lines

**Email Content:**
- 🔥 Motivational header (rotates: "Keep the Fire Burning!", "You're Crushing It!", etc.)
- 📊 Progress metrics (videos done, streak, points)
- 📈 Visual progress bar
- 💡 Inspirational quotes
- 🎯 CTA button to dashboard

---

### **4. API Control Endpoint**
📄 **`app/api/email-scheduler/control/route.ts`** (NEW)

**Endpoints:**

**GET `/api/email-scheduler/control`**
- Returns current scheduler status
- Requires: `Authorization: Bearer YOUR_CRON_SECRET`

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

**POST `/api/email-scheduler/control`**
- Start or stop scheduler remotely
- Body: `{"action": "start"}` or `{"action": "stop"}`
- Requires: `Authorization: Bearer YOUR_CRON_SECRET`

---

### **5. Package Updates**
📄 **`package.json`** (UPDATED)

**New Dependencies:**
```json
"node-cron": "^3.0.3",           // Windows-compatible scheduler
"@types/node-cron": "^3.0.11"    // TypeScript types
```

**New Scripts:**
```json
"email-scheduler": "ts-node lib/emailScheduler.ts",
"email-scheduler:pm2": "pm2 start lib/emailScheduler.ts --name youtube-challenge-emails --interpreter ts-node"
```

**Action Required:**
```bash
npm install
```

---

### **6. Deployment Guide**
📄 **`EMAIL_SCHEDULER_DEPLOYMENT.md`** (NEW - Complete Guide)

**Covers:**
- ✅ Database migration steps
- ✅ Environment variable setup
- ✅ PM2 installation & configuration
- ✅ Windows Task Scheduler alternative
- ✅ Auto-start on Windows boot
- ✅ Monitoring & troubleshooting
- ✅ Scaling recommendations
- ✅ API control usage

---

## 🎯 How It Works

### **Flow Diagram:**

```
┌─────────────────────────────────────────────────┐
│  Windows Server (PM2 Process Manager)          │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  Email Scheduler (lib/emailScheduler.ts)  │ │
│  │                                           │ │
│  │  ⏰ Every 1 minute:                       │ │
│  │     1. Query Supabase for eligible users  │ │
│  │     2. Filter expired challenges          │ │
│  │     3. Send emails (parallel batches)     │ │
│  │     4. Update last_sent_time              │ │
│  │     5. Log to challenge_notifications     │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
                    ↓
        ┌───────────────────────┐
        │  Supabase Database    │
        │                       │
        │  user_challenges      │
        │  - interval_email_    │
        │    enabled = true     │
        │  - last_interval_     │
        │    email_sent         │
        │                       │
        │  challenge_           │
        │  notifications        │
        └───────────────────────┘
                    ↓
        ┌───────────────────────┐
        │  Email Service        │
        │  (Gmail SMTP)         │
        │                       │
        │  sendIntervalMotivat- │
        │  ionalEmail()         │
        └───────────────────────┘
                    ↓
        ┌───────────────────────┐
        │  User Inbox           │
        │  📧 Every 2 minutes   │
        └───────────────────────┘
```

---

## 🔐 Security Features

1. **API Authentication**
   - All control endpoints require `CRON_SECRET` in Authorization header
   - Prevents unauthorized start/stop

2. **Row-Level Security**
   - Existing Supabase RLS policies protect user data
   - Scheduler uses `SUPABASE_SERVICE_ROLE_KEY` for admin access

3. **Email Rate Limiting**
   - Database tracking prevents duplicate sends
   - `last_interval_email_sent` enforces 2-minute minimum

4. **Error Handling**
   - Try-catch blocks on all operations
   - Failed emails logged to `challenge_notifications`
   - Scheduler continues on individual failures

---

## ⚙️ Configuration Options

### **Per-Challenge Settings:**

Enable/disable interval emails:
```sql
UPDATE user_challenges 
SET interval_email_enabled = true 
WHERE id = 'challenge-uuid';
```

Change interval (default: 2 minutes):
```sql
UPDATE user_challenges 
SET interval_minutes = 5  -- Send every 5 minutes
WHERE id = 'challenge-uuid';
```

### **Global Settings:**

All configuration via environment variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
SMTP_EMAIL=your_gmail@gmail.com
SMTP_PASSWORD=your_app_password
CRON_SECRET=your_secret
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## 📊 Database Schema Changes

### **user_challenges Table:**

```sql
-- New columns added
last_interval_email_sent    timestamptz    -- When last interval email was sent
interval_email_enabled      boolean        -- Enable interval emails? (default: false)
interval_minutes            integer        -- Email interval (default: 2)
```

### **challenge_notifications Table:**

New notification type added:
```sql
notification_type = 'interval_motivational'
```

**Example Record:**
```json
{
  "id": "uuid",
  "challenge_id": "challenge-uuid",
  "notification_type": "interval_motivational",
  "sent_date": "2024-01-15T10:02:00Z",
  "email_status": "sent",
  "email_content": {
    "subject": "🔥 Keep the Fire Burning! - 60 Days 60 Videos",
    "to": "user@example.com",
    "type": "interval_motivational"
  }
}
```

---

## 🚀 Deployment Steps (Quick Reference)

### **Step 1: Database**
```bash
# Run migration in Supabase SQL Editor
# File: migrations/013_add_interval_email_tracking.sql
```

### **Step 2: Install Dependencies**
```bash
npm install
```

### **Step 3: Enable Challenges**
```sql
UPDATE user_challenges 
SET interval_email_enabled = true 
WHERE status = 'active';
```

### **Step 4: Deploy Scheduler**
```bash
# Install PM2 globally
npm install -g pm2

# Start scheduler
npm run email-scheduler:pm2

# Save PM2 config
pm2 save

# Auto-start on boot
pm2 startup
```

### **Step 5: Monitor**
```bash
# View logs
pm2 logs youtube-challenge-emails

# Check status
pm2 list
```

---

## 📈 Performance Metrics

### **Current Capacity:**
- ✅ Checks every: **1 minute**
- ✅ Sends emails every: **2 minutes per user**
- ✅ Batch processing: **Parallel (Promise.all)**
- ✅ Query optimization: **Indexed columns**
- ✅ Error handling: **Graceful degradation**

### **Expected Load:**

**10 Active Challenges:**
- Emails/hour: 300 (10 users × 30 emails/hour)
- Database queries/hour: 60 (every minute)
- ⚡ Performance: Excellent

**100 Active Challenges:**
- Emails/hour: 3,000 (100 users × 30 emails/hour)
- Database queries/hour: 60 (every minute)
- ⚡ Performance: Good

**1000+ Active Challenges:**
- Emails/hour: 30,000+ (1000+ users × 30 emails/hour)
- Database queries/hour: 60 (every minute)
- ⚠️ Recommendation: Use email queue (Bull/BullMQ) + AWS SES

---

## 🔍 Monitoring & Debugging

### **Check Scheduler Status:**
```bash
# PM2 status
pm2 list

# Real-time logs
pm2 logs youtube-challenge-emails --lines 100
```

### **Database Queries:**

**View recent emails sent:**
```sql
SELECT 
  cn.sent_date,
  cn.email_status,
  uc.challenge_title,
  u.email
FROM challenge_notifications cn
JOIN user_challenges uc ON cn.challenge_id = uc.id
JOIN users u ON uc.user_id = u.id
WHERE cn.notification_type = 'interval_motivational'
ORDER BY cn.sent_date DESC
LIMIT 20;
```

**Check challenges eligible for emails:**
```sql
SELECT 
  challenge_title,
  interval_email_enabled,
  last_interval_email_sent,
  EXTRACT(EPOCH FROM (NOW() - last_interval_email_sent)) / 60 as minutes_since_last
FROM user_challenges
WHERE status = 'active' 
  AND interval_email_enabled = true;
```

### **API Status Check:**
```bash
curl -X GET http://localhost:3000/api/email-scheduler/control \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## ✅ Success Criteria

**System is working correctly when:**

1. ✅ PM2 shows process as `online`
2. ✅ Logs show "Checking for interval emails..." every minute
3. ✅ Emails appear in user inboxes every 2 minutes
4. ✅ `challenge_notifications` table receives new records
5. ✅ `last_interval_email_sent` updates after each send
6. ✅ No errors in PM2 logs
7. ✅ API control endpoint returns valid status
8. ✅ Email open rates > 30% (check after 24 hours)

---

## 🎉 What You Get

### **For Users:**
- 📧 Motivational emails every 2 minutes
- 🔥 Variety (6 different motivational messages)
- 📊 Real-time progress tracking
- 💪 Increased engagement and accountability
- 🏆 Higher challenge completion rates

### **For Admins:**
- 🖥️ Windows-compatible (no Linux server needed)
- ⚙️ Easy deployment (PM2 one-command)
- 📈 API control (start/stop remotely)
- 🔍 Comprehensive logging
- 📊 Database tracking
- 🚀 Production-ready out of the box

---

## 🆘 Troubleshooting

**Problem:** Emails not sending

**Solutions:**
1. Check SMTP credentials in `.env.local`
2. Verify `interval_email_enabled = true` in database
3. Check PM2 logs: `pm2 logs youtube-challenge-emails --err`
4. Test SMTP manually via Node.js

**Problem:** Scheduler not running

**Solutions:**
1. Check PM2: `pm2 list`
2. Restart: `pm2 restart youtube-challenge-emails`
3. Check Node.js version: `node -v` (should be 18+)
4. Reinstall dependencies: `npm install`

**Problem:** Duplicate emails

**Solutions:**
1. Verify `last_interval_email_sent` is updating
2. Check database index: `idx_challenges_interval_enabled`
3. Ensure only one scheduler instance is running

---

## 📞 Support Resources

**Documentation:**
- 📖 Full deployment guide: `EMAIL_SCHEDULER_DEPLOYMENT.md`
- 💻 Source code: `lib/emailScheduler.ts`
- 📧 Email templates: `lib/challengeEmailService.ts`
- 🔌 API docs: `app/api/email-scheduler/control/route.ts`

**Commands:**
```bash
# View all logs
pm2 logs youtube-challenge-emails

# Export logs
pm2 logs youtube-challenge-emails --lines 1000 > logs.txt

# Monitor resources
pm2 monit

# Restart if issues
pm2 restart youtube-challenge-emails
```

---

## 🚀 Next Steps

1. ✅ Run database migration
2. ✅ Install dependencies (`npm install`)
3. ✅ Configure environment variables
4. ✅ Enable interval emails for challenges
5. ✅ Deploy with PM2
6. ✅ Monitor logs for 24 hours
7. ✅ Verify emails in user inboxes
8. ✅ Check open rates after 1 week

**You're all set! 🎉** The automated email system is ready to motivate your YouTube challenge participants!
