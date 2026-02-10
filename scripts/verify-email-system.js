// Complete system verification for automatic hourly emails
const { createClient } = require('@supabase/supabase-js');

async function completeSystemCheck() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔍 COMPLETE EMAIL SYSTEM VERIFICATION');
  console.log('═══════════════════════════════════════════════════════════\n');

  require('dotenv').config({ path: '.env.local' });
  
  // 1. Check Environment Variables
  console.log('📋 STEP 1: Environment Variables Check\n');
  
  const requiredEnvVars = {
    'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
    'SMTP_EMAIL': process.env.SMTP_EMAIL,
    'SMTP_PASSWORD': process.env.SMTP_PASSWORD,
    'CRON_SECRET': process.env.CRON_SECRET
  };

  let envIssues = 0;
  Object.entries(requiredEnvVars).forEach(([key, value]) => {
    if (value) {
      console.log(`   ✅ ${key}: Configured`);
    } else {
      console.log(`   ❌ ${key}: MISSING!`);
      envIssues++;
    }
  });

  if (envIssues > 0) {
    console.log(`\n   ⚠️  ${envIssues} environment variable(s) missing!\n`);
    return;
  }

  console.log('\n   ✅ All required environment variables configured\n');

  // 2. Check Database Connection & Challenges
  console.log('📋 STEP 2: Database & Active Challenges\n');

  const supabase = createClient(
    requiredEnvVars['NEXT_PUBLIC_SUPABASE_URL'],
    requiredEnvVars['SUPABASE_SERVICE_ROLE_KEY']
  );

  const { data: challenges, error } = await supabase
    .from('user_challenges')
    .select(`
      id,
      challenge_title,
      user_id,
      started_at,
      status,
      config,
      interval_email_enabled,
      email_notifications_enabled,
      last_interval_email_sent,
      users!inner (
        id,
        email,
        name
      )
    `)
    .eq('status', 'active');

  if (error) {
    console.log(`   ❌ Database Error: ${error.message}\n`);
    return;
  }

  console.log(`   ✅ Database Connection: Working`);
  console.log(`   📊 Total Active Challenges: ${challenges?.length || 0}\n`);

  if (!challenges || challenges.length === 0) {
    console.log('   ⚠️  No active challenges found!\n');
    return;
  }

  // 3. Analyze Each Challenge
  console.log('📋 STEP 3: Challenge Analysis\n');

  let eligibleForEmail = 0;
  let issuesFound = 0;

  challenges.forEach((challenge, index) => {
    const user = Array.isArray(challenge.users) ? challenge.users[0] : challenge.users;
    const config = challenge.config || {};
    const durationDays = config.durationDays || (config.durationMonths || 2) * 30;

    console.log(`${index + 1}. ${challenge.challenge_title}`);
    console.log(`   👤 User: ${user?.name || 'Unknown'} (${user?.email || 'NO EMAIL'})`);
    console.log(`   📅 Started: ${new Date(challenge.started_at).toLocaleDateString()}`);
    console.log(`   ⏱️  Duration: ${durationDays} days`);
    
    // Check email settings
    console.log(`   📧 Email Settings:`);
    
    if (!user?.email) {
      console.log(`      ❌ NO EMAIL ADDRESS - Cannot send emails!`);
      issuesFound++;
    } else {
      console.log(`      ✅ Email: ${user.email}`);
    }

    if (challenge.interval_email_enabled) {
      console.log(`      ✅ Interval emails: ENABLED`);
    } else {
      console.log(`      ❌ Interval emails: DISABLED`);
      issuesFound++;
    }

    if (challenge.email_notifications_enabled) {
      console.log(`      ✅ Email notifications: ENABLED`);
    } else {
      console.log(`      ❌ Email notifications: DISABLED`);
      issuesFound++;
    }

    // Check if eligible for email
    const lastSent = challenge.last_interval_email_sent;
    const canSendEmail = challenge.interval_email_enabled && 
                         challenge.email_notifications_enabled && 
                         user?.email;

    if (canSendEmail) {
      eligibleForEmail++;
      console.log(`   📬 Email Status: WILL RECEIVE HOURLY EMAILS ✅`);
    } else {
      console.log(`   📬 Email Status: WILL NOT RECEIVE EMAILS ❌`);
    }

    // Check expiration
    const endDate = new Date(challenge.started_at);
    endDate.setDate(endDate.getDate() + durationDays);
    const daysRemaining = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining <= 0) {
      console.log(`   ⚠️  EXPIRED - Will be skipped by email system`);
    } else {
      console.log(`   ⏰ Days Remaining: ${daysRemaining}`);
    }

    console.log('');
  });

  // 4. Email Sending Test (Dry Run)
  console.log('📋 STEP 4: Email Logic Simulation\n');
  
  console.log(`   Challenges that will receive emails: ${eligibleForEmail}`);
  console.log(`   Issues found: ${issuesFound}\n`);

  if (eligibleForEmail > 0) {
    console.log('   📧 Email sending logic:');
    console.log('   • Every hour on the hour (0 * * * *)');
    console.log('   • Checks if user uploaded today');
    console.log('   • If NO upload → Send motivational email');
    console.log('   • If YES upload → Skip (no spam)\n');
  }

  // 5. Deployment Check
  console.log('📋 STEP 5: Deployment Requirements\n');

  const fs = require('fs');
  
  // Check vercel.json
  if (fs.existsSync('vercel.json')) {
    const vercelConfig = fs.readFileSync('vercel.json', 'utf8');
    if (vercelConfig.includes('crons')) {
      console.log('   ✅ Vercel cron configured (vercel.json)');
    } else {
      console.log('   ⚠️  Vercel cron NOT configured');
    }
  }

  console.log('\n   📝 Note: Hourly emails only work when DEPLOYED to:');
  console.log('      - Vercel (with cron jobs)\n');

  // 6. Final Summary
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 FINAL SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');

  if (envIssues === 0 && eligibleForEmail > 0 && issuesFound === 0) {
    console.log('   🎉 SYSTEM STATUS: READY ✅\n');
    console.log('   ✅ All environment variables configured');
    console.log('   ✅ Database connection working');
    console.log(`   ✅ ${eligibleForEmail} challenge(s) will receive emails`);
    console.log('   ✅ No critical issues found\n');
    console.log('   🚀 ACTION REQUIRED:');
    console.log('      Deploy to Netlify or Vercel to activate hourly emails!\n');
    console.log('   📧 WHAT HAPPENS AFTER DEPLOYMENT:');
    console.log('      • Every hour, system checks all active challenges');
    console.log('      • For 30-day challenge: Sends max 720 emails (30 days × 24 hours)');
    console.log('      • For 60-day challenge: Sends max 1440 emails (60 days × 24 hours)');
    console.log('      • BUT: Only sends if user has NOT uploaded that day');
    console.log('      • Smart logic prevents spam\n');
  } else {
    console.log('   ⚠️  SYSTEM STATUS: NEEDS ATTENTION\n');
    if (envIssues > 0) {
      console.log(`   ❌ ${envIssues} environment variable(s) missing`);
    }
    if (issuesFound > 0) {
      console.log(`   ❌ ${issuesFound} issue(s) found with challenges`);
    }
    if (eligibleForEmail === 0) {
      console.log('   ❌ No challenges eligible for emails');
    }
    console.log('\n   Fix the issues above before deploying.\n');
  }

  console.log('═══════════════════════════════════════════════════════════\n');
}

completeSystemCheck();
