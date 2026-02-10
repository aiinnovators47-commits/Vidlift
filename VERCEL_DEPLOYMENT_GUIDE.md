# 🚀 Vercel Deployment Guide

Complete guide to deploying your YouTube AI project on Vercel with automated email scheduling and cron jobs.

## 📋 Prerequisites

1. **Vercel account** - [vercel.com](https://vercel.com)
2. **GitHub account** - for version control and automatic deployments
3. **Supabase account** - for database
4. **SMTP email credentials** - for sending emails

## 🔧 Environment Variables

In your Vercel dashboard, go to **Project Settings > Environment Variables** and add these variables:

### Required Variables:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key

NEXTAUTH_SECRET=your_nextauth_secret_key
NEXTAUTH_URL=https://your-vercel-app.vercel.app

GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
YOUTUBE_API_KEY=your_youtube_api_key

GEMINI_API_KEY=your_gemini_api_key

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_gmail_app_password

CRON_SECRET=your_secure_cron_secret_here

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
```

### Variable Details:

**Supabase Credentials:**
- Get from your Supabase project dashboard
- `SUPABASE_SERVICE_ROLE_KEY` - Used for server-side operations
- `SUPABASE_ANON_KEY` - Used for client-side operations

**Authentication:**
- `NEXTAUTH_SECRET` - Generate a random string (32+ characters)
- `NEXTAUTH_URL` - Your deployed Vercel URL

**Google APIs:**
- Create credentials in Google Cloud Console
- Enable YouTube Data API v3 and Google OAuth2 API

**Email Configuration:**
- Use Gmail App Password (not regular password)
- Generate at: https://myaccount.google.com/apppasswords

**Security:**
- `CRON_SECRET` - Secure random string to protect cron endpoints
- Minimum 32 characters recommended

## 🔄 Automated Cron Jobs

This project includes several automated cron jobs configured in `vercel.json`:

### Hourly Jobs:
- `/api/challenges/send-reminder-emails` - Sends reminder emails to users
- `/api/challenges/cron/upload-reminder` - Upload deadline reminders
- `/api/challenges/cron/process-notifications` - Process pending notifications
- `/api/challenge-uploads/auto-detect` - Auto-detect new YouTube uploads

### Daily Jobs:
- `/api/challenges/cron/morning-reminder` - Morning motivation emails (7 AM UTC)
- `/api/challenges/cron/daily-check` - Daily challenge status updates (every 6 hours)

### Weekly Jobs:
- `/api/challenge-notifications/cron` - Weekly challenge summaries (every 4 hours)

## 🚀 Deployment Steps

### 1. Connect to Vercel

1. Push your code to GitHub
2. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your GitHub repository
5. Configure project settings:
   - Framework Preset: Next.js
   - Root Directory: `/` (default)
   - Build Command: `next build`
   - Output Directory: `.next`

### 2. Configure Environment Variables

During the import process or in Project Settings, add all the environment variables listed above.

### 3. Deploy

Click "Deploy" and wait for the build to complete. Vercel will automatically:

- Install dependencies
- Run the build process
- Deploy your application
- Set up automatic deployments for future pushes

### 4. Verify Deployment

After deployment completes:

1. Visit your deployed URL
2. Check that all pages load correctly
3. Test authentication flows
4. Verify API endpoints work

## 🧪 Testing Email System

### Manual Testing:
```bash
# Test hourly email trigger
curl -X POST https://your-vercel-app.vercel.app/api/trigger-hourly-emails \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"

# Test specific challenge reminder
curl -X GET "https://your-vercel-app.vercel.app/api/challenges/send-reminder-emails?challengeId=YOUR_CHALLENGE_ID&test=true"
```

### Automated Testing:
```bash
# Run verification script
npm run verify:email-system
```

## 📊 Monitoring

### Vercel Dashboard:
- **Analytics** - Traffic, performance metrics
- **Logs** - Function execution logs
- **Deployments** - Deployment history and status

### Cron Job Monitoring:
- Check Vercel logs for cron job executions
- Monitor email delivery through your SMTP provider
- Review database records in Supabase

### Health Checks:
```bash
# Check if API endpoints are responding
curl https://your-vercel-app.vercel.app/api/trigger-hourly-emails
```

## 🔧 Troubleshooting

### Common Issues:

**Build Failures:**
- Check environment variables are correctly set
- Verify all required dependencies are in package.json
- Check for TypeScript/JavaScript errors

**Email Not Sending:**
- Verify SMTP credentials are correct
- Check cron secret matches in environment variables
- Review Vercel function logs for errors

**Authentication Issues:**
- Confirm Google OAuth credentials are correct
- Check NEXTAUTH_URL matches your deployed domain
- Verify redirect URIs in Google Cloud Console

**Database Connection:**
- Confirm Supabase URL and keys are correct
- Check Supabase project is not paused
- Verify RLS policies allow required operations

## 🔄 Continuous Deployment

Once connected, Vercel will automatically:

- Deploy new commits to the main branch
- Create preview deployments for pull requests
- Handle rollbacks if deployments fail
- Cache builds for faster subsequent deployments

## 🛡️ Security Best Practices

1. **Environment Variables:**
   - Never commit sensitive values to git
   - Use strong, random secrets
   - Rotate credentials periodically

2. **Cron Protection:**
   - Always use CRON_SECRET for authorization
   - Monitor unauthorized access attempts
   - Log all cron job executions

3. **Rate Limiting:**
   - Implement rate limiting for API endpoints
   - Monitor for abuse patterns
   - Set up alerts for unusual activity

## 🎉 Success Verification

After deployment, verify these components work:

- [ ] Homepage loads correctly
- [ ] User authentication works
- [ ] YouTube channel connection functions
- [ ] Email system sends test emails
- [ ] Cron jobs execute as scheduled
- [ ] Database operations succeed
- [ ] API endpoints respond correctly

---

Need help? Check the Vercel documentation at [vercel.com/docs](https://vercel.com/docs)