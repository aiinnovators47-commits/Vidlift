/**
 * Netlify Email Automation Setup Script
 * 
 * This script helps configure your database for hourly email automation on Netlify.
 * Run this script after deploying to Netlify to enable interval emails for all active challenges.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function setupNetlifyEmailAutomation() {
  console.log('🚀 Setting up Netlify email automation...\n');

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials!');
    console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Enable interval emails for all active challenges with 60-minute intervals (1 hour)
    console.log('📝 Enabling hourly interval emails for active challenges...');
    
    const { data, error } = await supabase
      .from('user_challenges')
      .update({ 
        interval_email_enabled: true,
        interval_minutes: 60, // 60 minutes = 1 hour for Netlify deployment
        last_interval_email_sent: null // Reset to allow immediate sending
      })
      .eq('status', 'active')
      .eq('email_notifications_enabled', true)
      .select('id, challenge_title');

    if (error) {
      console.error('❌ Error enabling interval emails:', error);
      process.exit(1);
    }

    if (data && data.length > 0) {
      console.log(`✅ Successfully enabled interval emails for ${data.length} challenges:`);
      data.forEach(challenge => {
        console.log(`   - ${challenge.challenge_title} (ID: ${challenge.id})`);
      });
    } else {
      console.log('ℹ️  No active challenges found to enable interval emails for.');
    }

    // Verify the changes
    console.log('\n🔍 Verifying changes...');
    const { data: verifiedData, error: verifyError } = await supabase
      .from('user_challenges')
      .select(`
        id,
        challenge_title,
        interval_email_enabled,
        interval_minutes,
        last_interval_email_sent
      `)
      .eq('interval_email_enabled', true)
      .limit(10); // Just show first 10 for verification

    if (verifyError) {
      console.error('❌ Error verifying changes:', verifyError);
      process.exit(1);
    }

    if (verifiedData && verifiedData.length > 0) {
      console.log(`✅ Verified ${verifiedData.length} challenges with interval emails enabled:`);
      verifiedData.forEach(challenge => {
        console.log(`   - ${challenge.challenge_title}: ${challenge.interval_minutes} min interval`);
      });
    }

    console.log('\n🎉 Netlify email automation setup complete!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Make sure your environment variables are set in Netlify dashboard');
    console.log('   2. Configure an external cron service to hit your email scheduler hourly');
    console.log('   3. Monitor your email delivery and function logs');
    console.log('\n💡 Tip: Your emails will now be sent every hour to active challenge participants!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupNetlifyEmailAutomation().catch(console.error);
}

module.exports = { setupNetlifyEmailAutomation };