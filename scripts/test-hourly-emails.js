// Test script to manually trigger hourly email scheduler
const { createClient } = require('@supabase/supabase-js');

async function testHourlyEmails() {
  // Load environment variables
  require('dotenv').config({ path: '.env.local' });
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const cronSecret = process.env.CRON_SECRET;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    return;
  }
  
  if (!cronSecret) {
    console.error('❌ Missing CRON_SECRET');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('🔧 Testing Hourly Email System...');
  
  // Reset last email sent time for testing (optional)
  console.log('\n📝 Option 1: Reset email timestamps for testing');
  const resetChoice = process.argv[2] === '--reset' ? 'y' : 'n';
  console.log(`Reset choice: ${resetChoice === 'y' ? 'YES - Forcing emails' : 'NO - Normal test'}
`);
  
  if (resetChoice.toLowerCase() === 'y') {
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
    }
  }
  
  console.log('\n🚀 Triggering hourly email scheduler...');
  
  // Trigger the scheduler via API
  try {
    const response = await fetch('http://localhost:3000/api/trigger-hourly-emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    console.log('📧 Scheduler Response:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ Hourly email system test completed successfully!');
      console.log(`📊 Emails Sent: ${result.result?.emailsSent || 0}`);
      console.log(`⏭️  Emails Skipped: ${result.result?.emailsSkipped || 0}`);
      console.log(`❌ Errors: ${result.result?.errors || 0}`);
    }
    
  } catch (error) {
    console.error('❌ Error triggering hourly email scheduler:', error);
  }
}

// Run the test
testHourlyEmails();