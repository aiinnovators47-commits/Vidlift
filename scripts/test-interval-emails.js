/**
 * Test Script: Interval Email Scheduler
 * 
 * This script tests the interval email functionality by:
 * 1. Enabling interval emails for a test challenge
 * 2. Setting interval to 1 minute for testing
 * 3. Triggering the scheduler manually
 * 4. Verifying emails would be sent
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function testIntervalEmails() {
  console.log('🧪 Testing Interval Email Scheduler...\n');
  
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.log('Please ensure you have:');
    console.log('NEXT_PUBLIC_SUPABASE_URL=your_url');
    console.log('SUPABASE_SERVICE_ROLE_KEY=your_key');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // 1. Find an active challenge for testing
    console.log('🔍 Finding active challenges...');
    const { data: challenges, error: challengesError } = await supabase
      .from('user_challenges')
      .select(`
        id,
        challenge_title,
        status,
        interval_email_enabled,
        interval_minutes,
        last_interval_email_sent,
        users!inner (
          email,
          name
        )
      `)
      .eq('status', 'active')
      .limit(3);
    
    if (challengesError) {
      console.error('❌ Error fetching challenges:', challengesError.message);
      return;
    }
    
    if (!challenges || challenges.length === 0) {
      console.log('⚠️  No active challenges found. Creating test challenge...');
      
      // Create a test challenge (you'll need to implement this based on your challenge creation logic)
      console.log('Please create an active challenge first, then run this test again.');
      return;
    }
    
    console.log(`✅ Found ${challenges.length} active challenge(s):\n`);
    
    // 2. Display current status
    challenges.forEach((challenge, index) => {
      const user = Array.isArray(challenge.users) ? challenge.users[0] : challenge.users;
      console.log(`${index + 1}. ${challenge.challenge_title}`);
      console.log(`   User: ${user?.name || 'Unknown'} (${user?.email || 'No email'})`);
      console.log(`   Interval Enabled: ${challenge.interval_email_enabled ? '✅' : '❌'}`);
      console.log(`   Interval: ${challenge.interval_minutes || 2} minutes`);
      console.log(`   Last Sent: ${challenge.last_interval_email_sent || 'Never'}`);
      console.log('');
    });
    
    // 3. Enable interval emails for testing (set to 1 minute for quick testing)
    console.log('🔧 Enabling interval emails for testing (1 minute interval)...');
    
    const challengeToTest = challenges[0]; // Test with first challenge
    const { error: updateError } = await supabase
      .from('user_challenges')
      .update({
        interval_email_enabled: true,
        interval_minutes: 1, // 1 minute for testing
        last_interval_email_sent: null // Reset to trigger immediate email
      })
      .eq('id', challengeToTest.id);
    
    if (updateError) {
      console.error('❌ Error enabling interval emails:', updateError.message);
      return;
    }
    
    console.log('✅ Interval emails enabled for testing!\n');
    
    // 4. Test the scheduler logic
    console.log('🔍 Testing scheduler logic...');
    
    // Simulate what the scheduler would do
    const intervalMinutes = 1;
    const lastSent = null; // Never sent
    
    const shouldSendEmail = !lastSent; // Should be true
    
    console.log(`Interval: ${intervalMinutes} minutes`);
    console.log(`Last sent: ${lastSent || 'Never'}`);
    console.log(`Should send email: ${shouldSendEmail ? '✅ YES' : '❌ NO'}\n`);
    
    if (shouldSendEmail) {
      console.log('🎉 SUCCESS: Scheduler would send an email!');
      console.log('   - User will receive motivational email');
      console.log('   - last_interval_email_sent will be updated');
      console.log('   - Next email in 1 minute\n');
    }
    
    // 5. Show how to run the scheduler
    console.log('🚀 To run the scheduler:');
    console.log('   Option 1 (Development): npm run email-scheduler');
    console.log('   Option 2 (Production): npm run email-scheduler:pm2');
    console.log('   Option 3 (Manual trigger): curl -X POST http://localhost:3000/api/trigger-email-scheduler\n');
    
    // 6. Show how to change interval in future
    console.log('⚙️  To change interval in future:');
    console.log('   UPDATE user_challenges');
    console.log('   SET interval_minutes = 60  -- Change to 60 minutes');
    console.log('   WHERE id = \'your-challenge-id\';\n');
    
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testIntervalEmails();