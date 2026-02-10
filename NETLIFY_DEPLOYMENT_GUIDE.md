# 🚀 Netlify Deployment Guide: Email Automation

Complete guide to deploying email automation on Netlify with hourly motivational emails matching your localhost functionality.

## 📋 Overview

This guide will help you set up email automation on Netlify that sends motivational emails every hour to users with active YouTube challenges, just like your localhost setup.

## 🎯 What This Enables

- ✅ **Hourly motivational emails** to active challenge participants
- ✅ **Duplicate prevention** with last_sent tracking
- ✅ **Challenge expiration handling** (stops when challenge ends)
- ✅ **Individual upload detection** (skips email if video uploaded today)
- ✅ **Production-ready** with error handling
- ✅ **Netlify-compatible** serverless functions

## 📦 Prerequisites

1. **Netlify account** with site created
2. **Supabase project** configured and running
3. **Gmail SMTP** or other SMTP service configured
4. **Database migration** completed (interval email tracking columns)

## 🛠️ Step-by-Step Setup

### Step 1: Prepare Your Local Repository

Ensure these files are in your repository:

1. `netlify.toml` - Netlify configuration
2. `netlify/functions/trigger-email-scheduler.ts` - API function
3. `netlify/functions/email-scheduler.ts` - Hourly email scheduler
4. `netlify/functions/package.json` - Dependencies for functions

### Step 2: Environment Variables Setup

In your Netlify dashboard, go to **Site Settings > Build & Deploy > Environment** and add these variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SMTP_EMAIL=your_smtp_email@gmail.com
SMTP_PASSWORD=your_smtp_app_password
NEXTAUTH_URL=https://your-site-name.netlify.app
CRON_SECRET=your_secure_cron_secret
NEXT_PUBLIC_APP_URL=https://your-site-name.netlify.app
```

### Step 3: Database Preparation

Ensure your Supabase database has the required columns for interval email tracking:

```sql
-- Add these columns to your user_challenges table if not present
ALTER TABLE user_challenges ADD COLUMN IF NOT EXISTS interval_email_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE user_challenges ADD COLUMN IF NOT EXISTS interval_minutes INTEGER DEFAULT 60;
ALTER TABLE user_challenges ADD COLUMN IF NOT EXISTS last_interval_email_sent TIMESTAMP WITH TIME ZONE;

-- Enable interval emails for active challenges
UPDATE user_challenges 
SET 
  interval_email_enabled = true,
  interval_minutes = 60  -- 60 minutes = 1 hour
WHERE status = 'active' 
  AND email_notifications_enabled = true;
```

### Step 4: External Cron Service Setup (Required for Netlify)

Since Netlify doesn't have built-in cron jobs like Vercel, you need an external service to trigger your email scheduler hourly. This is a crucial difference from other platforms:

#### Option A: Cron-Job.org (Free)

1. Go to [cron-job.org](https://cron-job.org/)
2. Sign up for a free account
3. Click "New Cronjob"
4. Set URL to: `https://your-site-name.netlify.app/.netlify/functions/trigger-email-scheduler`
5. Set request method to: `POST`
6. Set schedule to: `0 * * * *` (every hour)
7. Add header: `Authorization: Bearer YOUR_CRON_SECRET`
8. Save the cron job

#### Option B: Better Uptime (Free alternative)

1. Go to [betteruptime.com](https://betteruptime.com/)
2. Sign up for a free account
3. Go to "Periodic Checks"
4. Create a new "Periodic Check"
5. Set URL to: `https://your-site-name.netlify.app/.netlify/functions/trigger-email-scheduler`
6. Set method to: `POST`
7. Set schedule to: "Every hour"
8. Add header: `Authorization: Bearer YOUR_CRON_SECRET`
9. Save the periodic check

#### Option C: GitHub Actions (if using GitHub)

If your code is hosted on GitHub, you can use GitHub Actions to trigger your email scheduler:

Create `.github/workflows/email-scheduler.yml`:

```yaml
name: Email Scheduler

on:
  schedule:
    # Run every hour (at minute 0)
    - cron: '0 * * * *'
  workflow_dispatch:

jobs:
  trigger-email-scheduler:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger email scheduler
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            https://your-site-name.netlify.app/.netlify/functions/trigger-email-scheduler
```

This approach uses GitHub's built-in cron functionality to make periodic requests to your Netlify function.

### Step 5: Deploy to Netlify

Push your changes to your Git repository, and Netlify will automatically deploy:

```bash
git add .
git commit -m "Add Netlify email automation setup"
git push origin main
```

## 🔧 Testing Your Setup

### Test the API Endpoint

After deployment, test your email scheduler API manually:

```bash
curl -X POST https://your-site-name.netlify.app/.netlify/functions/trigger-email-scheduler \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

### Verify Email Sending

1. Check your Supabase logs for successful email queries
2. Monitor your email inbox for test messages
3. Check the `challenge_notifications` table in Supabase for sent records

## 📊 Monitoring and Maintenance

### Check Function Logs

In Netlify Dashboard:
1. Go to your site
2. Navigate to "Functions"
3. Find your `trigger-email-scheduler` function
4. Check the logs for execution details

### Database Monitoring

Monitor these tables in Supabase:
- `user_challenges` - Check `last_interval_email_sent` timestamps
- `challenge_notifications` - Verify email records

## 🔄 Troubleshooting

### Issue: Emails Not Sending

**Check:**
1. SMTP credentials in environment variables
2. Supabase connection and permissions
3. Function logs in Netlify dashboard
4. Database records have `interval_email_enabled = true`

### Issue: Cron Job Not Triggering

**Check:**
1. External cron service is properly configured
2. Cron secret matches between service and environment variables
3. URL endpoint is correct

### Issue: Rate Limiting

If sending emails too frequently:
1. Adjust `interval_minutes` in the database to higher values
2. Check your SMTP provider's rate limits

## 🚀 Verification Checklist

After setup, verify:

- [ ] Netlify site deployed successfully
- [ ] Environment variables set correctly
- [ ] Database has interval email tracking columns
- [ ] Active challenges have `interval_email_enabled = true`
- [ ] External cron service configured for hourly execution
- [ ] First test email sent successfully
- [ ] Function logs show successful executions
- [ ] `challenge_notifications` table has entries

## 📞 Support

**Common Commands:**
```bash
# Test locally before deploying
netlify dev

# Check environment variables
netlify env:get VARIABLE_NAME

# View function logs
netlify logs:function trigger-email-scheduler
```

**Need Help?**
- Check Netlify function logs first
- Verify all environment variables are set
- Ensure your Supabase database is accessible from Netlify
- Test your external cron service manually

---

## 🎉 You're Done!

Your Netlify deployment now has email automation that matches your localhost functionality, sending motivational emails every hour to active challenge participants. The system handles duplicate prevention, tracks sent emails, and respects challenge expiration dates.

Your email automation is now running on Netlify and will continue to send hourly motivational emails to users with active challenges!