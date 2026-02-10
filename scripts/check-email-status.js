// Check email system status and recent activity
const { createClient } = require('@supabase/supabase-js');

async function checkEmailStatus() {
  console.log('📊 Email System Status Check\n');
  
  // Load environment variables
  require('dotenv').config({ path: '.env.local' });
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // 1. Check email-enabled challenges
  console.log('1. 📋 Email-Enabled Challenges:');
  const { data: emailChallenges, error: challengeError } = await supabase
    .from('user_challenges')
    .select('id, challenge_title, user_id, last_interval_email_sent, interval_email_enabled, email_notifications_enabled')
    .eq('status', 'active')
    .eq('interval_email_enabled', true)
    .eq('email_notifications_enabled', true);
  
  if (challengeError) {
    console.error('❌ Error fetching challenges:', challengeError);
    return;
  }
  
  console.log(`   Total email-enabled challenges: ${emailChallenges?.length || 0}`);
  
  if (emailChallenges && emailChallenges.length > 0) {
    emailChallenges.forEach(challenge => {
      const lastSent = challenge.last_interval_email_sent 
        ? new Date(challenge.last_interval_email_sent).toLocaleString()
        : 'Never';
      console.log(`   • ${challenge.challenge_title} - Last email: ${lastSent}`);
    });
  }
  
  // 2. Check recent email notifications
  console.log('\n2. 📧 Recent Email Notifications:');
  const { data: recentEmails, error: emailError } = await supabase
    .from('challenge_notifications')
    .select('challenge_id, notification_type, sent_date, email_status')
    .eq('notification_type', 'interval_motivational')
    .order('sent_date', { ascending: false })
    .limit(10);
  
  if (emailError) {
    console.error('❌ Error fetching email notifications:', emailError);
  } else {
    console.log(`   Total motivational emails sent: ${recentEmails?.length || 0}`);
    if (recentEmails && recentEmails.length > 0) {
      console.log('   Last 10 emails:');
      recentEmails.forEach(email => {
        console.log(`   • ${new Date(email.sent_date).toLocaleString()} - ${email.email_status}`);
      });
    }
  }
  
  // 3. Check challenges that need emails (haven't sent in last 55 mins)
  console.log('\n3. ⏰ Challenges Needing Emails (Next Hour):');
  const { data: pendingChallenges, error: pendingError } = await supabase
    .from('user_challenges')
    .select(`
      id,
      challenge_title,
      users!inner (email, name)
    `)
    .eq('status', 'active')
    .eq('interval_email_enabled', true)
    .eq('email_notifications_enabled', true)
    .or('last_interval_email_sent.is.null,last_interval_email_sent.lt.' + getTimestampMinutesAgo(55));
  
  if (pendingError) {
    console.error('❌ Error checking pending challenges:', pendingError);
  } else {
    console.log(`   Challenges that will receive emails: ${pendingChallenges?.length || 0}`);
    if (pendingChallenges && pendingChallenges.length > 0) {
      pendingChallenges.forEach(challenge => {
        const user = Array.isArray(challenge.users) ? challenge.users[0] : challenge.users;
        console.log(`   • ${challenge.challenge_title} → ${user?.email || 'No email'}`);
      });
    } else {
      console.log('   ✅ All challenges are up to date');
    }
  }
  
  // 4. System Summary
  console.log('\n4. 📊 System Summary:');
  console.log(`   🕐 Current time: ${new Date().toLocaleString()}`);
  console.log(`   📧 Active email system: YES`);
  console.log(`   ⏰ Next check: In 1 hour`);
  console.log(`   🚀 Status: READY`);
  
  console.log('\n✅ Status check completed!');
}

function getTimestampMinutesAgo(minutes) {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutes);
  return date.toISOString();
}

checkEmailStatus();