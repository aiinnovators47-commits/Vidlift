// Check what's actually in the config field
const { createClient } = require('@supabase/supabase-js');

async function checkConfig() {
  require('dotenv').config({ path: '.env.local' });
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: challenges, error } = await supabase
    .from('user_challenges')
    .select('id, challenge_title, config, started_at')
    .eq('status', 'active')
    .eq('interval_email_enabled', true);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('📊 Challenge Config Data:\n');
  challenges.forEach(challenge => {
    console.log(`📋 ${challenge.challenge_title}`);
    console.log(`   Started: ${new Date(challenge.started_at).toLocaleDateString()}`);
    console.log(`   Config:`, JSON.stringify(challenge.config, null, 2));
    console.log('');
  });
}

checkConfig();
