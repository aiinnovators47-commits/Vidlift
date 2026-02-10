# 📧 How to Change Email Interval

## 🎯 Current Configuration

The interval email scheduler is currently configured to send motivational emails **every 60 minutes** to users who haven't uploaded their daily video.

## ⚙️ How to Change the Interval

### Option 1: Change for Specific Challenge

```sql
-- Change interval for a specific challenge
UPDATE user_challenges 
SET interval_minutes = 30  -- Change to 30 minutes
WHERE id = 'your-challenge-uuid';

-- Examples:
-- Every 10 minutes: interval_minutes = 10
-- Every 30 minutes: interval_minutes = 30  
-- Every 2 hours: interval_minutes = 120
-- Every 6 hours: interval_minutes = 360
-- Every 12 hours: interval_minutes = 720
-- Every 24 hours: interval_minutes = 1440
```

### Option 2: Change for All Active Challenges

```sql
-- Change interval for all active challenges
UPDATE user_challenges 
SET interval_minutes = 60  -- Change to 60 minutes
WHERE status = 'active' 
  AND interval_email_enabled = true;
```

### Option 3: Disable Interval Emails Completely

```sql
-- Turn off interval emails for specific challenge
UPDATE user_challenges 
SET interval_email_enabled = false
WHERE id = 'your-challenge-uuid';

-- Or disable for all challenges
UPDATE user_challenges 
SET interval_email_enabled = false;
```

### Option 4: Reset Email Timer (Send Immediately)

```sql
-- Reset last sent time to trigger immediate email
UPDATE user_challenges 
SET last_interval_email_sent = NULL
WHERE id = 'your-challenge-uuid';
```

## 📊 Common Interval Values

| Interval | Value (minutes) | Use Case |
|----------|----------------|----------|
| 1 minute | 1 | Testing only |
| 2 minutes | 2 | Very frequent reminders |
| 5 minutes | 5 | High engagement |
| 10 minutes | 10 | Moderate reminders |
| 30 minutes | 30 | Balanced approach |
| 60 minutes | 60 | **Current default** |
| 120 minutes | 120 | 2 hours |
| 240 minutes | 240 | 4 hours |
| 360 minutes | 360 | 6 hours |
| 720 minutes | 720 | 12 hours |
| 1440 minutes | 1440 | 24 hours |

## 🔧 Testing New Intervals

### 1. Test with Short Interval (1-5 minutes)

```sql
-- For testing purposes only
UPDATE user_challenges 
SET 
  interval_minutes = 1,  -- 1 minute for testing
  last_interval_email_sent = NULL  -- Reset timer
WHERE id = 'test-challenge-id';
```

### 2. Run Test Script

```bash
npm run test:interval-emails
```

### 3. Monitor Results

Check the console output and database:
```sql
-- Check when last email was sent
SELECT 
  challenge_title,
  interval_minutes,
  last_interval_email_sent,
  NOW() as current_time
FROM user_challenges 
WHERE id = 'test-challenge-id';
```

## 🚀 Production Deployment

### For Vercel Deployment:

1. **Update the database** with your desired interval:
   ```sql
   UPDATE user_challenges 
   SET interval_minutes = 60
   WHERE status = 'active';
   ```

2. **The Vercel cron job** (`* * * * *`) will automatically:
   - Run every minute
   - Check which challenges are due for emails
   - Send emails based on each challenge's `interval_minutes` setting

3. **No code changes needed** - the scheduler reads `interval_minutes` from the database

## 📈 Monitoring

### Check Email Status:
```sql
SELECT 
  challenge_title,
  interval_email_enabled,
  interval_minutes,
  last_interval_email_sent,
  CASE 
    WHEN last_interval_email_sent IS NULL THEN 'Ready to send'
    WHEN NOW() - last_interval_email_sent > (interval_minutes * INTERVAL '1 minute') THEN 'Ready to send'
    ELSE 'Waiting'
  END as status
FROM user_challenges 
WHERE status = 'active';
```

### View Email Logs:
```sql
SELECT 
  challenge_id,
  notification_type,
  sent_date,
  email_status,
  email_content
FROM challenge_notifications 
WHERE notification_type = 'interval_motivational'
ORDER BY sent_date DESC
LIMIT 10;
```

## ⚠️ Important Notes

1. **Minimum Interval**: 1 minute (for testing only)
2. **Recommended Production Interval**: 30-120 minutes
3. **Maximum Interval**: 1440 minutes (24 hours)
4. **Database Performance**: Intervals under 5 minutes may cause high database load
5. **Email Rate Limits**: Consider your SMTP provider's rate limits

## 🆘 Troubleshooting

**Problem**: Emails not sending at expected interval
- Check `interval_email_enabled = true`
- Verify `interval_minutes` value
- Confirm `last_interval_email_sent` is being updated

**Problem**: Too many emails
- Increase `interval_minutes`
- Set `interval_email_enabled = false` temporarily

**Problem**: Not enough emails
- Decrease `interval_minutes`
- Reset `last_interval_email_sent = NULL`

## 🎉 Summary

Changing the email interval is simple:
1. Update `interval_minutes` in the database
2. The scheduler automatically uses the new value
3. No code changes or deployments required
4. Changes take effect immediately

The system is designed to be **flexible and easy to configure** without requiring code modifications!