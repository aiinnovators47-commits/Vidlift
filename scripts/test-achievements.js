// Test script to verify achievement system
const { createClient } = require('@supabase/supabase-js');

async function testAchievements() {
  // Load environment variables
  require('dotenv').config({ path: '.env.local' });
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('🎮 Testing Achievement System...\n');
  
  // Test 1: Check if achievements table exists
  console.log('1. Checking achievements table structure...');
  try {
    const { data, error } = await supabase
      .from('challenge_achievements')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing achievements table:', error);
    } else {
      console.log('✅ Achievements table accessible');
    }
  } catch (error) {
    console.error('❌ Table access error:', error);
  }
  
  // Test 2: Check sample user achievements
  console.log('\n2. Checking sample user achievements...');
  try {
    const { data: users } = await supabase
      .from('users')
      .select('id, email')
      .limit(3);
    
    if (users && users.length > 0) {
      for (const user of users) {
        const { data: achievements } = await supabase
          .from('challenge_achievements')
          .select('*')
          .eq('user_id', user.id);
        
        console.log(`  User ${user.email}: ${achievements?.length || 0} achievements`);
      }
    }
  } catch (error) {
    console.error('❌ Error checking user achievements:', error);
  }
  
  // Test 3: List all achievement types
  console.log('\n3. Available achievement types:');
  const achievementTypes = [
    'first_upload',
    'streak_7', 
    'streak_14',
    'streak_30',
    'perfect_week',
    'challenge_master',
    'upload_10',
    'upload_25',
    'upload_50',
    'early_bird'
  ];
  
  achievementTypes.forEach(type => {
    console.log(`  • ${type}`);
  });
  
  console.log('\n✅ Achievement system test completed!');
  console.log('\n🚀 To test the full system:');
  console.log('1. Start a new challenge');
  console.log('2. Upload videos to trigger achievements');
  console.log('3. Visit /achievements to see unlocked badges');
  console.log('4. Check dashboard for achievement display');
}

testAchievements();