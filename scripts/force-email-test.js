// Manual test: Reset last email sent time to force immediate email sending
const { createClient } = require('@supabase/supabase-js');

async function forceEmailTest() {
  // Load environment variables
  require('dotenv').config({ path: '.env.local' });
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('🔧 Forcing email test by resetting last email timestamps...');
  
  // Reset last_interval_email_sent for all interval-enabled challenges
  const { data: challenges, error } = await supabase
    .from('user_challenges')
    .select('id, challenge_title')
    .eq('status', 'active')
    .eq('interval_email_enabled', true)
    .eq('email_notifications_enabled', true);
  
  if (error) {
    console.error('❌ Error querying challenges:', error);
    return;
  }
  
  console.log(`📋 Found ${challenges?.length || 0} challenges to reset:`);
  
  if (challenges && challenges.length > 0) {
    for (const challenge of challenges) {
      const { error: updateError } = await supabase
        .from('user_challenges')
        .update({ 
          last_interval_email_sent: null 
        })
        .eq('id', challenge.id);
      
      if (updateError) {
        console.error(`❌ Failed to reset challenge ${challenge.id}:`, updateError);
      } else {
        console.log(`✅ Reset challenge: ${challenge.challenge_title}`);
      }
    }
    
    console.log('\n🚀 Triggering email scheduler now...');
    
    // Trigger the scheduler
    try {
      const response = await fetch('http://localhost:3000/api/trigger-email-scheduler', {
        method: 'POST'
      });
      
      const result = await response.json();
      console.log('📧 Scheduler result:', result);
      
    } catch (error) {
      console.error('❌ Error triggering scheduler:', error);
    }
  }
}

forceEmailTest();