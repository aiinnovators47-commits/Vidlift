# 🔧 Auto-Detect Debugging Guide

## Issue: Video Not Auto-Detecting After Upload

If your video is not being detected automatically, follow these steps:

---

## Step 1: Check Browser Console (F12)

### Open Developer Tools
1. Press **F12** on your keyboard
2. Click the **Console** tab
3. Refresh the challenge page

### Look for These Logs

#### ✅ Good Signs (Auto-detect is running):
```
📅 Today is upload deadline and no upload detected yet - triggering auto-detect...
🔄 Auto-detecting videos from YouTube...
Challenge ID: [some-id]
User ID: [your-user-id]
Next deadline: [date]
API Response: {syncedCount: 1}
✅ Auto-detected 1 video(s)
Refreshing challenge data...
```

#### ❌ Bad Signs (Auto-detect NOT running):
```
No logs appear
OR
Error messages appear
```

---

## Step 2: Manual Detection Button

Instead of waiting for auto-detect, **click the "Auto-Detect" button manually**:

1. Go to challenge page
2. Scroll to "Record Your Upload" section
3. Click **🔄 Auto-Detect** button
4. Watch the browser console for logs

### What to Look For:
- Does loading animation appear?
- Any errors in console?
- Does API return `syncedCount: 0` or `syncedCount: 1`?

---

## Step 3: Check Video Upload Date

The system only detects videos uploaded **ON the deadline day**.

### Example:
- Deadline: February 5, 2026
- Your video uploaded: February 5, 2026 ✅ Will be detected
- Your video uploaded: February 4, 2026 ❌ Won't be detected (too early)
- Your video uploaded: February 6, 2026 ❌ Won't be detected (too late)

### How to Check:
1. Go to YouTube Studio
2. Check the upload date/time of your video
3. Compare with the challenge deadline

---

## Step 4: Verify YouTube Channel Connection

Make sure your YouTube channel is connected:

1. Go to `/connect` page
2. Check if you see "Connected" status
3. If not connected, click "Connect YouTube Channel"
4. Authorize the app

### Required YouTube Permissions:
- Read channel info
- Read video details
- Read video statistics

---

## Step 5: Check API Response Manually

### Open Network Tab (F12):
1. Click **Network** tab in DevTools
2. Click "Auto-Detect" button
3. Look for the request to `/api/challenges/sync-uploads`
4. Click on it
5. Check the **Response** tab

### Expected Response (Success):
```json
{
  "syncedCount": 1,
  "results": [
    {
      "challengeId": "...",
      "status": "synced",
      "videoTitle": "My Video"
    }
  ]
}
```

### Expected Response (No Video Found):
```json
{
  "syncedCount": 0,
  "results": []
}
```

### Error Response:
```json
{
  "error": "No YouTube channel connected"
}
```
OR
```json
{
  "error": "YouTube API error"
}
```

---

## Step 6: Check Database Directly

### In Supabase Dashboard:

1. Go to [Supabase Dashboard](https://supabase.com)
2. Select your project
3. Navigate to **Table Editor**
4. Open `challenge_uploads` table
5. Filter by your `user_id` and today's date

### Query Example:
```sql
SELECT * FROM challenge_uploads 
WHERE user_id = 'your-user-id' 
AND upload_date::date = CURRENT_DATE;
```

If you see your video here → API worked, but UI not refreshing
If you DON'T see your video → API didn't save it

---

## Step 7: Force Refresh

Sometimes the UI doesn't update even after the video is saved.

### Try These:
1. **Hard Refresh:** Ctrl + Shift + R (Windows) or Cmd + Shift + R (Mac)
2. **Clear Cache:** Ctrl + Shift + Delete
3. **Close and Reopen:** Close browser tab and reopen

---

## Common Issues & Solutions

### Issue 1: "No YouTube channel connected"
**Solution:**
1. Go to `/connect` page
2. Connect your YouTube channel
3. Come back to challenge page
4. Click "Auto-Detect" button

### Issue 2: "YouTube API error"
**Solution:**
- YouTube access token expired
- Go to `/connect` page
- Disconnect and reconnect your channel
- Try auto-detect again

### Issue 3: "No videos found"
**Solution:**
- Check video upload date matches deadline date
- Make sure video is **public** or **unlisted** (not private)
- Video might not have synced to YouTube yet (wait 1-2 minutes)

### Issue 4: Auto-detect runs but shows 0 videos
**Solution:**
- Video was uploaded on wrong day
- Check console logs for API response
- Check YouTube Studio for actual upload date

### Issue 5: Loading animation shows forever
**Solution:**
- API is stuck or errored
- Check browser console for errors
- Refresh the page
- Try manual button again

---

## Step 8: Test with These Console Commands

Open browser console (F12) and run:

### Check if today is deadline:
```javascript
const deadline = new Date('[YOUR_DEADLINE_DATE]')
const today = new Date()
console.log('Deadline:', deadline.toDateString())
console.log('Today:', today.toDateString())
console.log('Is today deadline?', deadline.toDateString() === today.toDateString())
```

### Manually trigger auto-detect:
```javascript
fetch('/api/challenges/sync-uploads', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ challengeId: '[YOUR_CHALLENGE_ID]' })
})
.then(res => res.json())
.then(data => console.log('API Response:', data))
```

---

## Step 9: What the Console Should Show

### When Auto-Detect Works:

```
📅 Today is upload deadline and no upload detected yet - triggering auto-detect...
Current uploads: []
🔄 Auto-detecting videos from YouTube...
Challenge ID: abc123
User ID: user@example.com
Next deadline: Wed Feb 05 2026
API Response: {
  syncedCount: 1,
  results: [
    {
      challengeId: "abc123",
      status: "synced",
      videoTitle: "My Awesome Video"
    }
  ]
}
✅ Auto-detected 1 video(s)
Refreshing challenge data...
```

### When No Video Found:

```
📅 Today is upload deadline and no upload detected yet - triggering auto-detect...
Current uploads: []
🔄 Auto-detecting videos from YouTube...
Challenge ID: abc123
User ID: user@example.com
Next deadline: Wed Feb 05 2026
API Response: {syncedCount: 0, results: []}
No videos detected yet, user can try manual button
```

---

## Step 10: Last Resort - Manual Entry

If auto-detect still doesn't work:

1. Go to "Record Your Upload" section
2. Click **📝 Paste Video URL**
3. Paste your YouTube video URL
4. Click **Submit**
5. Video will be saved manually

---

## Important Notes

### Auto-Detect Conditions:
- ✅ Today must be the deadline day
- ✅ No upload for today exists yet
- ✅ YouTube channel must be connected
- ✅ Video must be uploaded on deadline day
- ✅ Video must be public or unlisted
- ✅ Access token must be valid

### Timing:
- Auto-detect runs on page load
- Waits 500ms before triggering
- Can take 1-2 seconds to complete
- Loading animation shows during process

### Manual Override:
- You can ALWAYS use the "Auto-Detect" button
- Button works even if auto-detect didn't run
- Same API, just manual trigger

---

## Need More Help?

### Check These Files:
- **Component:** `/components/upload-tracking-panel-v2.tsx`
- **API:** `/app/api/challenges/sync-uploads/route.ts`
- **Logs:** Browser console (F12)

### Enable More Logging:
All console.log statements are already in place. Just open F12 console and watch!

---

## Quick Checklist

Before reporting an issue, verify:

- [ ] Browser console is open (F12)
- [ ] Today is the deadline day
- [ ] YouTube channel is connected
- [ ] Video was uploaded TODAY
- [ ] Video is public/unlisted (not private)
- [ ] Clicked "Auto-Detect" button manually
- [ ] Checked API response in Network tab
- [ ] Checked database for saved video
- [ ] Tried hard refresh (Ctrl+Shift+R)

---

**If all else fails, use the manual "Paste Video URL" option!**
