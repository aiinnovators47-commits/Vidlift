// Script to update all existing challenges to use 24-hour (1440 minutes) intervals for Vercel free plan compliance
import { createClient } from '@supabase/supabase-js'

async function updateExistingChallenges() {
  console.log('🔄 Updating existing challenges to use 24-hour intervals for Vercel free plan...')
  
  // Create Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in environment variables')
    console.error('   Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // First, get all active challenges that have interval emails enabled
    const { data: challenges, error: fetchError } = await supabase
      .from('user_challenges')
      .select('id, challenge_title, interval_minutes')
      .in('status', ['active', 'pending'])
      .eq('interval_email_enabled', true)
    
    if (fetchError) {
      console.error('❌ Error fetching challenges:', fetchError)
      process.exit(1)
    }

    console.log(`📋 Found ${challenges?.length || 0} challenges with interval emails enabled`)

    if (!challenges || challenges.length === 0) {
      console.log('✅ No challenges to update')
      return
    }

    // Update each challenge to use 24-hour (1440 minutes) interval for Vercel free plan compliance
    let updatedCount = 0
    let errorCount = 0
    
    for (const challenge of challenges) {
      try {
        // Update interval_minutes to 1440 (24 hours) if it's less than 60 (1 hour)
        const currentInterval = challenge.interval_minutes || 0
        const newInterval = currentInterval < 60 ? 1440 : currentInterval // Ensure at least 1 hour, default to 24 hours
        
        const { error: updateError } = await supabase
          .from('user_challenges')
          .update({ 
            interval_minutes: newInterval,
            last_interval_email_sent: null // Reset to allow immediate sending with new interval
          })
          .eq('id', challenge.id)
        
        if (updateError) {
          console.error(`❌ Failed to update challenge ${challenge.id} (${challenge.challenge_title}):`, updateError)
          errorCount++
        } else {
          console.log(`✅ Updated challenge "${challenge.challenge_title}" (ID: ${challenge.id}) - interval: ${currentInterval} → ${newInterval} minutes`)
          updatedCount++
        }
      } catch (updateError) {
        console.error(`❌ Error updating challenge ${challenge.id}:`, updateError)
        errorCount++
      }
    }

    console.log('\n📊 Update Summary:')
    console.log(`   ✅ Successfully updated: ${updatedCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)
    console.log(`   ℹ️  All interval emails now comply with Vercel free plan (minimum 1-hour intervals)`)
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

// Run the update function
if (require.main === module) {
  updateExistingChallenges()
    .then(() => {
      console.log('\n🎉 Challenge intervals updated successfully!')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n💥 Error updating challenge intervals:', error)
      process.exit(1)
    })
}

export default updateExistingChallenges