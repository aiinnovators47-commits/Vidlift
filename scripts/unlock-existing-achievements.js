// Script to retroactively unlock First Video achievements for existing users
const { createClient } = require('@supabase/supabase-js');

async function unlockExistingAchievements() {
  console.log('🔓 Unlocking existing First Video achievements...\n');
  
  // Load environment variables
  require('dotenv').config({ path: '.env.local' });
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Get all active challenges with uploads and streaks
    console.log('🔍 Finding eligible users for First Steps achievement...');
    
    const { data: challenges, error: challengeError } = await supabase
      .from('user_challenges')
      .select(`
        id,
        user_id,
        challenge_title,
        streak_count,
        uploads:challenge_uploads(count),
        users!inner(email, name)
      `)
      .eq('status', 'active')
      .gt('streak_count', 0); // Only challenges with streaks
    
    if (challengeError) {
      console.error('❌ Error fetching challenges:', challengeError);
      return;
    }
    
    console.log(`📋 Found ${challenges?.length || 0} challenges with streaks`);
    
    let achievementsUnlocked = 0;
    
    if (challenges && challenges.length > 0) {
      for (const challenge of challenges) {
        const uploadCount = challenge.uploads?.[0]?.count || 0;
        const user = challenge.users;
        
        console.log(`\n📋 Challenge: ${challenge.challenge_title}`);
        console.log(`   User: ${user?.email || 'Unknown'}`);
        console.log(`   Uploads: ${uploadCount}, Streak: ${challenge.streak_count}`);
        
        // Check if eligible for First Steps achievement
        if (uploadCount >= 1 && challenge.streak_count >= 1) {
          // Check if achievement already exists
          const { data: existingAchievements } = await supabase
            .from('challenge_achievements')
            .select('id')
            .eq('user_id', challenge.user_id)
            .eq('challenge_id', challenge.id)
            .eq('achievement_type', 'first_upload');
          
          if (existingAchievements && existingAchievements.length > 0) {
            console.log(`   ⚠️  First Steps already unlocked`);
            continue;
          }
          
          // Unlock the achievement
          const { data: newAchievement, error: insertError } = await supabase
            .from('challenge_achievements')
            .insert({
              user_id: challenge.user_id,
              challenge_id: challenge.id,
              achievement_type: 'first_upload',
              achievement_title: 'First Steps',
              achievement_description: 'Uploaded your first challenge video',
              points_awarded: 50
            })
            .select()
            .single();
          
          if (insertError) {
            console.error(`   ❌ Failed to unlock achievement:`, insertError);
          } else {
            console.log(`   ✅ First Steps achievement unlocked! (+50 points)`);
            achievementsUnlocked++;
            
            // Award points to the challenge
            const { error: pointsError } = await supabase
              .from('user_challenges')
              .update({
                points_earned: (await getCurrentPoints(supabase, challenge.user_id)) + 50
              })
              .eq('id', challenge.id);
            
            if (pointsError) {
              console.warn(`   ⚠️  Failed to award points:`, pointsError);
            }
          }
        } else {
          console.log(`   ℹ️  Not eligible for First Steps (needs at least 1 upload and 1 streak)`);
        }
      }
    }
    
    console.log(`\n🎉 Summary:`);
    console.log(`   Achievements unlocked: ${achievementsUnlocked}`);
    console.log(`   Users affected: ${achievementsUnlocked > 0 ? 'Yes' : 'None'}`);
    
    // Show current achievements
    console.log('\n📊 Current achievements in system:');
    const { data: allAchievements } = await supabase
      .from('challenge_achievements')
      .select('achievement_type, achievement_title, points_awarded, users(email)')
      .order('unlocked_at', { ascending: false })
      .limit(10);
    
    if (allAchievements && allAchievements.length > 0) {
      allAchievements.forEach(ach => {
        console.log(`   • ${ach.achievement_title} (${ach.points_awarded} pts) - ${ach.users?.email || 'Unknown user'}`);
      });
    } else {
      console.log('   No achievements found');
    }
    
    console.log('\n✅ Achievement unlocking process completed!');
    
  } catch (error) {
    console.error('❌ Error in achievement unlocking:', error);
  }
}

async function getCurrentPoints(supabase, userId) {
  try {
    const { data } = await supabase
      .from('user_challenges')
      .select('points_earned')
      .eq('user_id', userId);
    
    return data?.reduce((sum, challenge) => sum + (challenge.points_earned || 0), 0) || 0;
  } catch (error) {
    console.error('Error getting current points:', error);
    return 0;
  }
}

unlockExistingAchievements();