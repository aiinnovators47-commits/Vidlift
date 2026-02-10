import type { Handler } from '@netlify/functions';

// Define challenge type interface
interface ChallengeWithEmail {
  id: string;
  user_id: string;
  challenge_title: string;
  challenge_description: string;
  started_at: string;
  config: any;
  points_earned: number;
  streak_count: number;
  longest_streak: number;
  missed_days: number;
  completion_percentage: number;
  next_upload_deadline: string;
  interval_minutes: number;
  last_interval_email_sent: string | null;
  users: {
    id: string;
    email: string;
    name: string;
  } | Array<{
    id: string;
    email: string;
    name: string;
  }>;
}

// Netlify Function for email scheduler
const handler: Handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Verify authorization
    const authHeader = event.headers.authorization;
    const cronSecret = process.env.CRON_SECRET || 'dev-secret-key';

    if (authHeader !== `Bearer ${cronSecret}`) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    // Dynamically import Supabase client to reduce initial bundle size
    const { createClient } = await import('@supabase/supabase-js');
    
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Missing Supabase credentials' }),
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔍 Checking for interval emails...');

    // Query active challenges needing interval emails (for hourly emails)
    const { data: eligibleChallenges, error: queryError } = await supabase
      .from('user_challenges')
      .select(`
        id,
        user_id,
        challenge_title,
        challenge_description,
        started_at,
        config,
        points_earned,
        streak_count,
        longest_streak,
        missed_days,
        completion_percentage,
        next_upload_deadline,
        interval_minutes,
        last_interval_email_sent,
        users!inner (
          id,
          email,
          name
        )
      `)
      .eq('status', 'active')
      .eq('interval_email_enabled', true)
      .eq('email_notifications_enabled', true)
      .or(`last_interval_email_sent.is.null,last_interval_email_sent.lt.${getTimestampMinutesAgo(60)}`);

    if (queryError) {
      console.error('❌ Database query error:', queryError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: queryError.message }),
      };
    }

    if (!eligibleChallenges || eligibleChallenges.length === 0) {
      console.log('✅ No challenges need interval emails right now');
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'No challenges need emails',
          emailsSent: 0,
        }),
      };
    }

    console.log(`📧 Found ${eligibleChallenges.length} challenge(s) needing emails`);

    // Filter out expired challenges
    const activeChallenges = eligibleChallenges.filter(challenge => {
      const config = challenge.config as any;
      const durationDays = config?.durationDays || (config?.durationMonths || 2) * 30;
      const endDate = new Date(challenge.started_at);
      endDate.setDate(endDate.getDate() + durationDays);

      const isExpired = new Date() > endDate;
      if (isExpired) {
        console.log(`⏰ Challenge ${challenge.challenge_title} (ID: ${challenge.id}) has expired. Skipping.`);
      }
      return !isExpired;
    });

    console.log(`✅ ${activeChallenges.length} active (non-expired) challenges`);

    let emailsSent = 0;
    let emailsSkipped = 0;
    let errors = 0;

    // Process each active challenge
    for (const challenge of activeChallenges) {
      try {
        const user = Array.isArray(challenge.users) ? challenge.users[0] : challenge.users;

        if (!user?.email) {
          console.warn(`⚠️  No email found for user ${challenge.user_id}`);
          errors++;
          continue;
        }

        // Calculate stats for email
        const config = challenge.config as any;
        const challengeDurationDays = config?.durationDays || (config?.durationMonths || 2) * 30;  // Fixed variable name
        const targetVideos = Math.ceil(challengeDurationDays / (config?.cadenceEveryDays || 1));
        const videosUploaded = Math.round((challenge.completion_percentage || 0) * targetVideos / 100);
        const videosRemaining = targetVideos - videosUploaded;
        const daysRemaining = calculateDaysRemaining(challenge.started_at, challengeDurationDays);

        // Check if user has uploaded a video today before sending motivational email
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const { data: todayUpload } = await supabase
          .from('challenge_uploads')
          .select('id')
          .eq('challenge_id', challenge.id)
          .gte('upload_date', todayStart.toISOString())
          .lte('upload_date', todayEnd.toISOString())
          .single();

        // Skip sending motivational email if video already uploaded today
        if (todayUpload) {
          console.log(`⏭️  Skipping motivational email for ${user.email}: Video already uploaded today`);

          // Still update last_interval_email_sent to prevent repeated checks
          const updateResult = await supabase
            .from('user_challenges')
            .update({ last_interval_email_sent: new Date().toISOString() })
            .eq('id', challenge.id);

          if (updateResult.error) {
            console.error(`❌ Failed to update last_interval_email_sent for challenge ${challenge.id}:`, updateResult.error);
          }

          emailsSkipped++;
          continue;
        }

        // Import sendIntervalMotivationalEmail function dynamically
        const { sendIntervalMotivationalEmail } = await import('../../lib/challengeEmailService');

        // Send motivational email
        await sendIntervalMotivationalEmail({
          userEmail: user.email,
          userName: user.name || 'Creator',
          challenge: {
            id: challenge.id,
            userId: challenge.user_id,
            challengeId: challenge.id,
            challengeTitle: challenge.challenge_title || 'YouTube Challenge',
            challengeDescription: '',
            challengeType: config?.videoType || 'Mixed',
            startedAt: challenge.started_at,
            config: config,
            progress: [],
            status: 'active',
            pointsEarned: challenge.points_earned || 0,
            streakCount: challenge.streak_count || 0,
            longestStreak: challenge.longest_streak || 0,
            missedDays: challenge.missed_days || 0,
            completionPercentage: challenge.completion_percentage || 0,
            nextUploadDeadline: challenge.next_upload_deadline,
            uploads: [],
            durationMonths: config?.durationMonths || 2,
            cadenceEveryDays: config?.cadenceEveryDays || 1,
            videosPerCadence: config?.videosPerCadence || 1,
            videoType: config?.videoType || 'Mixed',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          videosUploaded,
          videosRemaining,
          daysRemaining,
          streakCount: challenge.streak_count || 0,
          pointsEarned: challenge.points_earned || 0
        });

        // Update last_sent_time in database
        const updateResult = await supabase
          .from('user_challenges')
          .update({ last_interval_email_sent: new Date().toISOString() })
          .eq('id', challenge.id);

        if (updateResult.error) {
          console.error(`❌ Failed to update last_sent_time for challenge ${challenge.id}:`, updateResult.error);
          errors++;
          continue;
        }

        // Log to challenge_notifications table
        const notificationResult = await supabase.from('challenge_notifications').insert({
          challenge_id: challenge.id,
          notification_type: 'interval_motivational',
          sent_date: new Date().toISOString(),
          email_status: 'sent',
          email_content: {
            subject: `Keep Going! ${challenge.challenge_title}`,
            to: user.email,
            type: 'interval_motivational'
          }
        });
        
        if (notificationResult.error) {
          console.error('❌ Failed to log notification:', notificationResult.error);
        }

        console.log(`✅ Email sent to ${user.email} (Challenge: ${challenge.challenge_title})`);
        emailsSent++;

      } catch (emailError) {
        console.error(`❌ Error sending email for challenge ${challenge.id}:`, emailError);
        errors++;
      }
    }

    console.log(`\n📊 Batch complete:`);
    console.log(`   ✅ Successful: ${emailsSent}`);
    console.log(`   ⏭️  Skipped (video uploaded): ${emailsSkipped}`);
    console.log(`   ❌ Failed: ${errors}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Email scheduler completed',
        emailsSent,
        emailsSkipped,
        errors,
        totalProcessed: activeChallenges.length,
      }),
    };

  } catch (error: any) {
    console.error('❌ Critical error in email scheduler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Server error' }),
    };
  }
};

/**
 * Helper: Get timestamp N minutes ago in ISO format
 */
function getTimestampMinutesAgo(minutes: number): string {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutes);
  return date.toISOString();
}

/**
 * Helper: Calculate days remaining in challenge
 */
function calculateDaysRemaining(startedAt: string, durationDays: number): number {
  const start = new Date(startedAt);
  const end = new Date(start);
  end.setDate(end.getDate() + durationDays);

  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

export { handler };