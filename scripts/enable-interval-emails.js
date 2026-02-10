// Fix: Enable interval emails for all active challenges
const { createClient } = require('@supabase/supabase-js');

async function enableIntervalEmails() {
  console.log('🔧 Enabling interval emails for all active challenges...\n');

  require('dotenv').config({ path: '.env.local' });
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get all active challenges where interval_email is disabled but email_notifications is enabled
  const { data: challenges, error: fetchError } = await supabase
    .from('user_challenges')
    .select('id, challenge_title, user_id, interval_email_enabled, email_notifications_enabled')
    .eq('status', 'active')
    .eq('email_notifications_enabled', true);

  if (fetchError) {
    console.error('❌ Error fetching challenges:', fetchError);
    return;
  }

  if (!challenges || challenges.length === 0) {
    console.log('✅ No challenges found to update.\n');
    return;
  }

  console.log(`📋 Found ${challenges.length} active challenge(s):\n`);

  let updated = 0;
  let alreadyEnabled = 0;

  for (const challenge of challenges) {
    if (challenge.interval_email_enabled) {
      console.log(`✅ ${challenge.challenge_title} - Already enabled`);
      alreadyEnabled++;
    } else {
      console.log(`🔄 ${challenge.challenge_title} - Enabling interval emails...`);
      
      const { error: updateError } = await supabase
        .from('user_challenges')
        .update({ 
          interval_email_enabled: true,
          interval_minutes: 60
        })
        .eq('id', challenge.id);

      if (updateError) {
        console.error(`   ❌ Failed: ${updateError.message}`);
      } else {
        console.log(`   ✅ Enabled!`);
        updated++;
      }
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`   ✅ Updated: ${updated} challenge(s)`);
  console.log(`   ℹ️  Already enabled: ${alreadyEnabled} challenge(s)`);
  console.log(`   📧 Total challenges with emails: ${updated + alreadyEnabled}\n`);
  
  if (updated > 0) {
    console.log('🎉 SUCCESS! All active challenges will now receive hourly emails!\n');
  }

  console.log('═══════════════════════════════════════════════════════════\n');
}

enableIntervalEmails();
