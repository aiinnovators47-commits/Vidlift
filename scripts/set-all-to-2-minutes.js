/**
 * Script to set ALL challenges to 2-minute interval
 * 
 * This updates both existing challenges and ensures future challenges
 * will default to 2-minute intervals.
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function setAllChallengesTo2Minutes() {
  console.log('🔧 Setting ALL challenges to 2-minute interval...\n');
  
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // 1. Update ALL active challenges to 2 minutes
    console.log('Updating existing active challenges...');
    const { data: updatedChallenges, error: updateError } = await supabase
      .from('user_challenges')
      .update({
        interval_email_enabled: true,
        interval_minutes: 2,
        last_interval_email_sent: null // Reset timer to send immediately
      })
      .eq('status', 'active')
      .select('id, challenge_title');
    
    if (updateError) {
      console.error('❌ Error updating challenges:', updateError.message);
      return;
    }
    
    console.log(`✅ Updated ${updatedChallenges?.length || 0} active challenges to 2-minute interval\n`);
    
    // 2. Show what was updated
    if (updatedChallenges && updatedChallenges.length > 0) {
      console.log('📋 Updated challenges:');
      updatedChallenges.forEach((challenge, index) => {
        console.log(`   ${index + 1}. ${challenge.challenge_title} (ID: ${challenge.id})`);
      });
      console.log('');
    }
    
    // 3. Verify the update
    console.log('🔍 Verifying update...');
    const { data: verification, error: verifyError } = await supabase
      .from('user_challenges')
      .select('challenge_title, interval_minutes, interval_email_enabled')
      .eq('status', 'active')
      .limit(5);
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
      return;
    }
    
    console.log('✅ Current configuration:');
    verification?.forEach(challenge => {
      console.log(`   ${challenge.challenge_title}: ${challenge.interval_minutes} minutes (${challenge.interval_email_enabled ? 'ENABLED' : 'DISABLED'})`);
    });
    
    console.log('\n🎉 ALL CHALLENGES NOW SET TO 2-MINUTE INTERVALS!');
    console.log('📧 Users will receive motivational emails every 2 minutes if they haven\'t uploaded today.');
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
  }
}

// Run the script
setAllChallengesTo2Minutes();