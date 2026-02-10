// Direct test of the email scheduler function
const { createClient } = require('@supabase/supabase-js');

async function directEmailTest() {
  console.log('🚀 Direct Email Scheduler Test');
  
  // Load environment variables
  require('dotenv').config({ path: '.env.local' });
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const cronSecret = process.env.CRON_SECRET;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Check for eligible challenges
  console.log('\n🔍 Checking for eligible challenges...');
  
  const { data: challenges, error: queryError } = await supabase
    .from('user_challenges')
    .select(`
      id,
      user_id,
      challenge_title,
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
    .or('last_interval_email_sent.is.null,last_interval_email_sent.lt.' + getTimestampMinutesAgo(55));

  if (queryError) {
    console.error('❌ Database query error:', queryError);
    return;
  }

  console.log(`📋 Found ${challenges?.length || 0} eligible challenges`);
  
  if (!challenges || challenges.length === 0) {
    console.log('✅ No challenges need emails right now');
    return;
  }

  // Process first challenge as test
  const challenge = challenges[0];
  console.log(`\n🧪 Testing with challenge: ${challenge.challenge_title}`);
  
  const user = Array.isArray(challenge.users) ? challenge.users[0] : challenge.users;
  console.log(`📧 Will send to: ${user?.email || 'No email found'}`);
  
  // Check if user uploaded today
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

  if (todayUpload) {
    console.log('⏭️  User already uploaded today - would skip email');
  } else {
    console.log('✅ User has not uploaded today - would send email');
    
    // Show what data would be included
    const config = challenge.config;
    const durationDays = config?.durationDays || (config?.durationMonths || 2) * 30;
    const targetVideos = Math.ceil(durationDays / (config?.cadenceEveryDays || 1));
    const videosUploaded = Math.round((challenge.completion_percentage || 0) * targetVideos / 100);
    const videosRemaining = targetVideos - videosUploaded;
    const daysRemaining = calculateDaysRemaining(challenge.started_at, durationDays);
    
    console.log('\n📊 Email Content Preview:');
    console.log(`   👤 Hello ${user?.name || 'Creator'}!`);
    console.log(`   🎯 Challenge: ${challenge.challenge_title}`);
    console.log(`   📈 Progress: ${videosUploaded}/${targetVideos} videos (${Math.round(challenge.completion_percentage || 0)}%)`);
    console.log(`   🔥 Streak: ${challenge.streak_count || 0} days`);
    console.log(`   ⭐ Points: ${challenge.points_earned || 0}`);
    console.log(`   ⏰ Days remaining: ${daysRemaining}`);
    console.log(`   📅 Next deadline: ${new Date(challenge.next_upload_deadline).toLocaleDateString()}`);
  }
  
  console.log('\n✅ Direct test completed!');
}

function getTimestampMinutesAgo(minutes) {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutes);
  return date.toISOString();
}

function calculateDaysRemaining(startedAt, durationDays) {
  const start = new Date(startedAt);
  const end = new Date(start);
  end.setDate(end.getDate() + durationDays);

  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

directEmailTest();