// Test upload detection functionality
const { createClient } = require('@supabase/supabase-js');

async function testUploadDetection() {
  // Load environment variables
  require('dotenv').config({ path: '.env.local' });
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('🔍 Testing upload detection...');
  
  // Get today's date range
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  
  console.log('Today range:', todayStart.toISOString(), 'to', todayEnd.toISOString());
  
  // Check for uploads today
  const { data: todayUploads, error } = await supabase
    .from('challenge_uploads')
    .select('id, challenge_id, upload_date, video_title')
    .gte('upload_date', todayStart.toISOString())
    .lte('upload_date', todayEnd.toISOString());
  
  if (error) {
    console.error('❌ Error querying uploads:', error);
    return;
  }
  
  console.log(`✅ Found ${todayUploads?.length || 0} uploads today:`);
  if (todayUploads && todayUploads.length > 0) {
    todayUploads.forEach(upload => {
      console.log(`  - Challenge ${upload.challenge_id}: ${upload.video_title || 'No title'} (${upload.upload_date})`);
    });
  } else {
    console.log('  - No uploads found for today');
  }
  
  // Check challenges that should have interval emails
  const { data: challenges, error: challengeError } = await supabase
    .from('user_challenges')
    .select(`
      id,
      challenge_title,
      last_interval_email_sent,
      interval_email_enabled,
      email_notifications_enabled,
      users!inner(email)
    `)
    .eq('status', 'active')
    .eq('interval_email_enabled', true)
    .eq('email_notifications_enabled', true);
  
  if (challengeError) {
    console.error('❌ Error querying challenges:', challengeError);
    return;
  }
  
  console.log(`\n📋 Active interval-enabled challenges (${challenges?.length || 0}):`);
  if (challenges) {
    challenges.forEach(challenge => {
      const userEmail = Array.isArray(challenge.users) ? challenge.users[0].email : challenge.users.email;
      console.log(`  - ${challenge.challenge_title}`);
      console.log(`    Email: ${userEmail}`);
      console.log(`    Last email sent: ${challenge.last_interval_email_sent || 'Never'}`);
      console.log(`    Should send now: ${!challenge.last_interval_email_sent || new Date(challenge.last_interval_email_sent) < new Date(Date.now() - 2 * 60 * 1000)}`);
    });
  }
}

testUploadDetection();