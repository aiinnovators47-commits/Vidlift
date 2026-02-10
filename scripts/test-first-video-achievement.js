// Test script to verify First Video Achievement system
const { createClient } = require('@supabase/supabase-js');

async function testFirstVideoAchievement() {
  console.log('🎮 Testing First Video Achievement System...\n');
  
  // Load environment variables
  require('dotenv').config({ path: '.env.local' });
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Test 1: Check if achievements table exists and has data
  console.log('1. Checking achievements table structure...');
  try {
    const { data, error } = await supabase
      .from('challenge_achievements')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Error accessing achievements table:', error);
    } else {
      console.log(`✅ Achievements table accessible - Found ${data?.length || 0} existing achievements`);
      if (data && data.length > 0) {
        console.log('Sample achievements:');
        data.slice(0, 3).forEach(ach => {
          console.log(`  • ${ach.achievement_type}: ${ach.achievement_title} (${ach.points_awarded} pts)`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Database connection error:', error);
  }
  
  // Test 2: Check for users with challenges
  console.log('\n2. Checking users with active challenges...');
  try {
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .limit(3);
    
    if (userError) {
      console.error('❌ Error fetching users:', userError);
      return;
    }
    
    if (users && users.length > 0) {
      for (const user of users) {
        const { data: challenges } = await supabase
          .from('user_challenges')
          .select('id, challenge_title, streak_count, uploads:challenge_uploads(count)')
          .eq('user_id', user.id)
          .eq('status', 'active');
        
        console.log(`\nUser: ${user.email}`);
        console.log(`Active challenges: ${challenges?.length || 0}`);
        
        if (challenges && challenges.length > 0) {
          for (const challenge of challenges) {
            const uploadCount = challenge.uploads?.[0]?.count || 0;
            console.log(`  • ${challenge.challenge_title}`);
            console.log(`    - Streak: ${challenge.streak_count || 0} days`);
            console.log(`    - Uploads: ${uploadCount} videos`);
            
            // Check if they should have first upload achievement
            if (uploadCount >= 1 && (challenge.streak_count || 0) >= 1) {
              console.log(`    🎯 ELIGIBLE for First Steps achievement!`);
              
              // Check if achievement already exists
              const { data: existingAchievements } = await supabase
                .from('challenge_achievements')
                .select('achievement_type')
                .eq('user_id', user.id)
                .eq('challenge_id', challenge.id)
                .eq('achievement_type', 'first_upload');
              
              if (existingAchievements && existingAchievements.length > 0) {
                console.log(`    ✅ First Steps achievement already unlocked`);
              } else {
                console.log(`    ⚠️  First Steps achievement NOT unlocked yet`);
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error checking user challenges:', error);
  }
  
  // Test 3: Simulate first upload scenario
  console.log('\n3. Testing achievement conditions...');
  const testConditions = [
    { totalUploads: 0, currentStreak: 0, shouldUnlock: false, desc: 'No uploads, no streak' },
    { totalUploads: 1, currentStreak: 1, shouldUnlock: true, desc: 'First upload with streak' },
    { totalUploads: 1, currentStreak: 0, shouldUnlock: false, desc: 'First upload but no streak' },
    { totalUploads: 5, currentStreak: 7, shouldUnlock: true, desc: 'Multiple uploads with good streak' }
  ];
  
  testConditions.forEach((condition, index) => {
    const shouldUnlock = condition.totalUploads >= 1 && condition.currentStreak >= 1;
    const status = shouldUnlock === condition.shouldUnlock ? '✅' : '❌';
    console.log(`${status} Condition ${index + 1}: ${condition.desc}`);
    console.log(`   Uploads: ${condition.totalUploads}, Streak: ${condition.currentStreak}`);
    console.log(`   Expected: ${condition.shouldUnlock}, Actual: ${shouldUnlock}\n`);
  });
  
  console.log('✅ First Video Achievement test completed!');
  console.log('\n💡 To test the full flow:');
  console.log('1. Start a new challenge for a user');
  console.log('2. Upload the first video');
  console.log('3. The system should automatically unlock "First Steps" achievement');
  console.log('4. Refresh dashboard to see the achievement badge');
}

testFirstVideoAchievement();