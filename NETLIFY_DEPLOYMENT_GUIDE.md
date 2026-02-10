# Netlify Deployment Guide

## Environment Variables Setup

For successful Netlify deployment, you need to add the following environment variables in your Netlify dashboard:

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Build & deploy** → **Environment** → **Environment variables**
3. Add these variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXTAUTH_SECRET=your_nextauth_secret_key
NEXTAUTH_URL=https://your-netlify-site.netlify.app
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
YOUTUBE_API_KEY=your_youtube_api_key
GEMINI_API_KEY=your_gemini_api_key
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_gmail_app_password
CRON_SECRET=your_secure_cron_secret_here
```

## Build Settings

The `netlify.toml` file is already configured with:
- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Node.js version**: 18

## Troubleshooting

### Common Issues:

1. **Build fails with "Missing environment variables"**
   - Make sure all required environment variables are added to Netlify dashboard
   - Check that variable names match exactly (case-sensitive)

2. **Deployment succeeds but app doesn't work**
   - Verify `NEXTAUTH_URL` matches your actual Netlify site URL
   - Check that Supabase credentials are correct
   - Ensure Google OAuth redirect URIs include your Netlify URL

3. **API routes not working**
   - Netlify automatically handles Next.js API routes
   - No additional configuration needed

## Local Testing

To test the environment check locally:
```bash
# Test with Netlify environment simulation
NETLIFY=true node scripts/check-env.js

# Normal local development
node scripts/check-env.js
```

## Validation

Run the TOML validation to ensure your `netlify.toml` is correct:
```bash
npm run validate:netlify
```