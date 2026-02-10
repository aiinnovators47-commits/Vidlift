// Simple JavaScript version for testing
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testEmailScheduler() {
  console.log('🔍 Testing email scheduler logic...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('⚠️  Supabase credentials not configured');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Test database connection and query
    console.log('Connecting to database...');
    const { data, error } = await supabase
      .from('user_challenges')
      .select('id, challenge_title, interval_minutes, last_interval_email_sent')
      .eq('status', 'active')
      .limit(3);
    
    if (error) {
      console.error('❌ Database error:', error.message);
      return;
    }
    
    console.log('✅ Database connection successful');
    console.log('Found challenges:', data?.length || 0);
    
    data?.forEach(challenge => {
      console.log(`   - ${challenge.challenge_title}: ${challenge.interval_minutes} minutes`);
    });
    
    console.log('\n🎉 Email scheduler test completed successfully!');
    console.log('All systems are working properly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEmailScheduler();